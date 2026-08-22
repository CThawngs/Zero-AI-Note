/**
 * Keyframes scene-change detection per-segment (PRD 3.2b bước 3, DECISIONS.md §31.6).
 * 2026-08-23
 *
 * Chạy trên TỪNG segment đã demux (không phải file gốc nguyên khối) — mỗi segment
 * 1 lần gọi ffmpeg, nằm trong 300s/step. Timestamp = frame pts + offset cộng dồn.
 *
 * ponytail: ngưỡng scene 0.3 mặc định; caller có thể tune theo loại nội dung.
 */

const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg';

/** Trả về danh sách timestamp giây (đã cộng offset) của các cảnh chuyển trong segment file local. */
export async function detectScenesInSegment(
  segmentFile: string,
  offsetSeconds: number,
  threshold = 0.3,
  ffmpegBin = FFMPEG
): Promise<number[]> {
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin, [
      '-i', segmentFile,
      '-vf', `select='gt(scene,${threshold})',showinfo`,
      '-f', 'null',
      '-',
    ], { windowsHide: true });

    let stderr = '';
    child.stderr?.on('data', (d) => { stderr += String(d); });
    child.on('close', () => {
      // showinfo ghi mỗi frame vào stderr: "pts_time:123.456"
      const stamps: number[] = [];
      const re = /pts_time:([\d.]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(stderr)) !== null) {
        stamps.push(Math.round((parseFloat(m[1]) + offsetSeconds) * 10) / 10);
      }
      resolve(stamps);
    });
    child.on('error', reject);
  });
}

/** Convenience: detect scenes cho danh sách segment (local files + offsets). */
export async function detectScenesForSegments(
  items: Array<{ file: string; offsetSeconds: number }>
): Promise<number[]> {
  const all: number[] = [];
  for (const it of items) {
    const stamps = await detectScenesInSegment(it.file, it.offsetSeconds);
    all.push(...stamps);
  }
  return all.sort((a, b) => a - b);
}
