'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'dark' | 'light';
type Language  = 'vi' | 'en';

// ── Scroll reveal ─────────────────────────────────────────────────────────────
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

// ── i18n content ──────────────────────────────────────────────────────────────
const i18n = {
  vi: {
    home: 'Trang chủ',
    login: 'Đăng nhập',
    toc: 'Mục lục',
    badge: 'Tài liệu chính thức',
    hero: 'Tài liệu Zero AI Note',
    heroSub: 'Hướng dẫn đầy đủ về cách sử dụng, kiến trúc kỹ thuật và tích hợp API của Zero AI Note.',
    cta: 'Bắt đầu miễn phí',
    ctaReady: 'Sẵn sàng dùng thử?',
    sections: ['Giới thiệu', 'Bắt đầu nhanh', 'Lịch sử & Ghi chú', 'Phương pháp ghi chú', 'Kiến trúc kỹ thuật', 'Bảo mật', 'Routing', 'API Endpoints', 'Liên kết'],
    intro: {
      title: 'Giới thiệu',
      p1: 'Zero AI Note là công cụ ghi chú AI nguồn mở, chuyển đổi video, audio, PDF, YouTube thành các phiên hội thoại tương tác và ghi chú cấu trúc cao theo các phương pháp học thuật chuẩn quốc tế.',
      p2: 'Dự án sử dụng Neon Postgres cho database (lưu trữ chính), JWT cho authentication, Cloudflare R2 làm backup storage, và hệ thống quản lý Lịch sử Hội thoại & Ghi chú toàn diện với đầy đủ quyền CRUD.',
    },
    quickstart: {
      title: 'Bắt đầu nhanh',
      steps: [
        { text: 'Đăng ký tài khoản miễn phí', sub: 'Không cần thẻ tín dụng', linkText: 'Tạo tài khoản' },
        { text: 'Kéo thả file hoặc dán link YouTube vào khung chat', sub: 'Hỗ trợ video, audio, PDF, DOCX' },
        { text: 'Chọn phương pháp ghi chú', sub: 'Cornell, Outline, Q&A, Flashcard, Feynman, Tóm tắt nhanh' },
        { text: 'Tương tác & Xem kết quả trong Artifact Panel', sub: 'Bên phải màn hình, cập nhật realtime' },
        { text: 'Quản lý toàn bộ phiên trong Lịch sử (History)', sub: 'Tiếp tục chat, xem nhanh, đổi tên, ghim, chia sẻ, lưu trữ' },
      ],
    },
    history: {
      title: 'Lịch sử Hội thoại & Ghi chú',
      desc: 'Zero AI Note hợp nhất lịch sử chat với file Note được tạo ra thành các Chat Sessions. Người dùng có toàn quyền CRUD:',
      items: [
        { title: 'Tạo mới (Create)', desc: 'Bắt đầu cuộc trò chuyện mới hoặc note mới với một click.' },
        { title: 'Xem & Tiếp tục (Read & Resume)', desc: 'Mở lại toàn bộ ngữ cảnh hội thoại cũ và tự động tải Note Artifact kèm chế độ Xem nhanh (Quick Preview).' },
        { title: 'Cập nhật (Update)', desc: 'Đổi tên phiên làm việc, ghim các phiên quan trọng lên đầu danh sách.' },
        { title: 'Xóa & Lưu trữ (Delete & Archive)', desc: 'Chuyển vào Thùng rác với cơ chế lưu trữ 30 ngày tự động dọn dẹp để tối ưu dung lượng.' }
      ]
    },
    methods: {
      title: 'Phương pháp ghi chú',
      items: [
        { name: 'Cornell',        icon: 'view_agenda',          desc: 'Phân tách rõ ràng giữa ý tưởng cốt lõi và nội dung diễn giải, tối ưu cho ôn tập và ghi nhớ.' },
        { name: 'Outline',        icon: 'format_list_bulleted', desc: 'Cấu trúc cây phân cấp, lý tưởng cho sách giáo trình và tài liệu nghiên cứu chuyên sâu.' },
        { name: 'Q&A',            icon: 'quiz',                 desc: 'Chuyển đổi bài học thành định dạng Hỏi - Đáp, tự động trắc nghiệm năng lực ghi nhớ.' },
        { name: 'Flashcard',      icon: 'style',                desc: 'Tạo bộ thẻ ghi nhớ với hai mặt câu hỏi và đáp án, tối ưu cho ôn tập từ vựng và thuật ngữ.' },
        { name: 'Feynman',        icon: 'psychology',           desc: 'Giải thích khái niệm phức tạp bằng ngôn ngữ đơn giản như đang dạy lại cho người khác.' },
        { name: 'Tóm tắt nhanh', icon: 'bolt',                 desc: 'Phiên bản cô đọng nhất, đọc hiểu chỉ trong 60 giây.' },
      ],
    },
    tech: {
      title: 'Kiến trúc kỹ thuật',
      rows: [
        { label: 'Frontend',  value: 'Next.js 16, React 19, Tailwind CSS 4, Framer Motion' },
        { label: 'Database',  value: 'Neon Postgres serverless với RLS (Row-Level Security) & Drizzle ORM' },
        { label: 'Auth',      value: 'JWT (HS256) qua cookie HttpOnly, bcryptjs cho password hashing' },
        { label: 'Storage',   value: 'Cloudflare R2 (S3-compatible) — backup khi Neon database đầy' },
        { label: 'AI Engine', value: 'Google GenAI (Gemini 2.5 Flash), Tự kết nối AI (BYOK cho OpenAI/Anthropic)' },
        { label: 'Billing',   value: 'ZeroInvoice API, Hệ thống Coupon chiết khấu phần trăm (%) tự động' },
      ],
    },
    security: {
      title: 'Bảo mật',
      desc: 'Dữ liệu người dùng được bảo vệ bởi RLS (Row-Level Security) trên Neon Postgres. Mỗi user chỉ có thể truy cập dữ liệu của chính mình. Admin được xác thực qua',
      env: 'ADMIN_EMAIL',
      envSuffix: 'environment variable.',
    },
    routing: {
      title: 'Routing',
      rows: [
        { path: '/',     desc: 'Landing page (công khai). Đã đăng nhập → tự redirect về /app.' },
        { path: '/app',  desc: 'Dashboard (bắt buộc đăng nhập). Chưa đăng nhập → redirect về /.' },
        { path: '/docs', desc: 'Tài liệu này (công khai, SEO-friendly).' },
      ],
    },
    api: {
      title: 'API Endpoints',
      rows: [
        { method: 'POST', path: '/api/auth/register',  desc: 'Đăng ký. Tự gán role admin nếu email là ADMIN_EMAIL.' },
        { method: 'POST', path: '/api/auth/login',     desc: 'Đăng nhập, set cookie session JWT (7 ngày).' },
        { method: 'GET',  path: '/api/auth/session',   desc: 'Kiểm tra session hiện tại.' },
        { method: 'ANY',  path: '/api/admin/coupons',  desc: 'CRUD Coupon. Chỉ admin — 403 cho user thường.' },
        { method: 'POST', path: '/api/coupons/apply',  desc: 'Áp mã giảm giá. Yêu cầu đăng nhập.' },
        { method: 'GET',  path: '/api/health',         desc: 'Health check kết nối database.' },
      ],
    },
    links: {
      title: 'Liên kết',
      items: [
        { href: '/',                                        icon: 'home',       label: 'Trang chủ',         sub: 'Landing page' },
        { href: '/app?screen=register',                     icon: 'person_add', label: 'Đăng ký tài khoản', sub: 'Bắt đầu miễn phí' },
        { href: '/app?screen=login',                        icon: 'login',      label: 'Đăng nhập',         sub: 'Truy cập dashboard' },
        { href: 'https://github.com/CThawngs/Zero-AI-Note', icon: 'code',      label: 'GitHub Repository',  sub: 'Nguồn mở · MIT License', external: true },
      ],
    },
    footer: '© 2026 Zero AI Note. Mọi quyền được bảo lưu.',
    backHome: 'Quay lại trang chủ',
  },
  en: {
    home: 'Home',
    login: 'Sign In',
    toc: 'Contents',
    badge: 'Official Documentation',
    hero: 'Zero AI Note Docs',
    heroSub: 'Complete guide to using Zero AI Note — API integration, technical architecture, and more.',
    cta: 'Get started free',
    ctaReady: 'Ready to try it?',
    sections: ['Introduction', 'Quick Start', 'Chat & Notes History', 'Note Methods', 'Tech Architecture', 'Security', 'Routing', 'API Endpoints', 'Links'],
    intro: {
      title: 'Introduction',
      p1: 'Zero AI Note is an open-source AI note-taking platform that transforms video, audio, PDF, and YouTube into interactive chat sessions and highly structured academic notes.',
      p2: 'Built on Neon Postgres serverless database (primary storage), JWT authentication, Cloudflare R2 backup storage, and a complete Chat & Notes History management suite with full CRUD operations.',
    },
    quickstart: {
      title: 'Quick Start',
      steps: [
        { text: 'Create a free account', sub: 'No credit card required', linkText: 'Sign up' },
        { text: 'Drag & drop files or paste a YouTube link', sub: 'Supports video, audio, PDF, DOCX' },
        { text: 'Choose a note-taking method', sub: 'Cornell, Outline, Q&A, Flashcard, Feynman, Quick Summary' },
        { text: 'Interact & View results in Artifact Panel', sub: 'On the right side, updates in realtime' },
        { text: 'Manage all sessions in History', sub: 'Resume chat, quick preview, rename, pin, share, archive' },
      ],
    },
    history: {
      title: 'Chat & Notes History',
      desc: 'Zero AI Note unifies conversation history with generated Note artifacts into cohesive Chat Sessions with full CRUD control:',
      items: [
        { title: 'Create', desc: 'Start a clean chat session and note artifact with one click.' },
        { title: 'Read & Resume', desc: 'Resume any previous discussion context with linked notes automatically loaded in the Artifact Panel, plus instant modal Quick Preview.' },
        { title: 'Update', desc: 'Rename sessions, pin critical research threads to the top of your list.' },
        { title: 'Delete & Archive', desc: 'Move to Trash with 30-day retention countdown or purge permanently to manage storage.' }
      ]
    },
    methods: {
      title: 'Note-taking Methods',
      items: [
        { name: 'Cornell',       icon: 'view_agenda',          desc: 'Clear separation between core ideas and elaboration, optimized for review and retention.' },
        { name: 'Outline',       icon: 'format_list_bulleted', desc: 'Hierarchical tree structure, ideal for textbooks and in-depth research documents.' },
        { name: 'Q&A',           icon: 'quiz',                 desc: 'Converts lessons into Question & Answer format, automatically testing recall ability.' },
        { name: 'Flashcard',     icon: 'style',                desc: 'Creates two-sided flashcards with questions and answers, optimized for vocabulary and terminology.' },
        { name: 'Feynman',       icon: 'psychology',           desc: 'Explains complex concepts in simple terms as if teaching someone else.' },
        { name: 'Quick Summary', icon: 'bolt',                 desc: 'The most condensed version — readable in just 60 seconds.' },
      ],
    },
    tech: {
      title: 'Tech Architecture',
      rows: [
        { label: 'Frontend',  value: 'Next.js 16, React 19, Tailwind CSS 4, Framer Motion' },
        { label: 'Database',  value: 'Neon Postgres serverless with RLS (Row-Level Security) & Drizzle ORM' },
        { label: 'Auth',      value: 'JWT (HS256) via HttpOnly cookie, bcryptjs for password hashing' },
        { label: 'Storage',   value: 'Cloudflare R2 (S3-compatible) — backup when Neon database is full' },
        { label: 'AI Engine', value: 'Google GenAI (Gemini 2.5 Flash), BYOK (OpenAI/Anthropic keys)' },
        { label: 'Billing',   value: 'ZeroInvoice API, Percentage-only (%) dynamic coupon system' },
      ],
    },
    security: {
      title: 'Security',
      desc: 'User data is protected by RLS (Row-Level Security) on Neon Postgres. Each user can only access their own data. Admin is authenticated via the',
      env: 'ADMIN_EMAIL',
      envSuffix: 'environment variable.',
    },
    routing: {
      title: 'Routing',
      rows: [
        { path: '/',     desc: 'Landing page (public). Logged in → auto-redirect to /app.' },
        { path: '/app',  desc: 'Dashboard (login required). Not logged in → redirect to /.' },
        { path: '/docs', desc: 'This documentation (public, SEO-friendly).' },
      ],
    },
    api: {
      title: 'API Endpoints',
      rows: [
        { method: 'POST', path: '/api/auth/register',  desc: 'Register. Auto-assigns admin role if email matches ADMIN_EMAIL.' },
        { method: 'POST', path: '/api/auth/login',     desc: 'Login, sets JWT session cookie (7 days).' },
        { method: 'GET',  path: '/api/auth/session',   desc: 'Check current session.' },
        { method: 'ANY',  path: '/api/admin/coupons',  desc: 'CRUD Coupons. Admin only — 403 for regular users.' },
        { method: 'POST', path: '/api/coupons/apply',  desc: 'Apply discount code. Requires login.' },
        { method: 'GET',  path: '/api/health',         desc: 'Database connection health check.' },
      ],
    },
    links: {
      title: 'Links',
      items: [
        { href: '/',                                        icon: 'home',       label: 'Home',               sub: 'Landing page' },
        { href: '/app?screen=register',                     icon: 'person_add', label: 'Create Account',     sub: 'Get started free' },
        { href: '/app?screen=login',                        icon: 'login',      label: 'Sign In',            sub: 'Access dashboard' },
        { href: 'https://github.com/CThawngs/Zero-AI-Note', icon: 'code',      label: 'GitHub Repository',  sub: 'Open source · MIT License', external: true },
      ],
    },
    footer: '© 2026 Zero AI Note. All rights reserved.',
    backHome: 'Back to home',
  },
};

