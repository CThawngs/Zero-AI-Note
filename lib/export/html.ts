import { StructuredNoteOutput } from '../ai/gemini';

/**
 * Generate a standalone, styled, printable Static HTML document from content_structured
 */
export function generateHtmlExport(note: StructuredNoteOutput): string {
  const sectionsHtml = note.content.sections
    .map((s, idx) => {
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
          <h3>${idx + 1}. ${s.title}</h3>
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
      background: #fff;
    }
    h1 { font-size: 28px; margin-bottom: 8px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    h2 { font-size: 20px; margin-top: 28px; color: #d97706; border-left: 4px solid #d97706; padding-left: 10px; }
    h3 { font-size: 16px; margin-top: 20px; color: #111; }
    .meta { font-size: 13px; color: #666; margin-bottom: 24px; }
    .summary-box { background: #fdfaf3; border-left: 4px solid #d97706; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
    .definition { color: #555; font-style: italic; background: #f5f5f5; padding: 8px 12px; border-radius: 4px; }
    .cornell-row { display: flex; border: 1px solid #e5e5e5; margin-bottom: 12px; border-radius: 6px; overflow: hidden; }
    .cornell-cue { width: 30%; background: #fbf9f5; padding: 14px; font-size: 14px; border-right: 1px solid #e5e5e5; }
    .cornell-note { width: 70%; padding: 14px; }
    .section { border: 1px solid #eee; padding: 16px; border-radius: 8px; margin-bottom: 14px; }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
    .tag { background: rgba(217, 119, 6, 0.12); color: #d97706; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
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

/**
 * Generate a single-file Interactive HTML document with inline CSS + JS (Ultra exclusive)
 */
export function generateInteractiveHtmlExport(note: StructuredNoteOutput): string {
  const sectionsData = JSON.stringify(note.content.sections || []);
  const questionsData = JSON.stringify(note.coreQuestions || []);
  const keywordsData = JSON.stringify(note.keywords || []);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title} — Interactive Note (Zero AI Note)</title>
  <style>
    :root {
      --bg: #171513;
      --card: #201D1A;
      --border: #3B3630;
      --text: #F7F4EE;
      --text-muted: #B7B2AA;
      --accent: #F59E0B;
      --accent-subtle: rgba(245, 158, 11, 0.15);
    }
    body.light {
      --bg: #FBF9F5;
      --card: #FFFFFF;
      --border: #E1DBD1;
      --text: #26221D;
      --text-muted: #6A635C;
      --accent: #D97706;
      --accent-subtle: rgba(217, 119, 6, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 24px;
      transition: background 0.3s, color 0.3s;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
    h1 { font-size: 26px; font-weight: 700; color: var(--text); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; background: var(--accent-subtle); color: var(--accent); margin-top: 6px; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    button.btn {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
    }
    button.btn:hover { border-color: var(--accent); color: var(--accent); }
    button.btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 17px; font-weight: 700; color: var(--accent); margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
    .tag { background: var(--accent-subtle); color: var(--accent); padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; cursor: pointer; }
    .flashcard { min-height: 120px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; border: 2px dashed var(--border); border-radius: 12px; padding: 20px; margin-bottom: 12px; font-weight: 600; }
    .flashcard.flipped { border-color: var(--accent); background: var(--accent-subtle); }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>${note.title}</h1>
        <span class="badge">${note.method.toUpperCase()} NOTE • INTERACTIVE HTML</span>
      </div>
      <button class="btn" onclick="document.body.classList.toggle('light')">🌓 Đổi Giao Diện</button>
    </header>

    <div class="toolbar">
      <button class="btn active" id="tab-note" onclick="switchView('note')">📖 Đọc Ghi Chú</button>
      <button class="btn" id="tab-qa" onclick="switchView('qa')">❓ Hỏi Đáp Ôn Tập</button>
      <button class="btn" id="tab-flashcard" onclick="switchView('flashcard')">🎴 Thẻ Flashcard</button>
      <button class="btn" onclick="toggleAllSections()">📂 Đóng/Mở Tất Cả</button>
    </div>

    <div id="view-note">
      <div class="card">
        <h3 style="color: var(--accent); margin-bottom: 8px;">📌 Tóm Tắt Cốt Lõi</h3>
        <p style="color: var(--text-muted);">${note.summary}</p>
      </div>

      <div class="tags" id="tags-container"></div>
      <div id="sections-container"></div>
    </div>

    <div id="view-qa" class="hidden">
      <div class="card">
        <h3 style="color: var(--accent); margin-bottom: 12px;">🎯 Bộ Câu Hỏi Tự Đánh Giá</h3>
        <div id="qa-container"></div>
      </div>
    </div>

    <div id="view-flashcard" class="hidden">
      <div class="card">
        <h3 style="color: var(--accent); margin-bottom: 8px;">🎴 Luyện Trí Nhớ Chủ Động (Active Recall)</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Nhấn vào thẻ để lật đáp án</p>
        <div id="flashcards-container"></div>
      </div>
    </div>
  </div>

  <script>
    const sections = ${sectionsData};
    const questions = ${questionsData};
    const keywords = ${keywordsData};

    function render() {
      // Tags
      const tagsEl = document.getElementById('tags-container');
      tagsEl.innerHTML = keywords.map(k => '<span class="tag">#' + k + '</span>').join('');

      // Sections
      const secEl = document.getElementById('sections-container');
      secEl.innerHTML = sections.map((s, i) => \`
        <div class="card" id="sec-\${i}">
          <div class="card-title" onclick="toggleSec(\${i})">
            <span>\${i + 1}. \${s.title}</span>
            <span id="icon-\${i}">▾</span>
          </div>
          <div id="body-\${i}">
            \${s.definition ? '<p style="font-style: italic; color: var(--accent); margin-bottom: 8px;">' + s.definition + '</p>' : ''}
            \${s.text ? '<p style="margin-bottom: 8px;">' + s.text + '</p>' : ''}
            \${s.bulletPoints ? '<ul>' + s.bulletPoints.map(b => '<li style="margin-left: 20px;">' + b + '</li>').join('') + '</ul>' : ''}
          </div>
        </div>
      \`).join('');

      // QA
      const qaEl = document.getElementById('qa-container');
      qaEl.innerHTML = questions.map((q, i) => \`
        <div style="border-bottom: 1px solid var(--border); padding: 12px 0;">
          <p style="font-weight: 600; color: var(--text);">Q\${i + 1}: \${q}</p>
        </div>
      \`).join('');

      // Flashcards
      const fcEl = document.getElementById('flashcards-container');
      fcEl.innerHTML = sections.map((s, i) => \`
        <div class="flashcard" onclick="this.classList.toggle('flipped'); this.innerText = this.classList.contains('flipped') ? (\${JSON.stringify(s.definition || s.text || 'Khái niệm trọng tâm')}) : (\${JSON.stringify('Thẻ #' + (i + 1) + ': ' + s.title + ' (Bấm để xem đáp án)')})">
          Thẻ #\${i + 1}: \${s.title} (Bấm để xem đáp án)
        </div>
      \`).join('');
    }

    function toggleSec(i) {
      const b = document.getElementById('body-' + i);
      const ic = document.getElementById('icon-' + i);
      if (b.style.display === 'none') {
        b.style.display = 'block';
        ic.innerText = '▾';
      } else {
        b.style.display = 'none';
        ic.innerText = '▸';
      }
    }

    let allOpen = true;
    function toggleAllSections() {
      allOpen = !allOpen;
      sections.forEach((_, i) => {
        const b = document.getElementById('body-' + i);
        const ic = document.getElementById('icon-' + i);
        if (b) b.style.display = allOpen ? 'block' : 'none';
        if (ic) ic.innerText = allOpen ? '▾' : '▸';
      });
    }

    function switchView(view) {
      document.getElementById('view-note').classList.add('hidden');
      document.getElementById('view-qa').classList.add('hidden');
      document.getElementById('view-flashcard').classList.add('hidden');
      document.getElementById('tab-note').classList.remove('active');
      document.getElementById('tab-qa').classList.remove('active');
      document.getElementById('tab-flashcard').classList.remove('active');

      document.getElementById('view-' + view).classList.remove('hidden');
      document.getElementById('tab-' + view).classList.add('active');
    }

    render();
  </script>
</body>
</html>`;
}
