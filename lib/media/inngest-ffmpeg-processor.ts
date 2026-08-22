/**
 * InngestFFmpegProcessor — implementation DUY NHẤT của MediaProcessor (PRD 4.0.4,
 * DECISIONS.md §31). 2026-08-23.
 *
 * Thiết kế:
 * - ffmpeg stream copy (-c:a copy) KHÔNG re-encode; segment -segment_time 2700 (45p)
 *   cắt theo keyframe → segment thực tế 30-60p.
 * - Đọc file gốc R2 qua HTTP Range từng chunk 500MB/step (Vercel step ≤300s).
 * - Chỉ kích hoạt cho audio/video ≥100MB (shouldUseMediaProcessor).
 * - handleFailure phân loại: corrupt_file | timeout | quota_exceeded | unknown.
 *
 * ponytail: ffmpeg binary phải có sẵn trong môi trường chạy (local: C:/Users/<user>/bin;
 * production: container image cần cài ffmpeg). Upgrade path: bundle static build
 * hoặc chuyển sang Cloudflare Container Workers khi Vercel hỗ trợ.
 */
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import os from 'os';
import fsSync from 'fs';
import type { ChildProcess } from 'child_process';

import type {
  MediaInfo,
  MediaProcessor,
  Segment,
  ProcessorFailureKind,
} from './processor';

const RANGE_CHUNK = 500 * 1024 * 1024; // 500MB/step (DECISIONS.md §31.2)
const SEGMENT_SECONDS = 2700; // 45 phút target

function ffmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  // Windows local dev: C:/Users/<user>/bin/ffmpeg.exe (đã cài)
  const winBin = path.join(os.homedir(), 'bin', 'ffmpeg.exe');
  if (fsSync.existsSync(winBin)) return winBin;
  return 'ffmpeg'; // PATH (production container)
}

async function r2ObjectSize(key: string): Promise<{ size: number; mime: string }> {
  const { storageService } = await import('@/lib/storage');
  const client = await (storageService as any).getClient();
  const bucket = (storageService as any).bucketName ?? process.env.R2_BUCKET_NAME;
  const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return { size: head.ContentLength ?? 0, mime: head.ContentType ?? 'application/octet-stream' };
}

/** Upload 1 file local lên R2 (PutObject). StorageService chưa có method này. */
async function uploadLocalFileToR2(key: string, filePath: string, contentType: string): Promise<void> {
  const { storageService } = await import('@/lib/storage');
  const client = await (storageService as any).getClient();
  const bucket = (storageService as any).bucketName ?? process.env.R2_BUCKET_NAME;
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(filePath),
    ContentType: contentType,
  }));
}

