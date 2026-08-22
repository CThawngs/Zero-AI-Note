/**
 * Test PPTX parser — build 1 file .pptx TỐI THIỂU thật bằng jszip rồi parse ngược.
 * Chạy: bun scripts/test-pptx.ts — exit 0 = pass.
 */
import JSZip from 'jszip';
import { parsePptx, renderPptxMarkdown } from '../lib/ai/pptx';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) console.log(`PASS: ${msg}`);
  else { console.error(`FAIL: ${msg}`); failures++; }
};

// XML template slide chuẩn OOXML
function slideXml(title: string, bullets: string[]): string {
  const bulletPs = bullets.map(b =>
    `<p:sp><p:txBody><a:p><a:r><a:t>${b}</a:t></a:r></a:p></p:txBody></p:sp>`
  ).join('');
  return `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld><p:spTree>
<p:sp><p:nvSpPr/><p:spPr/><p:txBody><a:p><a:r><a:pPr/><a:rPr lang="vi"/><a:t>${title}</a:t></a:r></a:p></p:txBody>
<p:nvPr><p:ph type="title"/></p:nvPr></p:sp>
${bulletPs}
</p:spTree></p:cSld></p:sld>`;
}

function notesXml(text: string): string {
  return `<?xml version="1.0"?>
<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`;
}

(async () => {
  console.log('[TEST] build minimal pptx');
  const zip = new JSZip();
  zip.file('ppt/slides/slide1.xml', slideXml('Chiến lược Q4', ['Doanh thu mục tiêu 45 tỷ VND', 'CAC giảm từ 20 xuống 15 USD']));
  zip.file('ppt/slides/slide2.xml', slideXml('Rủi ro', ['Churn 12%/tháng', 'Phụ thuộc 1 kênh ads']));
  zip.file('ppt/notesSlides/notesSlide2.xml', notesXml('Nhấn mạnh rủi ro tập trung kênh'));
  // file lệch thứ tự để test sort: thêm slide10 trước slide3
  zip.file('ppt/slides/slide10.xml', slideXml('Kết luận', ['Bắt đầu triển khai tuần tới']));
  zip.file('ppt/slides/slide3.xml', slideXml('Kế hoạch', ['Hiring 8 người sales']));
  const buf = await zip.generateAsync({ type: 'nodebuffer' });

  const slides = await parsePptx(buf);
  assert(slides.length === 4, `parse đủ 4 slides: ${slides.length}`);
  assert(slides[0].index === 1, 'slide1 index đúng');
  assert(slides[3].index === 10, 'sort số học đúng (slide10 sau slide3): ' + slides.map(s => s.index));

  console.log('[TEST] title extraction');
  assert(slides[0].title === 'Chiến lược Q4', `title: "${slides[0].title}"`);
  assert(slides[2].title === 'Kế hoạch', `title slide3: "${slides[2].title}"`);

  console.log('[TEST] body + numbers preserved');
  assert(slides[0].bodyText.includes('45 tỷ VND'), 'số liệu giữ nguyên');
  assert(slides[0].bodyText.includes('15 USD'), 'CAC giữ nguyên');

  console.log('[TEST] speaker notes');
  assert(slides[1].notes === 'Nhấn mạnh rủi ro tập trung kênh', `notes: "${slides[1].notes}"`);
  assert(slides[0].notes === '', 'slide không notes → rỗng');

  console.log('[TEST] markdown render');
  const md = renderPptxMarkdown(slides);
  assert(md.includes('## Slide 1: Chiến lược Q4'), 'markdown có heading slide + title');
  assert(md.includes('[Ghi chú người trình bày]: Nhấn mạnh rủi ro'), 'markdown có notes');

  console.log('[TEST] entity escaping');
  // XML chứa entity đã encode đúng chuẩn OOXML: &amp; &lt; &gt;
  const zip2 = new JSZip();
  zip2.file('ppt/slides/slide1.xml', slideXml('A &amp; B', ['Doanh thu &amp; lợi nhuận &gt; mục tiêu &lt;Q4&gt;']));
  const buf2 = await zip2.generateAsync({ type: 'nodebuffer' });
  const slides2 = await parsePptx(buf2);
  assert(slides2[0].title === 'A & B', `title decode: "${slides2[0].title}"`);
  assert(slides2[0].bodyText.includes('Doanh thu & lợi nhuận > mục tiêu <Q4>'), 'body decode đúng entity');

  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
