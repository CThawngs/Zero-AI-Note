import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài liệu — Zero AI Note',
  description: 'Hướng dẫn sử dụng Zero AI Note — công cụ ghi chú AI đa định dạng.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <nav className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Zero AI Note Logo"
              className="w-8 h-8 rounded-full object-contain shadow-xs shrink-0"
            />
            <span className="font-bold text-lg">Zero AI Note</span>
          </Link>
          <Link href="/app" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            Đăng nhập
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8">Tài liệu</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Giới thiệu</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Zero AI Note là công cụ ghi chú AI nguồn mở, chuyển đổi video, audio, PDF, YouTube thành ghi chú cấu trúc cao theo các phương pháp học thuật.
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Dự án sử dụng Neon Postgres cho database, JWT cho authentication, và hỗ trợ Neon Object Storage hoặc Cloudflare R2 cho file storage.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Bắt đầu nhanh</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
            <li>Đăng ký tài khoản miễn phí tại trang <Link href="/app" className="text-blue-500 hover:underline">Đăng nhập</Link></li>
            <li>Kéo thả file hoặc dán link YouTube vào khung chat</li>
            <li>Chọn phương pháp ghi chú: Cornell, Outline, Q&A, hoặc Tóm tắt nhanh</li>
            <li>Xem kết quả trong Artifact Panel (bên phải)</li>
            <li>Xuất ra Markdown, DOCX, PDF, hoặc HTML</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Phương pháp ghi chú</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Cornell</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Phân tách rõ ràng giữa ý tưởng cốt lõi và nội dung diễn giải, tối ưu cho ôn tập và ghi nhớ.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Outline</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cấu trúc cây phân cấp, lý tưởng cho sách giáo trình và tài liệu nghiên cứu chuyên sâu.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Q&A</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Chuyển đổi bài học thành định dạng Hỏi - Đáp, tự động trắc nghiệm năng lực ghi nhớ.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Flashcard</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tạo bộ thẻ ghi nhớ với hai mặt câu hỏi và đáp án, tối ưu cho ôn tập từ vựng và thuật ngữ.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Tóm tắt nhanh</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Phiên bản cô đọng nhất, đọc hiểu chỉ trong 60 giây.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Kiến trúc kỹ thuật</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
            <li><strong>Frontend:</strong> Next.js 16, React 19, Tailwind CSS 4</li>
            <li><strong>Database:</strong> Neon Postgres serverless với RLS (Row-Level Security)</li>
            <li><strong>Auth:</strong> JWT (HS256) qua cookie HttpOnly, bcryptjs cho password hashing</li>
            <li><strong>Storage:</strong> Neon Object Storage (Beta) hoặc Cloudflare R2 (S3-compatible)</li>
            <li><strong>ORM:</strong> Drizzle ORM</li>
            <li><strong>AI:</strong> Google GenAI, BYOK (Bring Your Own Key) cho OpenAI/Anthropic</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Bảo mật</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Dữ liệu người dùng được bảo vệ bởi RLS (Row-Level Security) trên Neon Postgres. Mỗi user chỉ có thể truy cập dữ liệu của chính mình. Admin được xác thực qua <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm">ADMIN_EMAIL</code> environment variable.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Routing</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm">/</code> — Landing page (công khai). Đã đăng nhập sẽ tự chuyển hướng về <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm">/app</code>.</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm">/app</code> — Dashboard (bắt buộc đăng nhập). Chưa đăng nhập sẽ chuyển hướng về landing.</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm">/docs</code> — Tài liệu này (công khai, SEO-friendly).</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 text-sm">
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">POST /api/auth/register</code> — Đăng ký (tự gán role admin nếu email là ADMIN_EMAIL)</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">POST /api/auth/login</code> — Đăng nhập, set cookie session JWT (7 ngày)</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">GET /api/auth/session</code> — Kiểm tra session</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">GET/POST/PUT/DELETE /api/admin/coupons</code> — CRUD Coupon (chỉ admin, 403 cho user thường)</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">POST /api/coupons/apply</code> — Áp mã giảm giá (yêu cầu đăng nhập)</li>
            <li><code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">GET /api/health</code> — Health check DB</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Links</h2>
          <ul className="list-disc list-inside space-y-2">
            <li><Link href="/" className="text-blue-500 hover:underline">Trang chủ</Link></li>
            <li><Link href="/app" className="text-blue-500 hover:underline">Đăng nhập / Đăng ký</Link></li>
            <li><Link href="/docs" className="text-blue-500 hover:underline">Tài liệu này</Link></li>
            <li><a href="https://github.com/CThawngs/Zero-AI-Note" className="text-blue-500 hover:underline">GitHub Repository</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}