/** Tải 1 range [start, end] của object R2 về file local (append). */
async function downloadRange(key: string, start: number, end: number, destFile: string): Promise<void> {
  const { storageService } = await import('@/lib/storage');
  const client = await (storageService as any).getClient();
  const bucket = (storageService as any).bucketName ?? process.env.R2_BUCKET_NAME;
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=${start}-${end}` })
  );
  const body = res.Body as Readable;
  await pipeline(body, createWriteStream(destFile, { flags: 'a' }));
}

/** Tải toàn bộ object về local theo chunk 500MB (fan-out caller tự chia step). */
async function downloadToTemp(key: string, totalBytes: number, onProgress?: (b: number, t: number) => void): Promise<string> {
  const tmp = path.join(os.tmpdir(), `zai-${Date.now()}-${path.basename(key)}`);
  for (let start = 0; start < totalBytes; start += RANGE_CHUNK) {
    const end = Math.min(start + RANGE_CHUNK - 1, totalBytes - 1);
    await downloadRange(key, start, end, tmp);
    onProgress?.(end + 1, totalBytes);
  }
  return tmp;
}

function runFfmpeg(args: string[], timeoutMs = 280_000): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    // dynamic import để không break bundling khi env không có child_process
    import('child_process').then(({ spawn }) => {
      const child: ChildProcess = spawn(ffmpegPath(), args, { windowsHide: true });
      let stderr = '';
      child.stderr?.on('data', (d) => { stderr += String(d); });
      const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code: code ?? -1, stderr });
      });
    });
  });
}

export class InngestFFmpegProcessor implements MediaProcessor {
  async inspect(key: string): Promise<MediaInfo> {
    const { size, mime } = await r2ObjectSize(key);
    return { key, sizeBytes: size, mime, durationSeconds: null };
  }

  async extractAudio(
    key: string,
    onProgress?: (bytesProcessed: number, totalBytes: number) => void
  ): Promise<{ audioKey: string; durationSeconds: number | null }> {
    const { size } = await r2ObjectSize(key);
    const local = await downloadToTemp(key, size, onProgress);
    const out = local.replace(/\.[^.]+$/, '') + '.m4a';

    // Stream copy audio track, drop video
    const { code, stderr } = await runFfmpeg(['-i', local, '-vn', '-c:a', 'copy', '-y', out]);
    if (code !== 0) {
      this.cleanup(local); this.cleanup(out);
      throw Object.assign(new Error(`ffmpeg extractAudio exit ${code}: ${stderr.slice(-300)}`), { kind: 'ffmpeg' as const });
    }
    const dur = await this.probeDuration(out);

    // Upload kết quả lên R2 cạnh file gốc
    const audioKey = key.replace(/\.[^.]+$/, '') + '.m4a';
    await uploadLocalFileToR2(audioKey, out, 'audio/mp4');
    this.cleanup(local); this.cleanup(out);
    return { audioKey, durationSeconds: dur };
  }

  async createSegments(audioKey: string, targetMinutes = 45): Promise<Segment[]> {
    const { size } = await r2ObjectSize(audioKey);
    const local = await downloadToTemp(audioKey, size);
    const dir = path.dirname(local);
    const segPattern = path.join(dir, `seg-%03d.m4a`);
    const segTime = Math.round(targetMinutes * 60);

    const { code, stderr } = await runFfmpeg([
      '-i', local,
      '-f', 'segment',
      '-segment_time', String(segTime),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-y', segPattern,
    ]);
    if (code !== 0) {
      this.cleanup(local);
      throw Object.assign(new Error(`ffmpeg segment exit ${code}: ${stderr.slice(-300)}`), { kind: 'ffmpeg' as const });
    }

    // Thu các segment theo thứ tự + offset cộng dồn
    const files = fsSync.readdirSync(dir)
      .filter(f => /^seg-\d+\.m4a$/.test(f))
      .sort();
    const segments: Segment[] = [];
    let offset = 0;
    for (let i = 0; i < files.length; i++) {
      const full = path.join(dir, files[i]);
      const dur = await this.probeDuration(full);
      const upKey = `${audioKey}.seg-${String(i).padStart(3, '0')}.m4a`;
      await uploadLocalFileToR2(upKey, full, 'audio/mp4');
      segments.push({ index: i, key: upKey, approxSeconds: dur ?? segTime, offsetSeconds: offset });
      offset += dur ?? segTime;
      this.cleanup(full);
    }
    this.cleanup(local);
    return segments;
  }

  async getStatus(jobId: string) {
    // Trạng thái giữ trong Inngest step state của caller — processor stateless.
    // Caller đọc progress từ chính step.run context.
    return { state: 'queued' } as const;
  }

  handleFailure(err: unknown): { kind: ProcessorFailureKind; userMessage: string } {
    const e = err as Error & { kind?: string };
    const msg = e.message ?? '';
    if (/Invalid data|moov atom not found|does not match/i.test(msg)) {
      return { kind: 'corrupt_file', userMessage: 'Tệp âm thanh/video bị hỏng hoặc định dạng không đọc được.' };
    }
    if (e.kind === 'ffmpeg' && /exit -1|SIGKILL|timeout/i.test(msg)) {
      return { kind: 'timeout', userMessage: 'Xử lý tệp quá lâu — hệ thống đang thử lại.' };
    }
    if (/quota|QuotaExceeded/i.test(msg)) {
      return { kind: 'quota_exceeded', userMessage: 'Đã hết hạn mức xử lý. Nâng cấp gói để tiếp tục.' };
    }
    return { kind: 'unknown', userMessage: 'Không thể xử lý tệp này lúc này. Vui lòng thử lại sau.' };
  }

  private async probeDuration(file: string): Promise<number | null> {
    const probe = path.join(path.dirname(ffmpegPath()), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    const bin = fsSync.existsSync(probe) ? probe : 'ffprobe';
    return new Promise((resolve) => {
      import('child_process').then(({ spawn }) => {
        const child = spawn(bin, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { windowsHide: true });
        let out = '';
        child.stdout?.on('data', (d) => { out += String(d); });
        child.on('close', () => {
          const n = parseFloat(out.trim());
          resolve(Number.isFinite(n) ? n : null);
        });
      });
    });
  }

  private cleanup(file: string): void {
    try { fsSync.unlinkSync(file); } catch { /* ignore */ }
  }
}

export const inngestFFmpegProcessor = new InngestFFmpegProcessor();
