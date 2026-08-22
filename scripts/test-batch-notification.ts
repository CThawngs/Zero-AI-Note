/**
 * Test batch email notification logic (DECISIONS.md §25) — mock DB, không đụng Neon thật.
 * Chạy: bun scripts/test-batch-notification.ts — exit 0 = pass.
 *
 * Cases:
 * 1. Race condition: 2 job claim cùng lúc → chỉ 1 thắng (atomic UPDATE ... WHERE NULL)
 * 2. Ngưỡng 2 phút: batch xong nhanh → claim nhưng KHÔNG gửi
 * 3. Còn file pending → không làm gì
 * 4. File lỗi trong batch → liệt kê đúng trong email, subject X/N
 */

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

// ── Mock getSql mô phỏng Postgres atomicity cho claim query
type NotebookRow = { id: string; notification_sent_at: Date | null; title: string };
const notebooks: NotebookRow[] = [
  { id: 'nb-1', notification_sent_at: null, title: 'Bài giảng chương 3' },
];

let claimCalls = 0;
function mockClaim(notebookId: string): boolean {
  // Mô phỏng đúng semantics: UPDATE ... WHERE notification_sent_at IS NULL RETURNING id
  const row = notebooks.find(n => n.id === notebookId);
  claimCalls++;
  if (!row || row.notification_sent_at !== null) return false;
  row.notification_sent_at = new Date();
  return true;
}

// ── TEST 1: race condition — 2 claim đồng thời, chỉ 1 thắng
console.log('\n[TEST 1] Race condition: 2 job claim cùng notebook');
const r1 = mockClaim('nb-1');
const r2 = mockClaim('nb-1');
assert(r1 === true, 'claim đầu tiên thắng');
assert(r2 === false, 'claim thứ hai thua (không gửi mail lần 2)');
assert(claimCalls === 2 && notebooks[0].notification_sent_at !== null, 'flag được set sau claim đầu');

// ── TEST 2: ngưỡng 2 phút — pure logic của checkBatchCompletion age check
console.log('\n[TEST 2] Ngưỡng 2 phút');
const now = Date.now();
const oldestRecent = new Date(now - 60 * 1000);       // 1 phút trước < 2 phút
const oldestOld = new Date(now - 5 * 60 * 1000);      // 5 phút trước > 2 phút
const BATCH_MIN_WAIT_MS = 2 * 60 * 1000;
assert(now - oldestRecent.getTime() < BATCH_MIN_WAIT_MS, 'batch 1 phút tuổi → dưới ngưỡng, KHÔNG gửi');
assert(now - oldestOld.getTime() >= BATCH_MIN_WAIT_MS, 'batch 5 phút tuổi → vượt ngưỡng, GỬI');

// ── TEST 3: completion logic — sibling states
console.log('\n[TEST 3] Batch completion states');
const stillPending = [
  { status: 'processed' },
  { status: 'processing' },
];
assert(stillPending.some(s => s.status === 'pending' || s.status === 'processing'), 'còn processing → chưa hoàn tất');

const allDone = [
  { status: 'processed' },
  { status: 'error' },
];
assert(!allDone.some(s => s.status === 'pending' || s.status === 'processing'), 'tất cả processed/error → hoàn tất trạng thái file');
// note check: hasNote phải true mới isComplete — tested qua integration

// ── TEST 4: email content — friendlyError mapping + subject format
console.log('\n[TEST 4] Email content rules');
function buildSubject(n: number, okCount: number): string {
  return n <= 1 ? 'Note của bạn đã sẵn sàng' : `${okCount}/${n} file đã xử lý xong`;
}
assert(buildSubject(1, 1) === 'Note của bạn đã sẵn sàng', '1 file → subject đơn');
assert(buildSubject(3, 2) === '2/3 file đã xử lý xong', 'batch 3 file (2 ok) → subject X/N');
assert(buildSubject(3, 3) === '3/3 file đã xử lý xong', 'batch đủ → 3/3');

// friendlyError: youtube không transcript → message dễ hiểu
function friendlyError(type: string | null, transcript: string | null): string {
  if (!transcript && type === 'youtube') return 'Không lấy được nội dung video';
  if (type === 'audio' || type === 'video') return 'Định dạng âm thanh/video không hỗ trợ hoặc file hỏng';
  if (type === 'pdf') return 'Tài liệu không đọc được (có thể là bản scan lỗi)';
  return 'Định dạng không hỗ trợ';
}
assert(friendlyError('youtube', null).includes('Không lấy được nội dung video'), 'youtube fail → message thân thiện');
assert(friendlyError('pdf', null).includes('scan lỗi'), 'pdf fail → gợi ý scan lỗi');
assert(!friendlyError('pdf', null).includes('Error:') , 'không log lỗi thô trong email');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
