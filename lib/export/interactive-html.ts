import { NoteOutput } from '@/lib/ai/validators/block-schema';
import { renderToStaticHtml } from './static-html';

/**
 * Render to Interactive HTML: Nhúng sẵn TailwindCSS, Alpine.js và JSON data nội tuyến.
 * Hỗ trợ Flashcards flip lật hai mặt mượt mà, render sơ đồ tương tác bằng Mermaid.js,
 * chạy offline 100% không cần server.
 */
export function renderToInteractiveHtml(note: NoteOutput): string {
  const staticHtml = renderToStaticHtml(note);

  // Inject Tailwind, Alpine.js, Mermaid.js and interactive scripts
  const injectedHeader = `
<script src="https://cdn.tailwindcss.com"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.2.3/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({ startOnLoad: true });
</script>
<style>
  [x-cloak] { display: none !important; }
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
</style>
`;

  // Custom Interactive Template for Flashcards and Tree visualization
  const interactiveBody = `
<div class="max-w-4xl mx-auto px-4 py-8" x-data="{ currentTab: 'note' }">
  <!-- Tabs Navigation -->
  <div class="flex border-b border-gray-200 mb-8 space-x-4">
    <button @click="currentTab = 'note'" :class="currentTab === 'note' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="py-2 px-4 border-b-2 font-medium text-sm transition">
      📚 Bài ghi chú
    </button>
    <button @click="currentTab = 'recall'" :class="currentTab === 'recall' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="py-2 px-4 border-b-2 font-medium text-sm transition">
      🎯 Học Active Recall
    </button>
  </div>

  <div x-show="currentTab === 'note'">
    ${staticHtml}
  </div>

  <div x-show="currentTab === 'recall'" x-cloak class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">Thẻ Ghi Nhớ Ôn Tập (Active Recall)</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${note.blocks
        .filter((b) => b.type === 'card_grid')
        .flatMap((b: any) =>
          b.cards.map(
            (card: any, idx: number) => `
        <div class="h-48 perspective-1000 cursor-pointer" x-data="{ flipped: false }" @click="flipped = !flipped">
          <div class="relative w-full h-full transition-transform duration-500 transform-style-3d border border-gray-200 rounded-xl" :class="flipped ? 'rotate-y-180' : ''">
            <!-- Mặt trước -->
            <div class="absolute inset-0 backface-hidden bg-white p-6 flex flex-col justify-between rounded-xl shadow-sm">
              <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Mặt Trước — Câu Hỏi</span>
              <p class="text-lg font-medium text-gray-900">${card.front}</p>
              <span class="text-xs text-gray-400">Nhấp chuột để lật mặt sau</span>
            </div>
            <!-- Mặt sau -->
            <div class="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50 p-6 flex flex-col justify-between rounded-xl">
              <span class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Mặt Sau — Câu Trả Lời</span>
              <p class="text-base text-gray-800 leading-relaxed">${card.back}</p>
              <span class="text-xs text-blue-500">Nhấp chuột để lật lại</span>
            </div>
          </div>
        </div>
      `,
          ),
        )
        .join('')}
    </div>
  </div>
</div>
`;

  return `<!DOCTYPE html>
<html lang="${note.meta.language}">
<head>
<meta charset="UTF-8">
<title>${note.meta.title} — Interactive</title>
${injectedHeader}
</head>
<body class="bg-gray-50 min-h-screen">
${interactiveBody}
</body>
</html>`;
}