const sectionIds = ['intro', 'quickstart', 'methods', 'tech', 'security', 'routing', 'api', 'links'];

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
  const [theme,         setTheme]         = useState<ThemeMode>('light');
  const [lang,          setLang]          = useState<Language>('vi');
  const [mounted,       setMounted]       = useState(false);
  const [activeSection, setActiveSection] = useState('intro');
  const [tocOpen,       setTocOpen]       = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observe = useScrollReveal();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('zero-note-theme') as ThemeMode;
      const savedLang  = localStorage.getItem('zero-note-lang')  as Language;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.className = savedTheme === 'dark' ? 'dark' : 'light';
      } else {
        document.documentElement.className = 'light';
      }
      if (savedLang) setLang(savedLang);
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleScroll = () => {
      for (const id of [...sectionIds].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 110) {
          setActiveSection(id);
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
    try {
      localStorage.setItem('zero-note-theme', next);
      document.documentElement.className = next === 'dark' ? 'dark' : 'light';
    } catch {}
  };

  const toggleLang = () => {
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    try {
      localStorage.setItem('zero-note-lang', next);
    } catch {}
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
    setMobileMenuOpen(false);
  };

  const isDark = theme === 'dark';
  const t = i18n[lang];

  // ── Style tokens ─────────────────────────────────────────────────────────
  const bg      = isDark ? 'bg-[#0a0a0a] text-white'        : 'bg-white text-black';
  const surface = isDark ? 'bg-[#0f0f0f]'                   : 'bg-gray-50';
  const border  = isDark ? 'border-white/10'                 : 'border-gray-200';
  const muted   = isDark ? 'text-neutral-400'                : 'text-gray-500';
  const code    = isDark ? 'bg-white/8 text-neutral-300'     : 'bg-gray-100 text-gray-700';
  const hdr     = isDark ? 'bg-[#0a0a0a]/90 border-white/10' : 'bg-white/90 border-gray-200';
  const reveal: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(22px)',
    transition: 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)',
  };

  // shared toggle pill (lang + theme) — same as landing desktop
  const togglePill = `flex items-center gap-1 rounded-lg border px-1 py-0.5 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100'}`;
  const toggleBtn  = `text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`;
  const dividerV   = `w-px h-3.5 ${isDark ? 'bg-white/15' : 'bg-gray-300'}`;

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 overflow-x-hidden ${bg}`}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${hdr}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-7xl mx-auto">

          {/* Logo */}
          <Link href="/" className={`flex items-center gap-2 font-bold text-base sm:text-lg shrink-0 transition-opacity hover:opacity-80 ${isDark ? 'text-white' : 'text-black'}`}>
            <img src="/logo.png" alt="Zero AI Note Logo" className="w-7 h-7 rounded-full object-contain shrink-0" />
            <span className="hidden xs:inline sm:inline">Zero AI Note</span>
          </Link>

          {/* ── Desktop nav (sm+) ────────────────────────────────────────── */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Back to home pill */}
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:text-black hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>{t.home}</span>
            </Link>

            {/* Lang + Theme grouped pill */}
            <div className={togglePill}>
              <button onClick={toggleLang} className={toggleBtn} title="Switch Language">
                {lang === 'vi' ? 'VI' : 'EN'}
              </button>
              <div className={dividerV} />
              <button
                onClick={toggleTheme}
                className={`p-1 rounded-md transition-all duration-200 flex items-center justify-center ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`}
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '17px' }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            {/* Login CTA */}
            <Link
              href="/app?screen=login"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              {t.login}
            </Link>
          </div>

          {/* ── Mobile hamburger (< sm) ───────────────────────────────────── */}
          <button
            className={`sm:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'text-neutral-200 hover:bg-white/8' : 'text-gray-800 hover:bg-gray-100'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '22px' }}>
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* ── Mobile dropdown menu ─────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className={`sm:hidden ${isDark ? 'bg-[#0d0d0d] border-white/8' : 'bg-white border-gray-100'} border-t`}>
            {/* Nav links */}
            <div className="px-3 pt-3 pb-1 space-y-0.5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isDark ? 'text-neutral-200 hover:bg-white/6' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>home</span>
                </span>
                <span className="text-[15px] font-medium flex-1">{t.home}</span>
                <span className="material-symbols-outlined leading-none opacity-30" style={{ fontSize: '14px' }}>chevron_right</span>
              </Link>
              <Link
                href="/app?screen=login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isDark ? 'text-neutral-200 hover:bg-white/6' : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>login</span>
                </span>
                <span className="text-[15px] font-medium flex-1">{t.login}</span>
                <span className="material-symbols-outlined leading-none opacity-30" style={{ fontSize: '14px' }}>chevron_right</span>
              </Link>
            </div>

            {/* Divider */}
            <div className={`mx-4 my-2 h-px ${isDark ? 'bg-white/8' : 'bg-gray-100'}`} />

            {/* Lang + Theme row */}
            <div className="px-4 py-2 flex items-center gap-2">
              <button
                onClick={toggleLang}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                  isDark ? 'bg-white/6 text-neutral-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>language</span>
                <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </button>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className={`w-10 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${
                  isDark ? 'bg-white/6 text-neutral-300 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            {/* CTA */}
            <div className="px-4 pt-1 pb-4">
              <Link
                href="/app?screen=register"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] ${
                  isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                {t.cta}
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ LAYOUT ══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14">
        <div className="flex gap-8 xl:gap-14">

          {/* ── Sidebar TOC (xl+ desktop) ─────────────────────────────────── */}
          <aside className="hidden xl:block w-52 shrink-0">
            <div className="sticky top-20 pt-8 overflow-y-auto max-h-[calc(100vh-6rem)]">
              <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${muted}`}>{t.toc}</p>
              <nav className="space-y-0.5">
                {sectionIds.map((id, idx) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      activeSection === id
                        ? isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-black'
                        : isDark ? 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {t.sections[idx]}
                  </button>
                ))}
              </nav>

              <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{t.ctaReady}</p>
                <Link
                  href="/app?screen=register"
                  className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {t.cta}
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>arrow_forward</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 pt-8 pb-24">

            {/* TOC accordion — below xl */}
            <div className="xl:hidden mb-6">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  isDark ? 'border-white/10 bg-white/5 text-neutral-300' : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>toc</span>
                <span>{t.toc}</span>
                <span
                  className={`material-symbols-outlined ml-auto leading-none transition-transform duration-200 ${tocOpen ? 'rotate-180' : ''}`}
                  style={{ fontSize: '18px' }}
                >expand_more</span>
              </button>
              {tocOpen && (
                <div className={`mt-1 rounded-xl border overflow-hidden ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
                  {sectionIds.map((id, idx) => (
                    <button
                      key={id}
                      onClick={() => scrollTo(id)}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-medium border-b last:border-b-0 transition-colors ${
                        activeSection === id
                          ? isDark ? 'bg-white/8 text-white' : 'bg-gray-100 text-black'
                          : isDark ? 'border-white/5 text-neutral-300 hover:bg-white/5' : 'border-gray-100 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t.sections[idx]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <div ref={(el) => observe(el, 0)} style={reveal} className="mb-10 sm:mb-12">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-4 ${isDark ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>menu_book</span>
                {t.badge}
              </div>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                {t.hero}
              </h1>
              <p className={`text-sm sm:text-base leading-relaxed max-w-2xl ${muted}`}>{t.heroSub}</p>
            </div>

            {/* ── Introduction ──────────────────────────────────────────── */}
            <section id="intro" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.intro.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-xl border p-4 sm:p-6 ${surface} ${border}`}>
                <p className={`text-sm sm:text-base leading-relaxed mb-3 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-black'}>Zero AI Note</strong> {t.intro.p1.replace('Zero AI Note ', '')}
                </p>
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{t.intro.p2}</p>
              </div>
            </section>

            {/* ── Quick Start ───────────────────────────────────────────── */}
            <section id="quickstart" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.quickstart.title}</h2>
              <div className="space-y-2.5">
                {t.quickstart.steps.map((item, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 70)}
                    style={reveal}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{item.text}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{item.sub}</p>
                    </div>
                    {i === 0 && 'linkText' in item && (
                      <Link href="/app?screen=register" className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 whitespace-nowrap transition-colors ${isDark ? 'bg-white/8 text-neutral-300 hover:bg-white/15' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {(item as any).linkText}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Note Methods ──────────────────────────────────────────── */}
            <section id="methods" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.methods.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.methods.items.map((m, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 60)}
                    style={reveal}
                    className={`p-4 sm:p-5 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${surface} ${border}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>{m.icon}</span>
                      </span>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{m.name}</h3>
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${muted}`}>{m.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Tech Architecture ─────────────────────────────────────── */}
            <section id="tech" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.tech.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-xl border overflow-hidden ${border}`}>
                {t.tech.rows.map((row, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 sm:px-5 py-3 border-b last:border-b-0 ${border} ${isDark ? i % 2 === 0 ? 'bg-[#0f0f0f]' : 'bg-white/3' : i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide shrink-0 sm:w-20 sm:pt-0.5 ${muted}`}>{row.label}</span>
                    <span className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Security ──────────────────────────────────────────────── */}
            <section id="security" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.security.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-xl border p-4 sm:p-6 ${surface} ${border}`}>
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 ${muted}`} style={{ fontSize: '20px' }}>shield</span>
                  <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    {t.security.desc}{' '}
                    <code className={`px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] font-mono ${code}`}>{t.security.env}</code>
                    {' '}{t.security.envSuffix}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Routing ───────────────────────────────────────────────── */}
            <section id="routing" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.routing.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className={`rounded-xl border overflow-hidden ${border}`}>
                {t.routing.rows.map((r, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-4 sm:px-5 py-3 border-b last:border-b-0 ${border} ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`}>
                    <code className={`text-[11px] sm:text-[12px] font-mono font-semibold shrink-0 ${code} px-2 py-0.5 rounded`}>{r.path}</code>
                    <span className={`text-xs sm:text-sm ${muted}`}>{r.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── API Endpoints ─────────────────────────────────────────── */}
            <section id="api" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.api.title}</h2>
              <div className="space-y-2">
                {t.api.rows.map((ep, i) => (
                  <div
                    key={i}
                    ref={(el) => observe(el, i * 55)}
                    style={reveal}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${surface} ${border}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 font-mono ${isDark ? methodColor[ep.method] : methodColorLight[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className={`text-[11px] sm:text-[12px] font-mono font-semibold break-all ${isDark ? 'text-neutral-200' : 'text-gray-800'}`}>{ep.path}</code>
                    </div>
                    <p className={`text-xs sm:text-[13px] leading-relaxed ${muted}`}>{ep.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Links ─────────────────────────────────────────────────── */}
            <section id="links" className="mb-10 sm:mb-12 scroll-mt-20">
              <h2 ref={(el) => observe(el, 0)} style={reveal} className={`text-lg sm:text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.links.title}</h2>
              <div ref={(el) => observe(el, 80)} style={reveal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.links.items.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-3 sm:gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${surface} ${border}`}
                  >
                    <span className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>{link.icon}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{link.label}</p>
                      <p className={`text-xs ${muted}`}>{link.sub}</p>
                    </div>
                    <span className={`material-symbols-outlined ml-auto leading-none shrink-0 ${muted}`} style={{ fontSize: '16px' }}>
                      {link.external ? 'open_in_new' : 'chevron_right'}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className={`border-t py-6 sm:py-8 transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            <img src="/logo.png" alt="logo" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-contain" />
            <span className="text-sm sm:text-base">Zero AI Note</span>
          </div>
          <p className={`text-xs sm:text-sm ${muted}`}>{t.footer}</p>
          <Link href="/" className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '14px' }}>arrow_back</span>
            {t.backHome}
          </Link>
        </div>
      </footer>
    </div>
  );
}