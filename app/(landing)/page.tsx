'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { THEME_OPTIONS } from '@/src/utils/themeTokens';

type Language = 'vi' | 'en';
type ThemeMode = 'dark' | 'light';

// === Nội dung đa ngôn ngữ ===
const content = {
  vi: {
    title: 'Zero AI Note — Ghi chú AI đa định dạng',
    desc: 'AI-Powered Research — Ghi chú AI theo phương pháp học thuật. Cornell, Outline, Q&A, flashcard.',
    nav: { docs: 'Tài liệu', login: 'Đăng nhập', cta: 'Bắt đầu miễn phí' },
    hero: {
      badge: 'AI-Powered Research',
      heading: 'Ghi chú thông minh với AI - Ghi chú hiệu quả hơn bao giờ hết',
      sub: 'Ứng dụng Note thế hệ mới giúp bạn tối ưu hóa quy trình học tập và làm việc. Chuyển đổi hàng giờ nội dung thành kiến thức có cấu trúc với sự hỗ trợ của AI đa ngôn ngữ.',
      cta: 'Bắt đầu miễn phí',
      cta2: 'Xem tài liệu',
      badge2: 'AI Analysis',
      badge3: '99.9% Độ chính xác'
    },
    why: {
      title: 'Vì sao khác biệt?',
      items: [
        { icon: 'mic', title: 'Ghi chú đa phương thức', desc: 'App ghi chú hỗ trợ xử lý mượt mà video, audio và văn bản pha trộn nhiều ngôn ngữ. Mang lại trải nghiệm Take Note liền mạch và toàn diện.' },
        { icon: 'speed', title: 'Tốc độ vượt trội', desc: 'Xử lý bất đồng bộ, nhận thông báo ngay khi note sẵn sàng, không cần ngồi chờ' },
        { icon: 'auto_fix_high', title: 'Take Note linh hoạt', desc: 'Không chỉ Cornell hay Mindmap. Chỉ cần mô tả phương pháp bạn muốn, AI sẽ tự động định dạng và tối ưu hóa ghi chú theo đúng phong cách riêng của bạn.' },
        { icon: 'lock', title: 'Hệ thống Note an toàn', desc: 'Chỉ bạn truy cập được dữ liệu của mình qua hệ thống kiểm soát quyền truy cập (RLS) bảo mật' },
        { icon: 'sync', title: 'Đồng bộ hóa Ghi chú', desc: 'Truy cập và take note mọi lúc trên mọi thiết bị có trình duyệt web' },
        { icon: 'view_quilt', title: 'Xuất layout chuẩn', desc: 'Giữ nguyên định dạng và bảng biểu.' },
        { icon: 'analytics', title: 'Phân tích chuyên sâu', desc: 'AI trích xuất insights và tạo liên kết logic.' }
      ]
    },
    how: {
      title: 'Cách hoạt động',
      steps: [
        { icon: 'upload_file', title: '1. Tải lên tài liệu ghi chú', desc: 'Kéo thả file video, audio, tài liệu hoặc dán link để bắt đầu ghi chú.' },
        { icon: 'memory', title: '2. AI xử lý và Take Note', desc: 'Hệ thống phân tích và tự động take note theo format bạn yêu cầu.' },
        { icon: 'task', title: '3. Nhận bản Note hoàn chỉnh', desc: 'Tải xuống bản note hoàn chỉnh định dạng DOCX, PDF với cấu trúc rõ ràng.' }
      ]
    },
    pricing: {
      title: 'Bắt đầu miễn phí, nâng cấp khi cần',
      link: 'Xem đầy đủ bảng giá',
      plans: [
        { name: 'Miễn phí', desc: 'Trải nghiệm cơ bản cho cá nhân.', price: '0đ', period: '/tháng', features: ['3 giờ xử lý / tháng', 'File tối đa 30 phút', 'Xuất PDF cơ bản'], cta: 'Tạo tài khoản' },
        { name: 'Pro', desc: 'Dành cho nghiên cứu sinh & chuyên gia.', price: '99k', period: '/tháng', features: ['50 giờ xử lý / tháng', 'File tối đa 2 giờ/phiên', 'Mọi định dạng học thuật', 'Ưu tiên xử lý'], cta: 'Nâng cấp Pro' },
        { name: 'Ultra', desc: 'Giải pháp tối ưu cho tổ chức.', price: '199k', period: '/tháng', features: ['200 giờ xử lý/tháng', 'File tối đa 4 giờ/phiên', 'Xuất DOCX cao cấp', 'Hỗ trợ ưu tiên qua email', 'Phân tích đa file'], cta: 'Nâng cấp Ultra', badge: 'Ultra' }
      ]
    },
    cta: {
      title: 'Sẵn sàng thử chưa?',
      sub: 'Trải nghiệm sức mạnh của ghi chú AI chuẩn học thuật ngay hôm nay.',
      cta: 'Tạo tài kho���n miễn phí'
    },
    footer: '© 2026 Zero AI Note. Mọi quyền được bảo lưu.',
    links: ['Privacy Policy', 'Terms of Service', 'Twitter', 'LinkedIn', 'Contact']
  },
  en: {
    title: 'Zero AI Note — AI-Powered Note Taking',
    desc: 'AI-Powered Research — Academic note-taking with Cornell, Outline, Q&A, flashcards.',
    nav: { docs: 'Docs', login: 'Login', cta: 'Get started free' },
    hero: {
      badge: 'AI-Powered Research',
      heading: 'AI-powered note taking — Take Note more effectively than ever',
      sub: 'A next-generation Note app that optimizes your study and work workflows. Transform hours of content into structured knowledge with multilingual AI support.',
      cta: 'Get started free',
      cta2: 'View docs',
      badge2: 'AI Analysis',
      badge3: '99.9% Accuracy'
    },
    why: {
      title: 'Why different?',
      items: [
        { icon: 'mic', title: 'Multimodal Note Taking', desc: 'Seamlessly process video, audio, and mixed-language text. A comprehensive Take Note experience.' },
        { icon: 'speed', title: 'Speed & Async', desc: 'Async processing with instant notification when your note is ready — no waiting around.' },
        { icon: 'auto_fix_high', title: 'Flexible Note Taking', desc: 'Not just Cornell or Mindmap. Describe your desired method, and AI auto-formats to your unique style.' },
        { icon: 'lock', title: 'Secure Note System', desc: 'Only you can access your data via RLS (Row-Level Security) — your notes stay private.' },
        { icon: 'sync', title: 'Sync Notes', desc: 'Access and take notes anywhere, on any device with a web browser.' },
        { icon: 'view_quilt', title: 'Layout Export', desc: 'Preserve formatting and tables on export.' },
        { icon: 'analytics', title: 'Deep Insights', desc: 'AI extracts insights and builds logical connections.' }
      ]
    },
    how: {
      title: 'How it works',
      steps: [
        { icon: 'upload_file', title: '1. Upload your note material', desc: 'Drag & drop video, audio, PDF, or paste a link to start note taking.' },
        { icon: 'memory', title: '2. AI processes & takes notes', desc: 'System analyzes and automatically takes notes in your requested format.' },
        { icon: 'task', title: '3. Get your complete Note', desc: 'Download your final note as DOCX, PDF with clear structure.' }
      ]
    },
    pricing: {
      title: 'Start free, upgrade when you need',
      link: 'View full pricing',
      plans: [
        { name: 'Free', desc: 'Basic experience for individuals.', price: '0đ', period: '/month', features: ['3 hours processing / month', 'Max file 30 min', 'Basic PDF export'], cta: 'Create account' },
        { name: 'Pro', desc: 'For researchers & professionals.', price: '99k', period: '/month', features: ['50 hours processing / month', 'Max file 2 hours/session', 'All academic formats', 'Priority processing'], cta: 'Upgrade to Pro' },
        { name: 'Ultra', desc: 'Best for organizations.', price: '199k', period: '/month', features: ['200 hours processing/month', 'Max file 4 hours/session', 'Advanced DOCX export', 'Priority email support', 'Multi-file analysis'], cta: 'Upgrade to Ultra', badge: 'Ultra' }
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

export default function LandingPage() {
  const [lang, setLang] = useState<Language>('vi');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);

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
  }, [lang]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('zero-note-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  const t = content[lang];
  const isDark = theme === 'dark';

  if (!mounted) return null;

  const bgClass = isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black';
  const surfaceClass = isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-600';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';

  return (
    <div className={`min-h-screen font-body-md antialiased selection:bg-white selection:text-black transition-colors duration-300 ${bgClass}`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="font-headline-md text-headline-md font-bold flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Zero AI Note
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className={`text-sm font-label-md px-3 py-1 rounded-lg transition-all duration-300 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-gray-200'}`}
            >
              {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`text-sm font-label-md px-3 py-1 rounded-lg transition-all duration-300 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-gray-200'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link href="/docs" className={`text-sm font-label-md transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              {t.nav.docs}
            </Link>
            <Link href="/app" className={`text-sm font-label-md transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              {t.nav.login}
            </Link>
            <Link href="/app" className={`px-4 py-2 rounded-lg font-label-md transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* Hero */}
        <section className={`px-6 py-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 transition-all duration-300`}>
          <div className="flex-1 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-black'}`}>
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              {t.hero.badge}
            </div>
            <h1 className={`font-display-lg text-display-lg leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {t.hero.heading}
            </h1>
            <p className={`font-body-lg text-body-lg ${textMuted} max-w-2xl`}>
              {t.hero.sub}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/app" className={`font-label-md text-label-md py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
                {t.hero.cta}
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/docs" className={`border font-label-md text-label-md py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:bg-gray-100 text-black'}`}>
                <span className="material-symbols-outlined">menu_book</span>
                {t.hero.cta2}
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative">
            <div className={`absolute -inset-4 blur-3xl rounded-full opacity-50 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}></div>
            <div className={`border rounded-xl overflow-hidden relative z-10 shadow-2xl ${isDark ? 'bg-[#0f0f0f] border-white/10 border-white/20' : 'bg-white border-gray-200'}`}>
              <img alt="Zero AI Note UI" className="w-full h-auto block" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo4FbFB7fOmPlv-QU-QIwcpZ6-qIxFmR2VjU964mMA5G0iJEa74T4h3IPTuWodbtMeYWHQ0mpe7ADzs02YOOr8QWIr_l8WfrfqqWk892DbRSubW1GKRH7D97uSkhUGXNMErp1VqUx8FQciET6rwtD_Csv6VRTPfcu1oKLEM5cwePi2wzW_QrRbFqpV0hW_EsF9wL3vLq5HCyagpSknHSL3Gy8ud6Nc6jRWhxXVsnTh12jsxCKKPiDd" />
            </div>
            <div className={`absolute -bottom-6 -right-6 backdrop-blur-xl border p-4 rounded-xl z-20 hidden md:block shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">auto_fix_high</span>
                <div className="text-left">
                  <div className={isDark ? 'text-white' : 'text-black'}>{t.hero.badge2}</div>
                  <div className={`text-[12px] ${textMuted}`}>{t.hero.badge3}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why */}
        <section className={`px-6 py-16 max-w-7xl mx-auto transition-all duration-300`}>
          <h2 className={`font-headline-lg text-headline-lg text-center mb-12 ${isDark ? 'text-white' : 'text-black'}`}>{t.why.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)] lg:auto-rows-[220px]">
            {t.why.items.map((item, i) => {
              const isLarge = i === 0 || i === 2;
              const colSpan = isLarge ? 'lg:col-span-2' : 'lg:col-span-1';
              const rowSpan = i === 0 ? 'lg:row-span-2' : (i === 2 ? 'lg:row-span-2' : 'lg:row-span-1');
              return (
                <div key={i} className={`${surfaceClass} border rounded-xl transition-all duration-300 hover:scale-[1.02] hover:border-opacity-50 p-6 flex flex-col ${isDark ? `border-white/10 ${hoverBg}` : `border-gray-200 ${hoverBg}`} ${colSpan} ${rowSpan} ${i === 0 ? 'relative overflow-hidden' : ''}`}>
                  {i === 0 && <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl transition-colors ${isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10'}`}></div>}
                  <span className="material-symbols-outlined text-4xl mb-4">{item.icon}</span>
                  <div>
                    <h3 className={`font-headline-md text-[20px] mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`font-body-md text-[15px] ${textMuted}`}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How */}
        <section className={`border-y py-16 transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="px-6 max-w-7xl mx-auto text-center">
            <h2 className={`font-headline-lg text-headline-lg mb-12 ${isDark ? 'text-white' : 'text-black'}`}>{t.how.title}</h2>
            <div className="flex flex-col md:flex-row justify-center items-start gap-8 relative">
              <div className={`hidden md:block absolute top-12 left-[15%] right-[15%] h-px z-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
              {t.how.steps.map((step, i) => (
                <div key={i} className={`flex-1 flex flex-col items-center relative z-10 transition-all duration-300 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                  <div className={`w-24 h-24 rounded-full border flex items-center justify-center mb-6 transition-colors ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="material-symbols-outlined text-4xl font-light">{step.icon}</span>
                  </div>
                  <h3 className={`font-headline-md text-headline-md mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{step.title}</h3>
                  <p className={`font-body-md text-body-md ${textMuted} text-center max-w-xs`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={`px-6 py-16 max-w-5xl mx-auto text-center transition-all duration-300`}>
          <h2 className={`font-headline-lg text-headline-lg mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.pricing.title}</h2>
          <Link href="/docs" className={`font-label-md text-label-md hover:underline mb-12 inline-flex items-center gap-1 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
            {t.pricing.link}
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
            {t.pricing.plans.map((plan, i) => {
              const isUltra = plan.badge === 'Ultra';
              const isFree = plan.name === 'Miễn phí' || plan.name === 'Free';
              return (
                <div key={i} className={`${surfaceClass} border rounded-xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-6 ${isDark ? (isUltra ? 'border-white/30' : 'border-white/10') : (isUltra ? 'border-black/30' : 'border-gray-200')} ${isDark ? '' : ''}`}>
                  {isUltra && <div className={`absolute top-0 right-0 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} font-label-sm py-1 px-3 rounded-bl-lg`}>{plan.badge}</div>}
                  <h3 className={`font-headline-md text-headline-md mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                  <p className={`font-body-md text-body-md ${textMuted} mb-6`}>{plan.desc}</p>
                  <div className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{plan.price}<span className={`text-base font-normal ${textMuted}`}>{plan.period}</span></div>
                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-center gap-3 ${textMuted}`}>
                        <span className="material-symbols-outlined font-light">check_circle</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/app" className={`w-full py-3 rounded-lg font-label-md text-center transition-all duration-200 ${isDark ? (isUltra ? 'bg-white hover:bg-neutral-200 text-black' : 'border border-white/20 hover:bg-white/5 text-white') : (isUltra ? 'bg-black hover:bg-gray-800 text-white' : 'border border-gray-300 hover:bg-gray-100 text-black')}`}>
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className={`px-6 py-20 text-center relative border-t transition-all duration-300 ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className={`font-display-lg text-display-lg mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{t.cta.title}</h2>
            <p className={`font-body-lg ${textMuted} mb-8`}>{t.cta.sub}</p>
            <Link href="/app" className={`inline-block font-label-md text-label-md py-4 px-8 rounded-lg transition-all duration-300 hover:scale-105 text-lg ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
              {t.cta.cta}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`w-full py-12 border-t transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className={`font-headline-md text-headline-md font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Zero AI Note
            </div>
            <div className={`font-label-sm text-label-sm ${textMuted}`}>{t.footer}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {t.links.map((link, i) => (
              <Link key={i} href="#" className={`font-label-sm text-label-sm transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}