'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';

type Language = 'vi' | 'en';
type ThemeMode = 'dark' | 'light';

// === Nội dung đa ngôn ngữ ===
const content = {
  vi: {
    nav: { docs: 'Tài liệu', login: 'Đăng nhập', cta: 'Bắt đầu miễn phí' },
    hero: {
      badge: 'AI-Powered',
      badgeSub: 'Research',
      heading: 'Ghi chú thông minh với AI — Take Note hiệu quả hơn bao giờ hết',
      sub: 'Ứng dụng Note thế hệ mới giúp bạn tối ưu hóa quy trình học tập và làm việc. Chuyển đổi hàng giờ nội dung thành kiến thức có cấu trúc với sự hỗ trợ của AI đa ngôn ngữ.',
      cta: 'Bắt đầu miễn phí',
      cta2: 'Xem tài liệu',
      badge2: 'AI Xử lý',
      badge3: 'Với độ chính xác 99.9%'
    },
    why: {
      title: 'Vì sao khác biệt?',
      items: [
        { icon: 'mic', title: 'Ghi chú đa phương thức', desc: 'App ghi chú hỗ trợ xử lý mượt mà video, audio và văn bản pha trộn nhiều ngôn ngữ. Mang lại trải nghiệm Take Note liền mạch và toàn diện.' },
        { icon: 'speed', title: 'Tốc độ vượt trội', desc: 'Xử lý bất đồng bộ, nhận thông báo ngay khi note sẵn sàng, không cần ngồi chờ.' },
        { icon: 'auto_fix_high', title: 'Take Note không giới hạn', desc: 'Không chỉ Cornell hay Mindmap. Chỉ cần mô tả phương pháp bạn muốn, AI sẽ tự động định dạng và tối ưu hóa ghi chú theo đúng phong cách riêng của bạn.' },
        { icon: 'lock', title: 'Hệ thống Note an toàn', desc: 'Không chỉ Gemini, hay Mistral. Chỉ cần mô tả phương pháp bạn muốn, AI sẽ tự động định dạng và tối ưu hóa ghi chú theo đúng phong cách riêng của bạn.' },
        { icon: 'sync', title: 'Đồng bộ hóa Ghi chú', desc: 'Truy cập và ghi chú mọi lúc trên mọi thiết bị có trình duyệt web.' },
        { icon: 'view_quilt', title: 'Xuất layout chuẩn', desc: 'Giữ nguyên định dạng và bảng biểu khi xuất.' },
        { icon: 'analytics', title: 'Phân tích chuyên sâu', desc: 'AI trích xuất insights và tạo liên kết logic.' }
      ]
    },
    how: {
      title: 'Cách hoạt động',
      steps: [
        { icon: 'upload_file', title: '1. Tải lên tài liệu ghi chú', desc: 'Kéo thả file video, audio, tài liệu hoặc dán link để bắt đầu ghi chú.' },
        { icon: 'memory', title: '2. AI xử lý và Take Note', desc: 'Hệ thống phân tích và tự động ghi chú theo format bạn yêu cầu.' },
        { icon: 'task', title: '3. Nhận bản Note hoàn chỉnh', desc: 'Tải xuống bản note hoàn chỉnh định dạng DOCX, PDF với cấu trúc rõ ràng.' }
      ]
    },
    pricing: {
      title: 'Bắt đầu miễn phí, nâng cấp khi cần',
      link: 'Xem đầy đủ bảng giá',
      plans: [
        { name: 'Miễn phí', desc: 'Trải nghiệm cơ bản cho cá nhân.', price: '0đ', period: '/tháng', features: ['3 giờ xử lý / tháng', 'File tối đa 30 phút', 'Xuất PDF cơ bản'], cta: 'Tạo tài khoản' },
        { name: 'Pro', desc: 'Dành cho nghiên cứu sinh & chuyên gia.', price: '99K', period: '/tháng', features: ['50 giờ xử lý / tháng', 'File tối đa 2 giờ/phiên', 'Mọi định dạng học thuật', 'Ưu tiên xử lý'], cta: 'Nâng cấp Pro' },
        { name: 'Ultra', desc: 'Giải pháp tối ưu cho tổ chức.', price: '199K', period: '/tháng', features: ['Tất lý giờ xử lý/tháng', 'Tốc độ cao nhất', 'Xuất DOCX cao cấp', 'Hỗ trợ ưu tiên qua email', 'Phân tích đa file'], cta: 'Nâng cấp Ultra', badge: 'Ultra' }
      ]
    },
    cta: {
      title: 'Sẵn sàng thử chưa?',
      sub: 'Trải nghiệm sức mạnh của ghi chú AI chuẩn học thuật ngay hôm nay.',
      cta: 'Tạo tài khoản miễn phí'
    },
    footer: '© 2026 Zero AI Note. Mọi quyền được bảo lưu.',
    links: ['Privacy Policy', 'Terms of Service', 'Twitter', 'LinkedIn', 'Contact']
  },
  en: {
    nav: { docs: 'Docs', login: 'Login', cta: 'Get started free' },
    hero: {
      badge: 'AI-Powered',
      badgeSub: 'Research',
      heading: 'AI-powered note taking — Take Note more effectively than ever',
      sub: 'A next-generation Note app that optimizes your study and work workflows. Transform hours of content into structured knowledge with multilingual AI support.',
      cta: 'Get started free',
      cta2: 'View docs',
      badge2: 'AI Processing',
      badge3: '99.9% Accuracy'
    },
    why: {
      title: 'Why different?',
      items: [
        { icon: 'mic', title: 'Multimodal Note Taking', desc: 'Seamlessly process video, audio, and mixed-language text. A comprehensive Take Note experience.' },
        { icon: 'speed', title: 'Speed & Async', desc: 'Async processing with instant notification when your note is ready — no waiting around.' },
        { icon: 'auto_fix_high', title: 'Unlimited Note Taking', desc: 'Not just Cornell or Mindmap. Describe your desired method, and AI auto-formats to your unique style.' },
        { icon: 'lock', title: 'Secure Note System', desc: 'Not just Gemini or Mistral. Describe your desired method, and AI auto-formats and optimizes notes to your unique style.' },
        { icon: 'sync', title: 'Sync Notes', desc: 'Access and take notes anywhere, on any device with a web browser.' },
        { icon: 'view_quilt', title: 'Layout Export', desc: 'Preserve formatting and tables on export.' },
        { icon: 'analytics', title: 'Deep Insights', desc: 'AI extracts insights and builds logical connections.' }
      ]
    },
    how: {
      title: 'How it works',
      steps: [
        { icon: 'upload_file', title: '1. Upload your document', desc: 'Drag & drop video, audio, PDF, or paste a link to start note taking.' },
        { icon: 'memory', title: '2. AI processes & takes notes', desc: 'System analyzes and automatically takes notes in your requested format.' },
        { icon: 'task', title: '3. Get your complete Note', desc: 'Download your final note as DOCX, PDF with clear structure.' }
      ]
    },
    pricing: {
      title: 'Start free, upgrade when you need',
      link: 'View full pricing',
      plans: [
        { name: 'Free', desc: 'Basic experience for individuals.', price: '0đ', period: '/month', features: ['3 hours processing / month', 'Max file 30 min', 'Basic PDF export'], cta: 'Create account' },
        { name: 'Pro', desc: 'For researchers & professionals.', price: '99K', period: '/month', features: ['50 hours processing / month', 'Max file 2 hours/session', 'All academic formats', 'Priority processing'], cta: 'Upgrade to Pro' },
        { name: 'Ultra', desc: 'Best for organizations.', price: '199K', period: '/month', features: ['Unlimited processing/month', 'Highest speed', 'Advanced DOCX export', 'Priority email support', 'Multi-file analysis'], cta: 'Upgrade to Ultra', badge: 'Ultra' }
      ]
    },
    cta: {
      title: 'Ready to try?',
      sub: 'Experience the power of academic-grade AI note taking today.',
      cta: 'Create free account'
    },
    footer: '© 2026 Zero AI Note. All rights reserved.',
    links: ['Privacy Policy', 'Terms of Service', 'Twitter', 'LinkedIn', 'Contact']
  }
};

