'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

type ThemeMode = 'dark' | 'light';

// ── Scroll reveal hook (same as landing) ─────────────────────────────────────
function useScrollReveal() {
  const observe = useCallback((el: Element | null, delay = 0) => {
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).style.opacity = '1';
              (entry.target as HTMLElement).style.transform = 'translateY(0)';
            }, delay);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    obs.observe(el);
  }, []);
  return observe;
}

const sections = [
  { id: 'intro',    label: 'Giới thiệu' },
  { id: 'quickstart', label: 'Bắt đầu nhanh' },
  { id: 'methods',  label: 'Phương pháp ghi chú' },
  { id: 'tech',     label: 'Kiến trúc kỹ thuật' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'routing',  label: 'Routing' },
  { id: 'api',      label: 'API Endpoints' },
  { id: 'links',    label: 'Liên kết' },
];

const noteMethods = [
  { name: 'Cornell',       icon: 'view_agenda',    desc: 'Phân tách rõ ràng giữa ý tưởng cốt lõi và nội dung diễn giải, tối ưu cho ôn tập và ghi nhớ.' },
  { name: 'Outline',       icon: 'format_list_bulleted', desc: 'Cấu trúc cây phân cấp, lý tưởng cho sách giáo trình và tài liệu nghiên cứu chuyên sâu.' },
  { name: 'Q&A',           icon: 'quiz',           desc: 'Chuyển đổi bài học thành định dạng Hỏi - Đáp, tự động trắc nghiệm năng lực ghi nhớ.' },
  { name: 'Flashcard',     icon: 'style',          desc: 'Tạo bộ thẻ ghi nhớ với hai mặt câu hỏi và đáp án, tối ưu cho ôn tập từ vựng và thuật ngữ.' },
  { name: 'Tóm tắt nhanh', icon: 'bolt',           desc: 'Phiên bản cô đọng nhất, đọc hiểu chỉ trong 60 giây.' },
];

const techStack = [
  { label: 'Frontend',  value: 'Next.js 16, React 19, Tailwind CSS 4' },
  { label: 'Database',  value: 'Neon Postgres serverless với RLS (Row-Level Security)' },
  { label: 'Auth',      value: 'JWT (HS256) qua cookie HttpOnly, bcryptjs cho password hashing' },
  { label: 'Storage',   value: 'Neon Object Storage (Beta) hoặc Cloudflare R2 (S3-compatible)' },
  { label: 'ORM',       value: 'Drizzle ORM' },
  { label: 'AI',        value: 'Google GenAI, BYOK (Bring Your Own Key) cho OpenAI/Anthropic' },
];

const apiEndpoints = [
  { method: 'POST', path: '/api/auth/register',   desc: 'Đăng ký. Tự gán role admin nếu email là ADMIN_EMAIL.' },
  { method: 'POST', path: '/api/auth/login',      desc: 'Đăng nhập, set cookie session JWT (7 ngày).' },
  { method: 'GET',  path: '/api/auth/session',    desc: 'Kiểm tra session hiện tại.' },
  { method: 'ANY',  path: '/api/admin/coupons',   desc: 'CRUD Coupon. Chỉ admin — 403 cho user thường.' },
  { method: 'POST', path: '/api/coupons/apply',   desc: 'Áp mã giảm giá. Yêu cầu đăng nhập.' },
  { method: 'GET',  path: '/api/health',          desc: 'Health check kết nối database.' },
];

const methodColor: Record<string, string> = {
  POST: 'text-emerald-400 bg-emerald-400/10',
  GET:  'text-sky-400 bg-sky-400/10',
  ANY:  'text-violet-400 bg-violet-400/10',
};
const methodColorLight: Record<string, string> = {
  POST: 'text-emerald-700 bg-emerald-50',
  GET:  'text-sky-700 bg-sky-50',
  ANY:  'text-violet-700 bg-violet-50',
};

