import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zero AI Note — Ghi chú AI đa định dạng',
  description: 'AI-Powered Research — Ghi chú AI theo phương pháp học thuật. Cornell, Outline, Q&A, flashcard. Hỗ trợ video, audio, PDF, YouTube.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                Z
              </div>
              <span className="text-xl font-bold tracking-tight">Zero AI Note</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Tài liệu
              </Link>
              <Link href="/app" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Đăng nhập
              </Link>
              <Link href="/app" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow">
                Bắt đầu miễn phí
              </Link>
            </div>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              ✨ Free 100% • Open Source • AI-Powered
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent">
              Ghi chú AI<br />đa định dạng
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
              Chuyển video, audio, PDF, YouTube thành ghi chú cấu trúc cao theo phương pháp Cornell, Outline, Q&A, flashcard. Tự động trích xuất từ vựng, câu hỏi cốt lõi và bảng dữ liệu.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/app" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow">
                Bắt đầu miễn phí
              </Link>
              <Link href="/docs" className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Xem tài liệu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Điểm nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-2xl mb-4">🎬</div>
              <h3 className="text-lg font-bold mb-2">Đa định dạng</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Hỗ trợ video, audio, PDF, slide, ảnh, văn bản, YouTube. Tự động trích xuất nội dung.</p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-2xl mb-4">📝</div>
              <h3 className="text-lg font-bold mb-2">Phương pháp học thuật</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cornell, Outline, Q&A, Flashcard, Tóm tắt nhanh, Executive Summary, Toán học LaTeX.</p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center text-2xl mb-4">🔒</div>
              <h3 className="text-lg font-bold mb-2">Bảo mật & Riêng tư</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">RLS (Row-Level Security) trên Neon Postgres. Dữ liệu của bạn là của bạn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Bắt đầu ngay hôm nay</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Free 100% — không cần thẻ tín dụng, không giới hạn thời gian dùng thử.</p>
          <Link href="/app" className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow">
            Tạo tài khoản miễn phí
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 dark:text-slate-500">
          <p>Zero AI Note — Open Source AI Research Tool</p>
        </div>
      </footer>
    </div>
  );
}