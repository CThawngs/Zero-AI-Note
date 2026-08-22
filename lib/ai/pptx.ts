/**
 * PPTX parser slide-by-slide (PRD 4.0.2 PARSE_PPTX, 2026-08-23)
 *
 * PPTX = ZIP chứa XML. Dùng jszip (dep có sẵn) đọc trực tiếp:
 * - ppt/slides/slideN.xml: text runs <a:t>...</a:t>
 * - ppt/notesSlides/notesSlideN.xml: speaker notes (giữ làm evidence)
 * Không cần thêm dependency mới.
 */
import JSZip from 'jszip';

export interface PptxSlide {
  index: number;
  /** Tiêu đề slide nếu có (placeholder type="title") */
  title: string;
  /** Toàn bộ text trên slide, theo thứ tự shape */
  bodyText: string;
  /** Speaker notes nếu có */
  notes: string;
}

/** Extract text từ 1 slide XML: gom mọi <a:t> run theo thứ tự. */
function extractRuns(xml: string): string[] {
  const runs: string[] = [];
  const re = /<a:t>([^<]*)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = m[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (t.trim()) runs.push(t.trim());
  }
  return runs;
}

export async function parsePptx(buf: Buffer): Promise<PptxSlide[]> {
  const zip = await JSZip.loadAsync(buf);

  // Danh sách slide theo số thứ tự tên file
  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[1] ?? '0', 10);
      const nb = parseInt(b.match(/(\d+)/)?.[1] ?? '0', 10);
      return na - nb;
    });

  const slides: PptxSlide[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const slideNum = parseInt(slideFiles[i].match(/(\d+)/)?.[1] ?? `${i + 1}`, 10);
    const xml = await zip.file(slideFiles[i])!.async('string');

    // Title: <p:sp> chứa <p:ph type="title"...> hoặc "ctrTitle"
    let title = '';
    const spBlocks = xml.split(/<p:sp>/).slice(1);
    for (const block of spBlocks) {
      const blockEnd = block.indexOf('</p:sp>');
      const inner = blockEnd !== -1 ? block.slice(0, blockEnd) : block;
      if (/p:ph[^>]*type="(title|ctrTitle)"/.test(inner)) {
        const runs = extractRuns(inner);
        if (runs.length > 0) { title = runs.join(' '); break; }
      }
    }

    const bodyRuns = extractRuns(xml);
    const bodyText = bodyRuns.join('\n');

    let notes = '';
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${slideNum}.xml`);
    if (notesFile) {
      const nxml = await notesFile.async('string');
      notes = extractRuns(nxml).join(' ');
    }

    slides.push({ index: slideNum, title, bodyText, notes });
  }

  return slides;
}

/** Render slides thành markdown giữ cấu trúc slide-by-slide cho pipeline AI. */
export function renderPptxMarkdown(slides: PptxSlide[]): string {
  return slides
    .map(s => {
      let out = `## Slide ${s.index}${s.title ? `: ${s.title}` : ''}\n${s.bodyText}`;
      if (s.notes) out += `\n[Ghi chú người trình bày]: ${s.notes}`;
      return out;
    })
    .join('\n\n');
}