export default function DocsPage() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const observe = useScrollReveal();

  useEffect(() => {
    const saved = localStorage.getItem('zero-note-theme') as ThemeMode || 'dark';
    setTheme(saved);
    document.documentElement.className = saved === 'dark' ? 'dark' : 'light';
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => {
      for (const s of [...sections].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(s.id);
          return;
        }
      }
      setActiveSection('intro');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('zero-note-theme', next);
    document.documentElement.className = next === 'dark' ? 'dark' : 'light';
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileNavOpen(false);
  };

  if (!mounted) return null;

  const isDark = theme === 'dark';

  // ── Style tokens (same palette as landing) ───────────────────────────────
  const bg       = isDark ? 'bg-[#0a0a0a] text-white'       : 'bg-white text-black';
  const surface  = isDark ? 'bg-[#0f0f0f]'                  : 'bg-gray-50';
  const border   = isDark ? 'border-white/10'                : 'border-gray-200';
  const muted    = isDark ? 'text-neutral-400'               : 'text-gray-500';
  const code     = isDark ? 'bg-white/8 text-neutral-300'    : 'bg-gray-100 text-gray-700';
  const hdr      = isDark ? 'bg-[#0a0a0a]/85 border-white/10' : 'bg-white/85 border-gray-200';
  const reveal: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(24px)',
    transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${bg}`}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${hdr}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2.5 font-bold text-lg transition-opacity hover:opacity-80 ${isDark ? 'text-white' : 'text-black'}`}>
            <img src="/logo.png" alt="Zero AI Note Logo" className="w-7 h-7 rounded-full object-contain shrink-0" />
            <span>Zero AI Note</span>
          </Link>

          {/* Desktop right actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Back to landing */}
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:text-black hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>Trang chủ</span>
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '19px' }}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link
              href="/app?screen=login"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              Đăng nhập
            </Link>
          </div>

          {/* Mobile: back + theme */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                isDark ? 'border-white/10 text-neutral-300 hover:bg-white/8' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>Trang chủ</span>
            </Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-neutral-400 hover:bg-white/8' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '19px' }}>
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Layout ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20">
        <div className="flex gap-10 xl:gap-16">

          {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
          <aside className="hidden lg:block w-52 xl:w-60 shrink-0">
            <div className="sticky top-24 pt-8">
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${muted}`}>Nội dung</p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      activeSection === s.id
                        ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
                        : isDark ? 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>

              {/* Get started CTA */}
              <div className={`mt-8 p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Sẵn sàng dùng thử?</p>
                <Link
                  href="/app?screen=register"
                  className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Bắt đầu miễn phí
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Main content ───────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 pt-8 pb-24">

            {/* Mobile section jump */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isDark ? 'border-white/10 bg-white/5 text-neutral-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>toc</span>
                <span>Mục lục</span>
                <span className={`material-symbols-outlined ml-auto leading-none transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} style={{ fontSize: '18px' }}>expand_more</span>
              </button>
              {mobileNavOpen && (
                <div className={`mt-1 rounded-xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium border-b last:border-b-0 transition-colors ${
                        isDark ? 'border-white/5 text-neutral-300 hover:bg-white/6' : 'border-gray-100 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div
              ref={(el) => observe(el, 0)}
              style={reveal}
              className="mb-12"
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-4 ${isDark ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>menu_book</span>
                Tài liệu chính thức
              </div>
              <h1 className={`text-3xl sm:text-4xl font-bold leading-tight mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                Tài liệu Zero AI Note
              </h1>
              <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${muted}`}>
                Hướng dẫn đầy đủ về cách sử dụng, kiến trúc kỹ thuật và tích hợp API của Zero AI Note.
              </p>
            </div>

            {/* ── Giới thiệu ─────────────────────────────────────────────── */}
            <section id="intro" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Giới thiệu
              </h2>
              <div
                ref={(el) => observe(el, 80)}
                style={reveal}
                className={`rounded-xl border p-5 sm:p-6 ${surface} ${border}`}
              >
                <p className={`text-sm sm:text-base leading-relaxed mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-black'}>Zero AI Note</strong> là công cụ ghi chú AI nguồn mở, chuyển đổi video, audio, PDF, YouTube thành ghi chú cấu trúc cao theo các phương pháp học thuật.
                </p>
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Dự án sử dụng Neon Postgres cho database, JWT cho authentication, và hỗ trợ Neon Object Storage hoặc Cloudflare R2 cho file storage.
                </p>
              </div>
            </section>

            {/* ── Bắt đầu nhanh ──────────────────────────────────────────── */}
            <section id="quickstart" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Bắt đầu nhanh
              </h2>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Đăng ký tài khoản miễn phí', sub: 'Không cần thẻ tín dụng', link: '/app?screen=register', linkText: 'Tạo tài khoản' },
                  { step: '2', text: 'Kéo thả file hoặc dán link YouTube vào khung chat', sub: 'Hỗ trợ video, audio, PDF, DOCX' },
                  { step: '3', text: 'Chọn phương pháp ghi chú', sub: 'Cornell, Outline, Q&A, Flashcard, Tóm tắt nhanh' },
                  { step: '4', text: 'Xem kết quả trong Artifact Panel', sub: 'Bên phải màn hình, cập nhật realtime' },
                  { step: '5', text: 'Xuất bản note hoàn chỉnh', sub: 'Định dạng Markdown, DOCX, PDF, HTML' },
                ].map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 70)}
                    style={reveal}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{item.text}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{item.sub}</p>
                    </div>
                    {item.link && (
                      <Link href={item.link} className={`text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors ${isDark ? 'bg-white/8 text-neutral-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {item.linkText}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Phương pháp ghi chú ────────────────────────────────────── */}
            <section id="methods" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Phương pháp ghi chú
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {noteMethods.map((m, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`p-5 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${surface} ${border}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-9 h-9 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: '20px' }}>{m.icon}</span>
                      </span>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{m.name}</h3>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>{m.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Kiến trúc kỹ thuật ─────────────────────────────────────── */}
            <section id="tech" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Kiến trúc kỹ thuật
              </h2>
              <div
                ref={(el) => observe(el, 80)}
                className={`rounded-xl border overflow-hidden ${border}`}
              >
                {techStack.map((t, i) => (
                  <div
                    key={i}
                    className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3.5 border-b last:border-b-0 ${border} ${surface} ${i % 2 === 0 ? '' : isDark ? 'bg-white/3' : 'bg-gray-50/70'}`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wide shrink-0 sm:w-20 sm:pt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{t.label}</span>
                    <span className={`text-sm ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{t.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Bảo mật ────────────────────────────────────────────────── */}
            <section id="security" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Bảo mật
              </h2>
              <div
                ref={(el) => observe(el, 80)}
                style={reveal}
                className={`rounded-xl border p-5 sm:p-6 ${surface} ${border}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} style={{ fontSize: '20px' }}>shield</span>
                  <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Dữ liệu người dùng được bảo vệ bởi RLS (Row-Level Security) trên Neon Postgres. Mỗi user chỉ có thể truy cập dữ liệu của chính mình. Admin được xác thực qua{' '}
                    <code className={`px-1.5 py-0.5 rounded text-[13px] font-mono ${code}`}>ADMIN_EMAIL</code>
                    {' '}environment variable.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Routing ────────────────────────────────────────────────── */}
            <section id="routing" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Routing
              </h2>
              <div
                ref={(el) => observe(el, 80)}
                style={reveal}
                className={`rounded-xl border overflow-hidden ${border}`}
              >
                {[
                  { path: '/',     desc: 'Landing page (công khai). Đã đăng nhập → tự redirect về /app.' },
                  { path: '/app',  desc: 'Dashboard (bắt buộc đăng nhập). Chưa đăng nhập → redirect về /.' },
                  { path: '/docs', desc: 'Tài liệu này (công khai, SEO-friendly).' },
                ].map((r, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 px-5 py-3.5 border-b last:border-b-0 ${border} ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <code className={`text-[13px] font-mono font-semibold shrink-0 ${code} px-2 py-0.5 rounded`}>{r.path}</code>
                    <span className={`text-sm ${muted}`}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── API Endpoints ──────────────────────────────────────────── */}
            <section id="api" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                API Endpoints
              </h2>
              <div className="space-y-2.5">
                {apiEndpoints.map((ep, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 font-mono ${isDark ? methodColor[ep.method] : methodColorLight[ep.method]}`}>
                      {ep.method}
                    </span>
                    <code className={`text-[13px] font-mono font-semibold shrink-0 ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{ep.path}</code>
                    <span className={`text-xs sm:text-sm ${muted} sm:ml-1`}>{ep.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Links ─────────────────────────────────────────────────── */}
            <section id="links" className="mb-14 scroll-mt-24">
              <h2
                ref={(el) => observe(el, 0)}
                style={reveal}
                className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
              >
                Liên kết
              </h2>
              <div
                ref={(el) => observe(el, 80)}
                style={reveal}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {[
                  { href: '/',                                     icon: 'home',        label: 'Trang chủ',           sub: 'Landing page' },
                  { href: '/app?screen=register',                  icon: 'person_add',  label: 'Đăng ký tài khoản',   sub: 'Bắt đầu miễn phí' },
                  { href: '/app?screen=login',                     icon: 'login',       label: 'Đăng nhập',           sub: 'Truy cập dashboard' },
                  { href: 'https://github.com/CThawngs/Zero-AI-Note', icon: 'code',    label: 'GitHub Repository',   sub: 'Nguồn mở · MIT License', external: true },
                ].map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${surface} ${border}`}
                  >
                    <span className={`w-9 h-9 flex items-center justify-center rounded-lg shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '20px' }}>{link.icon}</span>
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{link.label}</p>
                      <p className={`text-xs ${muted}`}>{link.sub}</p>
                    </div>
                    <span className={`material-symbols-outlined ml-auto leading-none ${muted}`} style={{ fontSize: '16px' }}>{link.external ? 'open_in_new' : 'chevron_right'}</span>
                  </Link>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className={`border-t py-8 transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`flex items-center gap-2.5 font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            <img src="/logo.png" alt="logo" className="w-6 h-6 rounded-full object-contain" />
            <span>Zero AI Note</span>
          </div>
          <p className={`text-sm ${muted}`}>© 2026 Zero AI Note. Mọi quyền được bảo lưu.</p>
          <Link href="/" className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>arrow_back</span>
            Quay lại trang chủ
          </Link>
        </div>
      </footer>
    </div>
  );
}