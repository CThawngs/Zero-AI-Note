'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

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
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-600';
  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100';

  // Why section grid positions (matching screenshot bento layout)
  const whyGridPositions = [
    'col-start-1 col-end-2 row-start-1 row-end-3',   // 0: Multimodal — tall left (2 rows)
    'col-start-2 col-end-3 row-start-1 row-end-2',   // 1: Speed — top center
    'col-start-3 col-end-4 row-start-1 row-end-2',   // 2: Unlimited — top right
    'col-start-2 col-end-4 row-start-2 row-end-3',   // 3: Secure — wide middle right (2 cols)
    'col-start-1 col-end-2 row-start-3 row-end-4',   // 4: Sync — bottom left
    'col-start-2 col-end-3 row-start-3 row-end-4',   // 5: Export — bottom center
    'col-start-3 col-end-4 row-start-3 row-end-4',   // 6: Analytics — bottom right
  ];

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-white selection:text-black transition-colors duration-300 ${bgClass}`}>
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className={`font-bold text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Zero AI Note
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-gray-200'}`}
            >
              {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-black hover:bg-gray-200'}`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <Link href="/docs" className={`text-sm font-medium transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              {t.nav.docs}
            </Link>
            <Link href="/app" className={`text-sm font-medium transition-colors duration-200 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              {t.nav.login}
            </Link>
            <Link href="/app" className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* Hero */}
        <section className="px-6 py-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <div className="text-sm font-medium leading-tight">
                <div>{t.hero.badge}</div>
                <div className={`text-xs ${textMuted}`}>{t.hero.badgeSub}</div>
              </div>
            </div>
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {t.hero.heading}
            </h1>
            <p className={`text-lg leading-relaxed max-w-2xl ${textMuted}`}>
              {t.hero.sub}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/app" className={`font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
                {t.hero.cta}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link href="/docs" className={`border font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:bg-gray-100 text-black'}`}>
                <span className="material-symbols-outlined text-sm">menu_book</span>
                {t.hero.cta2}
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative">
            <div className={`absolute -inset-4 blur-3xl rounded-full opacity-50 ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
            <div className={`border rounded-xl overflow-hidden relative z-10 shadow-2xl ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-gray-200'}`}>
              <img
                alt="Zero AI Note UI"
                className="w-full h-auto block"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo4FbFB7fOmPlv-QU-QIwcpZ6-qIxFmR2VjU964mMA5G0iJEa74T4h3IPTuWodbtMeYWHQ0mpe7ADzs02YOOr8QWIr_l8WfrfqqWk892DbRSubW1GKRH7D97uSkhUGXNMErp1VqUx8FQciET6rwtD_Csv6VRTPfcu1oKLEM5cwePi2wzW_QrRbFqpV0hW_EsF9wL3vLq5HCyagpSknHSL3Gy8ud6Nc6jRWhxXVsnTh12jsxCKKPiDd"
              />
            </div>
            <div className={`absolute -bottom-6 -right-6 backdrop-blur-xl border p-4 rounded-xl z-20 hidden md:block shadow-xl ${isDark ? 'bg-white/10 border-white/20' : 'bg-black/5 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">auto_fix_high</span>
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{t.hero.badge2}</div>
                  <div className={`text-xs ${textMuted}`}>{t.hero.badge3}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why — Bento Grid */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-black'}`}>{t.why.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:grid-rows-[220px_220px_180px]">
            {t.why.items.map((item, i) => {
              const isLargeLeft = i === 0;
              const isWideMid = i === 3;

              return (
                <div
                  key={i}
                  className={`${surfaceClass} border rounded-xl transition-all duration-300 hover:scale-[1.02] hover:border-opacity-50 p-6 flex flex-col ${isDark ? `border-white/10 ${hoverBg}` : `border-gray-200 ${hoverBg}`} ${isLargeLeft ? 'relative overflow-hidden' : ''} hidden md:flex ${whyGridPositions[i]}`}
                  style={isLargeLeft ? { minHeight: '100%' } : undefined}
                >
                  {isLargeLeft && <div className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl transition-colors ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />}
                  <span className="material-symbols-outlined text-4xl mb-4">{item.icon}</span>
                  <div className={isLargeLeft ? 'mt-auto' : ''}>
                    <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
            {/* Mobile fallback — simple stacked cards */}
            {t.why.items.map((item, i) => (
              <div
                key={`mobile-${i}`}
                className={`${surfaceClass} border rounded-xl p-6 flex flex-col md:hidden ${isDark ? `border-white/10` : `border-gray-200`}`}
              >
                <span className="material-symbols-outlined text-4xl mb-4">{item.icon}</span>
                <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</h3>
                <p className={`text-sm leading-relaxed ${textMuted}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How */}
        <section className={`border-y py-16 transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="px-6 max-w-7xl mx-auto text-center">
            <h2 className={`text-3xl font-bold mb-12 ${isDark ? 'text-white' : 'text-black'}`}>{t.how.title}</h2>
            <div className="flex flex-col md:flex-row justify-center items-start gap-8 relative">
              <div className={`hidden md:block absolute top-12 left-[15%] right-[15%] h-px z-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
              {t.how.steps.map((step, i) => (
                <div key={i} className={`flex-1 flex flex-col items-center relative z-10 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                  <div className={`w-24 h-24 rounded-full border flex items-center justify-center mb-6 transition-colors ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
                    <span className="material-symbols-outlined text-4xl">{step.icon}</span>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${textMuted} text-center max-w-xs`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-16 max-w-5xl mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>{t.pricing.title}</h2>
          <Link href="/docs" className={`text-sm font-medium hover:underline mb-12 inline-flex items-center gap-1 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
            {t.pricing.link}
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
            {t.pricing.plans.map((plan, i) => {
              const isUltra = plan.badge === 'Ultra';
              return (
                <div
                  key={i}
                  className={`${surfaceClass} border rounded-xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-6 relative ${isDark ? (isUltra ? 'border-white/30' : 'border-white/10') : (isUltra ? 'border-black/30' : 'border-gray-200')}`}
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
                    href="/app"
                    className={`w-full py-3 rounded-lg font-medium text-center transition-all duration-200 block ${isDark ? (isUltra ? 'bg-white hover:bg-neutral-200 text-black' : 'border border-white/20 hover:bg-white/5 text-white') : (isUltra ? 'bg-black hover:bg-gray-800 text-white' : 'border border-gray-300 hover:bg-gray-100 text-black')}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className={`px-6 py-20 text-center relative border-t transition-colors duration-300 ${isDark ? 'border-white/10 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>{t.cta.title}</h2>
            <p className={`text-lg ${textMuted} mb-8`}>{t.cta.sub}</p>
            <Link href="/app" className={`inline-block font-medium py-4 px-8 rounded-lg transition-all duration-300 hover:scale-105 text-lg ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}>
              {t.cta.cta}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`w-full py-12 border-t transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className={`font-bold text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Zero AI Note
            </div>
            <div className={`text-sm ${textMuted}`}>{t.footer}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
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