// === Scroll Reveal Hook ===
function useScrollReveal() {
  const observe = useCallback((el: Element | null, delay: number = 0) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).style.opacity = '1';
              (entry.target as HTMLElement).style.transform = 'translateY(0) scale(1)';
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return observe;
}

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('vi');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const observe = useScrollReveal();

  useEffect(() => {
    const savedLang = localStorage.getItem('zero-note-lang') as Language || 'vi';
    const savedTheme = localStorage.getItem('zero-note-theme') as ThemeMode || 'dark';
    setLang(savedLang);
    setTheme(savedTheme);
    setMounted(true);
    document.documentElement.className = savedTheme === 'dark' ? 'dark' : 'light';
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('zero-note-lang', lang);
  }, [lang, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('zero-note-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
  }, [theme, mounted]);

  const t = content[lang];
  const isDark = theme === 'dark';

  if (!mounted) return null;

  const bgClass = isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black';
  const surfaceClass = isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-600';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';

  const revealStyle: React.CSSProperties = {
    opacity: 0,
    transform: 'translateY(32px) scale(0.97)',
    transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
  };

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-white selection:text-black transition-colors duration-300 ${bgClass}`}>
      {/* ===== HEADER ===== */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]/85 border-white/10' : 'bg-white/85 border-gray-200'}`}>
        <div className="relative flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Left: Logo */}
          <Link href="/" className={`font-bold text-lg sm:text-xl flex items-center gap-2.5 transition-opacity hover:opacity-90 ${isDark ? 'text-white' : 'text-black'}`}>
            <img
              src="/logo.png"
              alt="Zero AI Note Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain shadow-xs shrink-0"
            />
            <span>Zero AI Note</span>
          </Link>

          {/* Center: Docs Page Link (Dead Center on desktop) */}
          <nav className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link
              href="/docs"
              className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-2 shadow-xs ${
                isDark
                  ? 'border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-white/25 hover:bg-white/10'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:text-black hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <span className="material-symbols-outlined text-base" style={{ fontSize: '18px' }}>
                menu_book
              </span>
              <span>{t.nav.docs}</span>
            </Link>
          </nav>

          {/* Right: Actions & Toggles (Desktop) */}
          <div className="hidden md:flex items-center gap-4 sm:gap-5">
            {/* Language & Theme toggles */}
            <div className={`flex items-center gap-1 rounded-lg border px-1 py-0.5 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100'}`}>
              <button
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all duration-200 ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`}
                title="Toggle Language"
              >
                {lang === 'vi' ? 'VI' : 'EN'}
              </button>
              <div className={`w-px h-3.5 ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-1 rounded-md transition-all duration-200 flex items-center justify-center ${isDark ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-white'}`}
                aria-label="Toggle theme"
              >
                <span className="material-symbols-outlined text-base leading-none" style={{ fontSize: '17px' }}>
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>

            {/* Login link */}
            <Link
              href="/app?screen=login"
              className={`text-sm font-medium transition-colors duration-200 ${isDark ? 'text-neutral-300 hover:text-white' : 'text-gray-700 hover:text-black'}`}
            >
              {t.nav.login}
            </Link>

            {/* CTA */}
            <Link
              href="/app?screen=register"
              className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-sm ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}
            >
              {t.nav.cta}
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            className={`md:hidden p-2 rounded-lg border transition-colors ${
              isDark ? 'border-white/10 hover:bg-white/5 text-neutral-200' : 'border-gray-200 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl leading-none">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t px-4 py-5 space-y-4 backdrop-blur-2xl transition-all ${isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-white/95 border-gray-200'}`}>
            <div className="flex flex-col space-y-2">
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium border transition-colors ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-neutral-200 hover:bg-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                  <span>{t.nav.docs}</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward_ios</span>
              </Link>
              <Link
                href="/app?screen=login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors ${
                  isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">login</span>
                  <span>{t.nav.login}</span>
                </div>
                <span className="material-symbols-outlined text-sm opacity-50">arrow_forward_ios</span>
              </Link>
            </div>

            <div className={`pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isDark ? 'border-white/15 bg-white/5 text-neutral-200' : 'border-gray-200 bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">language</span>
                  {lang === 'vi' ? 'Tiếng Việt' : 'English'}
                </button>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                    isDark ? 'border-white/15 bg-white/5 text-neutral-200' : 'border-gray-200 bg-gray-100 text-gray-700'
                  }`}
                  aria-label="Toggle theme"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isDark ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              </div>

              <Link
                href="/app?screen=register"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {t.nav.cta}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow pt-20 sm:pt-24">
        {/* ===== HERO ===== */}
        <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 space-y-5 sm:space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <div className="text-sm font-medium leading-tight">
                <div>{t.hero.badge}</div>
                <div className={`text-xs ${textMuted}`}>{t.hero.badgeSub}</div>
              </div>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {t.hero.heading}
            </h1>
            <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${textMuted}`}>
              {t.hero.sub}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link href="/app?screen=register" className={`font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
                {t.hero.cta}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link href="/docs" className={`border font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:bg-gray-100 text-black'}`}>
                <span className="material-symbols-outlined text-sm">menu_book</span>
                {t.hero.cta2}
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-sm sm:max-w-md lg:max-w-lg relative">
            <div className={`absolute -inset-4 blur-3xl rounded-full opacity-50 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
            <div className={`border rounded-xl overflow-hidden relative z-10 shadow-2xl ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-gray-200'}`}>
              <img
                alt="Zero AI Note UI"
                className="w-full h-auto block"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo4FbFB7fOmPlv-QU-QIwcpZ6-qIxFmR2VjU964mMA5G0iJEa74T4h3IPTuWodbtMeYWHQ0mpe7ADzs02YOOr8QWIr_l8WfrfqqWk892DbRSubW1GKRH7D97uSkhUGXNMErp1VqUx8FQciET6rwtD_Csv6VRTPfcu1oKLEM5cwePi2wzW_QrRbFqpV0hW_EsF9wL3vLq5HCyagpSknHSL3Gy8ud6Nc6jRWhxXVsnTh12jsxCKKPiDd"
              />
            </div>
            <div className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 backdrop-blur-xl border p-3 sm:p-4 rounded-xl z-20 shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-gray-200'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="material-symbols-outlined text-xl sm:text-2xl">auto_fix_high</span>
                <div>
                  <div className={`font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-black'}`}>{t.hero.badge2}</div>
                  <div className={`text-xs ${textMuted}`}>{t.hero.badge3}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== WHY — Bento Grid ===== */}
        <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-7xl mx-auto">
          <h2
            ref={(el) => observe(el, 0)}
            style={revealStyle}
            className={`text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 ${isDark ? 'text-white' : 'text-black'}`}
          >{t.why.title}</h2>

          {/* Desktop bento grid (lg+) */}
          <div className="hidden lg:grid grid-cols-3 gap-4 grid-rows-[220px_220px_180px]">
            {t.why.items.map((item, i) => {
              const gridPos = [
                'col-start-1 col-end-2 row-start-1 row-end-3',
                'col-start-2 col-end-3 row-start-1 row-end-2',
                'col-start-3 col-end-4 row-start-1 row-end-2',
                'col-start-2 col-end-4 row-start-2 row-end-3',
                'col-start-1 col-end-2 row-start-3 row-end-4',
                'col-start-2 col-end-3 row-start-3 row-end-4',
                'col-start-3 col-end-4 row-start-3 row-end-4',
              ][i];
              const isLarge = i === 0;
              const staggerDelay = [80, 160, 240, 220, 300, 380, 460][i];

              return (
                <div
                  key={i}
                  ref={(el) => observe(el, staggerDelay)}
                  style={revealStyle}
                  className={`${surfaceClass} border rounded-xl transition-[transform,box-shadow,background] duration-300 hover:scale-[1.02] p-6 flex flex-col ${isDark ? `border-white/10 ${hoverBg}` : `border-gray-200 ${hoverBg}`} ${isLarge ? 'relative overflow-hidden' : ''} ${gridPos}`}
                >
                  {isLarge && (
                    <>
                      {/* Decorative bg glow */}
                      <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
                      {/* Icon at top */}
                      <span className="material-symbols-outlined text-4xl mb-4 relative z-10">{item.icon}</span>
                      {/* Visual waveform illustration to fill space */}
                      <div className="flex-1 flex items-center justify-center py-4 relative z-10">
                        <svg viewBox="0 0 200 64" fill="none" className={`w-full max-w-[160px] opacity-30 ${isDark ? 'text-white' : 'text-black'}`} aria-hidden="true">
                          {[4,12,26,8,40,18,30,6,22,36,14,28,10,20,34].map((h, idx) => (
                            <rect
                              key={idx}
                              x={idx * 13 + 2}
                              y={(64 - h) / 2}
                              width="8"
                              height={h}
                              rx="4"
                              fill="currentColor"
                            />
                          ))}
                        </svg>
                      </div>
                      {/* Text at bottom */}
                      <div className="relative z-10">
                        <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                        <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
                      </div>
                    </>
                  )}
                  {!isLarge && (
                    <>
                      <span className="material-symbols-outlined text-4xl mb-4">{item.icon}</span>
                      <div>
                        <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                        <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tablet grid (md) — 2 columns */}
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
            {t.why.items.map((item, i) => (
              <div
                key={i}
                ref={(el) => observe(el, i * 80)}
                style={revealStyle}
                className={`${surfaceClass} border rounded-xl p-5 flex flex-col ${isDark ? 'border-white/10' : 'border-gray-200'} ${i === 0 ? 'col-span-2' : ''}`}
              >
                <span className="material-symbols-outlined text-3xl mb-3">{item.icon}</span>
                <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile — single column */}
          <div className="grid md:hidden grid-cols-1 gap-3">
            {t.why.items.map((item, i) => (
              <div
                key={i}
                ref={(el) => observe(el, i * 60)}
                style={revealStyle}
                className={`${surfaceClass} border rounded-xl p-5 flex flex-col ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              >
                <span className="material-symbols-outlined text-3xl mb-3">{item.icon}</span>
                <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== HOW ===== */}
        <section className={`border-y py-12 sm:py-16 transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="px-4 sm:px-6 max-w-7xl mx-auto text-center">
            <h2
              ref={(el) => observe(el, 0)}
              style={revealStyle}
              className={`text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 ${isDark ? 'text-white' : 'text-black'}`}
            >{t.how.title}</h2>
            <div className="flex flex-col md:flex-row justify-center items-start gap-8 relative">
              <div className={`hidden md:block absolute top-12 left-[15%] right-[15%] h-px z-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              {t.how.steps.map((step, i) => (
                <div
                  key={i}
                  ref={(el) => observe(el, i * 150)}
                  style={revealStyle}
                  className={`flex-1 flex flex-col items-center relative z-10 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}
                >
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border flex items-center justify-center mb-4 sm:mb-6 transition-colors ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="material-symbols-outlined text-3xl sm:text-4xl">{step.icon}</span>
                  </div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${textMuted} text-center max-w-xs`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRICING ===== */}
        <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-5xl mx-auto text-center">
          <h2
            ref={(el) => observe(el, 0)}
            style={revealStyle}
            className={`text-2xl sm:text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}
          >{t.pricing.title}</h2>
          <Link
            ref={(el) => observe(el, 80)}
            style={revealStyle}
            href="/docs"
            className={`text-sm font-medium hover:underline mb-8 sm:mb-12 inline-flex items-center gap-1 transition-colors ${isDark ? 'text-white' : 'text-black'}`}
          >
            {t.pricing.link}
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-left mt-6 sm:mt-8">
            {t.pricing.plans.map((plan, i) => {
              const isUltra = plan.badge === 'Ultra';
              return (
                <div
                  key={i}
                  ref={(el) => observe(el, i * 120)}
                  style={revealStyle}
                  className={`${surfaceClass} border rounded-xl transition-[transform,box-shadow,background] duration-300 hover:scale-[1.02] hover:shadow-lg flex flex-col p-5 sm:p-6 relative ${isDark ? (isUltra ? 'border-white/30' : 'border-white/10') : (isUltra ? 'border-black/30' : 'border-gray-200')} ${i === 2 ? 'sm:col-span-2 md:col-span-1' : ''}`}
                >
                  {isUltra && (
                    <div className={`absolute top-0 right-0 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} text-xs font-medium py-1 px-3 rounded-bl-lg rounded-tr-xl`}>
                      {plan.badge}
                    </div>
                  )}
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                  <p className={`text-sm ${textMuted} mb-6`}>{plan.desc}</p>
                  <div className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                    {plan.price}
                    <span className={`text-base font-normal ${textMuted}`}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-center gap-3 text-sm ${textMuted}`}>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/app?screen=register"
                    className={`w-full py-3 rounded-lg font-medium text-center transition-all duration-200 block ${isDark ? (isUltra ? 'bg-white hover:bg-neutral-200 text-black' : 'border border-white/20 hover:bg-white/5 text-white') : (isUltra ? 'bg-black hover:bg-gray-800 text-white' : 'border border-gray-300 hover:bg-gray-100 text-black')}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className={`px-4 sm:px-6 py-16 sm:py-20 text-center relative border-t transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{t.cta.title}</h2>
            <p className={`text-base sm:text-lg ${textMuted} mb-6 sm:mb-8`}>{t.cta.sub}</p>
            <Link href="/app?screen=register" className={`inline-block font-medium py-3 sm:py-4 px-6 sm:px-8 rounded-lg transition-all duration-300 hover:scale-105 text-base sm:text-lg ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
              {t.cta.cta}
            </Link>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={`w-full py-8 sm:py-12 border-t transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className={`font-bold text-lg sm:text-xl flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-black'}`}>
              <img
                src="/logo.png"
                alt="Zero AI Note Logo"
                className="w-7 h-7 rounded-full object-contain shadow-xs shrink-0"
              />
              <span>Zero AI Note</span>
            </div>
            <div className={`text-sm ${textMuted}`}>{t.footer}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {t.links.map((link, i) => (
              <Link key={i} href="#" className={`text-sm transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}