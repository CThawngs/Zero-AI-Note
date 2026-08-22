/**
 * Test Hierarchical Summarization logic (PRD 4.0.8/3.2d) — không gọi API thật.
 * Chạy: bun scripts/test-summarize.ts — exit 0 = pass.
 */
import {
  shouldUseHierarchical,
  splitIntoSections,
  heuristicKeyQuotes,
  detectConflicts,
  runHierarchicalSummarization,
  type SectionSummary,
} from '../lib/ai/summarize';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

console.log('[TEST] threshold gating');
assert(shouldUseHierarchical(30_000, 1), '30k chars → hierarchical');
assert(shouldUseHierarchical(5_000, 4), '4 nguồn → hierarchical');
assert(!shouldUseHierarchical(5_000, 2), '5k chars + 2 nguồn → single-pass');

console.log('[TEST] section splitting');
const mdDoc = '# Intro\nnội dung intro dài...\n\n# Chương 1\nnội dung chương 1...\n\n## Mục 1.1\nchi tiết...';
const secs = splitIntoSections(mdDoc);
assert(secs.length >= 3, `heading split: ${secs.length} sections`);
const plain = 'a'.repeat(5_000);
assert(splitIntoSections(plain).length === Math.ceil(5000 / 1800), 'fallback chunk 1800 chars');

console.log('[TEST] heuristic key quotes');
const content = 'Đây là câu bình thường không có gì đặc biệt cả. Doanh thu quý 3 đạt 125 triệu USD tăng 40%. Danh sách:\n- Chi phí CAC giảm từ 20 xuống 15 USD. Kết luận chung về định hướng chiến lược dài hạn của công ty trong tương lai.';
const quotes = heuristicKeyQuotes(content);
assert(quotes.length > 0 && quotes.length <= 3, `1-3 quotes: ${quotes.length}`);
assert(quotes.some(q => /\d/.test(q)), 'quote ưu tiên câu có số liệu');

console.log('[TEST] conflict detection (PRD 4.0.10)');
const secA: SectionSummary = {
  sourceName: 'Video A',
  sourceType: 'youtube',
  summary: '- Chi phí CAC là 20 USD',
  keyQuotes: ['Chi phí CAC trung bình là 20 USD theo báo cáo marketing.'],
};
const secB: SectionSummary = {
  sourceName: 'Slide PPT',
  sourceType: 'pptx',
  summary: '- Chi phí CAC chỉ còn 15 USD',
  keyQuotes: ['Nhờ tối ưu funnel, chi phí CAC đạt 15 USD.'],
};
const conflicts = detectConflicts([secA, secB]);
assert(conflicts.length >= 1, `phát hiện conflict số liệu: ${conflicts.length}`);
if (conflicts.length > 0) {
  assert(conflicts[0].sides.length === 2, 'conflict có đủ 2 phía nguồn');
  assert(conflicts[0].sides[0].sourceName !== conflicts[0].sides[1].sourceName, '2 phía khác nguồn');
}
// Cùng nguồn → không conflict
assert(detectConflicts([secA, { ...secB, sourceName: 'Video A' }]).length === 0, 'cùng nguồn không tính conflict');

console.log('[TEST] single-pass path (không gọi API)');
(async () => {
  const small = await runHierarchicalSummarization(
    [{ sourceName: 's1', sourceType: 'text', content: 'ngắn'.repeat(100) }],
    'vi'
  );
  assert(small.mode === 'single-pass', 'dưới ngưỡng → single-pass, không tốn LLM call');
  assert(small.synthesizedContext === '', 'single-pass không sinh context');

  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
