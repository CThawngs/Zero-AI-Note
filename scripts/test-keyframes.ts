/**
 * Test keyframes scene detection thật: testsrc video 60s có scene changes
 * (testsrc pattern đổi màu liên tục) — detectScenesInSegment phải trả về
 * timestamps tăng dần, cộng offset đúng.
 * Chạy: bun scripts/test-keyframes.ts <video-file>
 */
import { detectScenesInSegment } from '../lib/media/keyframes';

const file = process.argv[2];
if (!file) { console.error('usage: bun test-keyframes.ts <file>'); process.exit(1); }

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

(async () => {
  console.log('[TEST] scene detection trên testsrc 60s, offset 2700s');
  const stamps = await detectScenesInSegment(file, 2700, 0.3, 'C:/Users/nguye/bin/ffmpeg.exe');
  assert(stamps.length > 0, `có scene detected: ${stamps.length} cảnh`);
  const sorted = [...stamps].sort((a, b) => a - b);
  assert(JSON.stringify(stamps) === JSON.stringify(sorted), 'timestamps tăng dần');
  assert(stamps.every(t => t >= 2700 && t <= 2760), `tất cả trong [2700, 2760] (offset + duration): min=${Math.min(...stamps)} max=${Math.max(...stamps)}`);
  console.log('  sample:', stamps.slice(0, 8).join(', '), '...');
  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
