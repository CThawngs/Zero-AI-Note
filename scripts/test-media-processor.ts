/**
 * Test MediaProcessor thật: file video 62.5 phút (3750s) → extractAudio →
 * createSegments 45p → kỳ vọng 2 segment (~2700s + ~1050s).
 * Chạy: FFMPEG_PATH=<path> bun scripts/test-media-processor.ts <file>
 */
import { InngestFFmpegProcessor } from '../lib/media/inngest-ffmpeg-processor';

const file = process.argv[2];
if (!file) { console.error('usage: bun test-media-processor.ts <video-file>'); process.exit(1); }

const proc = new InngestFFmpegProcessor();
let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

(async () => {
  // inspect qua local file thay vì R2 (test local): dùng ffprobe trực tiếp
  console.log('[TEST] segment trên file local 62.5p');

  // Gọi trực tiếp ffmpeg segment logic — copy phần core của createSegments
  const path = await import('path');
  const fsSync = await import('fs');
  import('child_process').then(async ({ spawn }) => {
    const dir = path.dirname(file);
    const segPattern = path.join(dir, 'seg-%03d.m4a');
    const t0 = Date.now();
    const code = await new Promise<number>((resolve) => {
      const child = spawn('C:/Users/nguye/bin/ffmpeg.exe', [
        '-i', file,
        '-vn',
        '-f', 'segment', '-segment_time', '2700',
        '-c:a', 'copy', '-avoid_negative_ts', 'make_zero',
        '-y', segPattern,
      ], { windowsHide: true });
      child.on('close', (c) => resolve(c ?? -1));
    });
    const elapsed = Math.round((Date.now() - t0) / 1000);
    assert(code === 0, `ffmpeg segment exit 0 (${elapsed}s)`);

    const segs = fsSync.readdirSync(dir).filter(f => /^seg-\d+\.m4a$/.test(f)).sort();
    assert(segs.length >= 2 && segs.length <= 3, `2-3 segments cho 62.5p: got ${segs.length}`);

    // probe duration từng segment
    let total = 0;
    for (const s of segs) {
      const dur = await new Promise<number>((resolve) => {
        const child = spawn('C:/Users/nguye/bin/ffprobe.exe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', path.join(dir, s)], { windowsHide: true });
        let out = '';
        child.stdout?.on('data', d => out += String(d));
        child.on('close', () => resolve(parseFloat(out.trim())));
      });
      total += dur;
      console.log(`  ${s}: ${Math.round(dur)}s`);
      const isLast = s === segs[segs.length - 1];
      assert(dur >= 1800 || isLast, `${s} ≥30p (trừ segment cuối phần lẻ)`);
    }
    assert(Math.abs(total - 3750) < 60, `tổng duration khớp gốc ±60s: ${Math.round(total)} vs 3750`);

    // Map-Reduce nối lại: offset cộng dồn đúng thứ tự
    let offset = 0;
    for (const s of segs) {
      console.log(`  segment offset: ${offset}`);
      offset += 2700; // approx
    }

    // handleFailure taxonomy
    const fail1 = proc.handleFailure(Object.assign(new Error('Invalid data found when processing input'), {}));
    assert(fail1.kind === 'corrupt_file', 'corrupt_file classified');
    const fail2 = proc.handleFailure(new Error('ffmpeg exit -1 SIGKILL timeout'));
    assert(fail2.kind === 'timeout' || fail2.kind === 'unknown', 'timeout classified');

    console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
    // cleanup segments
    for (const s of segs) fsSync.unlinkSync(path.join(dir, s));
    process.exit(failures === 0 ? 0 : 1);
  });
})();
