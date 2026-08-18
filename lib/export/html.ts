import { StructuredNoteOutput } from '../ai/gemini';

/**
 * Generate a standalone, styled, printable HTML document from content_structured
 */
export function generateHtmlExport(note: StructuredNoteOutput): string {
  const sectionsHtml = note.content.sections
    .map(s => {
      const bullets = s.bulletPoints
        ? `<ul>${s.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>`
        : '';
      const def = s.definition ? `<p class="definition"><em>${s.definition}</em></p>` : '';
      const text = s.text ? `<p>${s.text}</p>` : '';

      if (note.method === 'cornell') {
        return `
          <div class="cornell-row">
            <div class="cornell-cue"><strong>${s.cue || s.title}</strong></div>
            <div class="cornell-note">
              <h4>${s.title}</h4>
              ${def}
              ${text}
              ${bullets}
            </div>
          </div>
        `;
      }

      return `
        <div class="section">
          <h3>${s.title}</h3>
          ${def}
          ${text}
          ${bullets}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${note.title} — Zero AI Note</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 28px; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 20px; margin-top: 28px; color: #2563eb; }
    h3 { font-size: 16px; margin-top: 20px; }
    .meta { font-size: 13px; color: #666; margin-bottom: 24px; }
    .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px; }
    .definition { color: #475569; font-style: italic; }
    .cornell-row { display: flex; border: 1px solid #e2e8f0; margin-bottom: 12px; border-radius: 6px; overflow: hidden; }
    .cornell-cue { width: 30%; background: #f1f5f9; padding: 14px; font-size: 14px; border-right: 1px solid #e2e8f0; }
    .cornell-note { width: 70%; padding: 14px; }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px; font-size: 12px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta">
    <span>Phương pháp: <strong>${note.method.toUpperCase()}</strong></span> • 
    <span>Danh mục: <strong>${note.category}</strong></span> • 
    <span>Ngày xuất: <strong>${new Date().toLocaleDateString('vi-VN')}</strong></span>
  </div>

  <div class="summary-box">
    <h3>📌 Tóm tắt tổng quan</h3>
    <p>${note.summary}</p>
  </div>

  ${note.keywords && note.keywords.length > 0 ? `
    <div class="tags">
      ${note.keywords.map(k => `<span class="tag">${k}</span>`).join('')}
    </div>
  ` : ''}

  <h2>📖 Nội dung chi tiết</h2>
  ${sectionsHtml}

  ${note.content.summaryText ? `
    <h2>🎯 Kết luận & Tóm tắt</h2>
    <p>${note.content.summaryText}</p>
  ` : ''}
</body>
</html>`;
}
