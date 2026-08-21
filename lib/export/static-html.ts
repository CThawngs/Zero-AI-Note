import { NoteOutput, Block } from '@/lib/ai/validators/block-schema';

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');

export function renderToStaticHtml(note: NoteOutput): string {
  return `<!DOCTYPE html>
<html lang="${note.meta.language}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(note.meta.title)}</title>
<style>
  body { font-family: 'Inter', -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 2rem; border-bottom: 3px solid #2563eb; padding-bottom: 8px; }
  h2 { font-size: 1.5rem; margin-top: 2rem; color: #2563eb; }
  h3 { font-size: 1.2rem; margin-top: 1.5rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  .cue_box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 1rem 0; border-radius: 4px; }
  .cue_box .cue { font-weight: 700; color: #92400e; margin-bottom: 8px; }
  .cue_box ul { margin: 0; padding-left: 20px; }
  .card_grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 1rem 0; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .card .front { font-weight: 700; color: #2563eb; margin-bottom: 6px; }
  .callout { border-left: 4px solid; padding: 12px 16px; margin: 1rem 0; border-radius: 4px; }
  .callout.info { background: #eff6ff; border-color: #3b82f6; }
  .callout.tip { background: #f0fdf4; border-color: #10b981; }
  .callout.warning { background: #fffbeb; border-color: #f59e0b; }
  .callout.danger { background: #fef2f2; border-color: #ef4444; }
  .callout.success { background: #f0fdf4; border-color: #22c55e; }
  .callout .title { font-weight: 700; margin-bottom: 4px; }
  .meta-bar { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 2rem; }
  .tag { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; margin-right: 4px; }
</style>
</head>
<body>
${renderHtmlBody(note)}
</body>
</html>`;
}

function renderHtmlBody(note: NoteOutput): string {
  const { meta, blocks } = note;
  const parts: string[] = [];
  parts.push(`<h1>${escapeHtml(meta.title)}</h1>`);
  parts.push(
    `<div class="meta-bar"><strong>${escapeHtml(meta.method.toUpperCase())}</strong> · ${escapeHtml(meta.tier.toUpperCase())} · ${escapeHtml(meta.language)}</div>`,
  );
  parts.push(`<h2>📌 Tóm tắt</h2><p>${escapeHtml(meta.summary)}</p>`);
  if (meta.keywords.length) {
    parts.push(`<div>${meta.keywords.map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join('')}</div>`);
  }
  if (meta.coreQuestions.length) {
    parts.push('<h3>Câu hỏi cốt lõi</h3><ul>' + meta.coreQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('') + '</ul>');
  }

  blocks.forEach((b) => parts.push(renderBlockHtml(b)));
  return parts.join('\n');
}

function renderBlockHtml(block: Block): string {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
    case 'paragraph':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'cue_box':
      return `<div class="cue_box"><div class="cue">Cue: ${escapeHtml(block.cue)}</div><ul>${block.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul></div>`;
    case 'table':
      return `<table><thead><tr>${block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'card_grid':
      return `<div class="card_grid">${block.cards.map((c) => `<div class="card"><div class="front">${escapeHtml(c.front)}</div><div class="back">${escapeHtml(c.back)}${c.tag ? ` <span class="tag">${escapeHtml(c.tag)}</span>` : ''}</div></div>`).join('')}</div>`;
    case 'callout':
      return `<div class="callout ${block.style}"><div class="title">${escapeHtml(block.title)}</div><div>${escapeHtml(block.text)}</div></div>`;
    case 'mindmap_tree':
      return `<pre>${escapeHtml(JSON.stringify(block, null, 2))}</pre>`;
  }
}
