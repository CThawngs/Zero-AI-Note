import Link from 'next/link';
import type { Metadata } from 'next';
import { THEME_OPTIONS } from '@/src/utils/themeTokens';

export const metadata: Metadata = {
  title: 'Zero AI Note — Ghi chú AI đa định dạng',
  description: 'AI-Powered Research — Ghi chú AI theo phương pháp học thuật. Cornell, Outline, Q&A, flashcard. Hỗ trợ video, audio, PDF, YouTube.',
};

export default function LandingPage() {
  const theme = THEME_OPTIONS.find(t => t.id === 'gray') || THEME_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-body-md antialiased selection:bg-white selection:text-black">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="font-headline-md text-headline-md font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            Zero AI Note
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-neutral-400 font-label-md text-label-md hover:text-white transition-colors">
              Tài liệu
            </Link>
            <Link href="/app" className="text-neutral-400 font-label-md text-label-md hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link href="/app" className="bg-white hover:bg-neutral-200 text-black font-label-md text-label-md py-2 px-4 rounded-lg transition-all hover:scale-105 duration-200">
              Bắt đầu miễn phí
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="px-6 py-16 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              AI-Powered Research
            </div>
            <h1 className="font-display-lg text-display-lg text-white leading-tight">
              Ghi chú thông minh với AI - <span className="text-white">Take Note hiệu quả hơn bao giờ hết</span>
            </h1>
            <p className="font-body-lg text-body-lg text-neutral-400 max-w-2xl">
              Ứng dụng Note thế hệ mới giúp bạn tối ưu hóa quy trình học tập và làm việc. Chuyển đổi hàng giờ nội dung thành kiến thức có cấu trúc với sự hỗ trợ của AI đa ngôn ngữ.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/app" className="bg-white hover:bg-neutral-200 text-black font-label-md text-label-md py-3 px-6 rounded-lg transition-all hover:scale-105 duration-200 flex items-center gap-2">
                Bắt đầu miễn phí
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link href="/docs" className="border border-white/20 hover:bg-white/5 text-white font-label-md text-label-md py-3 px-6 rounded-lg transition-all hover:scale-105 duration-200 flex items-center gap-2">
                <span className="material-symbols-outlined">menu_book</span>
                Xem tài liệu
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg relative">
            <div className="absolute -inset-4 bg-white/5 blur-3xl rounded-full opacity-50"></div>
            <div className="bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden relative z-10 shadow-2xl border-white/20">
              <img
                alt="Futuristic AI Note-taking UI Mockup"
                className="w-full h-auto block"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo4FbFB7fOmPlv-QU-QIwcpZ6-qIxFmR2VjU964mMA5G0iJEa74T4h3IPTuWodbtMeYWHQ0mpe7ADzs02YOOr8QWIr_l8WfrfqqWk892DbRSubW1GKRH7D97uSkhUGXNMErp1VqUx8FQciET6rwtD_Csv6VRTPfcu1oKLEM5cwePi2wzW_QrRbFqpV0hW_EsF9wL3vLq5HCyagpSknHSL3Gy8ud6Nc6jRWhxXVsnTh12jsxCKKPiDd"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-xl z-20 hidden md:block shadow-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white">auto_fix_high</span>
                <div className="text-left">
                  <div className="text-white font-label-md">AI Analysis</div>
                  <div className="text-neutral-400 text-[12px]">99.9% Accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why different section - Bento Grid */}
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <h2 className="font-headline-lg text-headline-lg text-center mb-12 text-white">Vì sao khác biệt?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)] lg:auto-rows-[220px]">
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-8 rounded-xl flex flex-col justify-between group lg:col-span-2 lg:row-span-2 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 bg-white/5 w-64 h-64 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
              <span className="material-symbols-outlined text-white text-5xl mb-4 relative z-10">mic</span>
              <div className="relative z-10">
                <h3 className="font-headline-lg text-white mb-3">Ghi chú đa phương thức</h3>
                <p className="font-body-lg text-neutral-400 max-w-md">App ghi chú hỗ trợ xử lý mượt mà video, audio và văn bản pha trộn nhiều ngôn ngữ. Mang lại trải nghiệm Take Note liền mạch và toàn diện.</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col justify-between group lg:col-span-1 lg:row-span-1">
              <div><span className="material-symbols-outlined text-white text-3xl mb-4">speed</span></div>
              <div>
                <h3 className="font-headline-md text-[20px] text-white mb-1">Tốc độ vượt trội</h3>
                <p className="font-body-md text-[15px] text-neutral-400">Xử lý bất đồng bộ, nhận thông báo ngay khi note sẵn sàng, không cần ngồi chờ</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col justify-between group lg:col-span-1 lg:row-span-2">
              <span className="material-symbols-outlined text-white text-4xl mb-4">auto_fix_high</span>
              <div className="">
                <h3 className="font-headline-md text-[24px] text-white mb-3">Take Note linh hoạt</h3>
                <p className="font-body-lg text-neutral-400">Không chỉ Cornell hay Mindmap. Chỉ cần mô tả phương pháp bạn muốn, AI sẽ tự động định dạng và tối ưu hóa ghi chú theo đúng phong cách riêng của bạn.</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col justify-between group lg:col-span-1 lg:row-span-1">
              <div><span className="material-symbols-outlined text-white text-3xl mb-4">lock</span></div>
              <div>
                <h3 className="font-headline-md text-[20px] text-white mb-1">Hệ thống Note an toàn</h3>
                <p className="font-body-md text-[15px] text-neutral-400">Chỉ bạn truy cập được dữ liệu của mình qua hệ thống kiểm soát quyền truy cập (RLS) bảo mật</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col sm:flex-row gap-6 items-start sm:items-center group lg:col-span-2 lg:row-span-1">
              <span className="material-symbols-outlined text-white text-4xl bg-white/5 p-3 rounded-lg">sync</span>
              <div>
                <h3 className="font-headline-md text-[22px] text-white mb-2">Đồng bộ hóa Ghi chú</h3>
                <p className="font-body-md text-neutral-400">Truy cập và take note mọi lúc trên mọi thiết bị có trình duyệt web</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col justify-between group lg:col-span-1 lg:row-span-1">
              <div><span className="material-symbols-outlined text-white text-3xl mb-4">view_quilt</span></div>
              <div>
                <h3 className="font-headline-md text-[20px] text-white mb-1">Xuất layout chuẩn</h3>
                <p className="font-body-md text-[15px] text-neutral-400">Giữ nguyên định dạng và bảng biểu.</p>
              </div>
            </div>
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300 p-6 rounded-xl flex flex-col justify-between group lg:col-span-1 lg:row-span-1">
              <div><span className="material-symbols-outlined text-white text-3xl mb-4">analytics</span></div>
              <div>
                <h3 className="font-headline-md text-[20px] text-white mb-1">Phân tích chuyên sâu</h3>
                <p className="font-body-md text-[15px] text-neutral-400">AI trích xuất insights và tạo liên kết logic.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#0a0a0a] border-y border-white/10 py-16">
          <div className="px-6 max-w-7xl mx-auto text-center">
            <h2 className="font-headline-lg text-headline-lg mb-12 text-white">Cách hoạt động</h2>
            <div className="flex flex-col md:flex-row justify-center items-start gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-white/10 z-0"></div>
              <div className="flex-1 flex flex-col items-center relative z-10 bg-[#0a0a0a]">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-[#0f0f0f]">
                  <span className="material-symbols-outlined text-white text-4xl font-light">upload_file</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">1. Tải lên tài liệu ghi chú</h3>
                <p className="font-body-md text-body-md text-neutral-400 text-center max-w-xs">Kéo thả file video, audio, tài liệu hoặc dán link để bắt đầu ghi chú.</p>
              </div>
              <div className="flex-1 flex flex-col items-center relative z-10 bg-[#0a0a0a]">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-[#0f0f0f]">
                  <span className="material-symbols-outlined text-white text-4xl font-light">memory</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">2. AI xử lý và Take Note</h3>
                <p className="font-body-md text-body-md text-neutral-400 text-center max-w-xs">Hệ thống phân tích và tự động take note theo format bạn yêu cầu.</p>
              </div>
              <div className="flex-1 flex flex-col items-center relative z-10 bg-[#0a0a0a]">
                <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mb-6 bg-[#0f0f0f]">
                  <span className="material-symbols-outlined text-white text-4xl font-light">task</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-2 text-white">3. Nhận bản Note hoàn chỉnh</h3>
                <p className="font-body-md text-body-md text-neutral-400 text-center max-w-xs">Tải xuống bản note hoàn chỉnh định dạng DOCX, PDF với cấu trúc rõ ràng.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-16 max-w-5xl mx-auto text-center">
          <h2 className="font-headline-lg text-headline-lg mb-4 text-white">Bắt đầu miễn phí, nâng cấp khi cần</h2>
          <Link href="/docs" className="text-white font-label-md text-label-md hover:underline mb-12 inline-flex items-center gap-1 transition-colors">
            Xem đầy đủ bảng giá
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
            {/* Free */}
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] flex flex-col">
              <h3 className="font-headline-md text-headline-md text-white mb-2">Miễn phí</h3>
              <p className="font-body-md text-body-md text-neutral-400 mb-6">Trải nghiệm cơ bản cho cá nhân.</p>
              <div className="text-3xl font-bold mb-6 text-white">0đ<span className="text-neutral-400 text-base font-normal">/tháng</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>3 giờ xử lý / tháng</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>File tối đa 30 phút</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Xuất PDF cơ bản</li>
              </ul>
              <Link href="/app" className="w-full py-3 rounded-lg border border-white/20 font-label-md hover:bg-white/5 transition-all duration-200 text-white text-center">
                Tạo tài khoản
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0f0f0f] border border-white/10 hover:border-white/30 p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] flex flex-col">
              <h3 className="font-headline-md text-headline-md text-white mb-2">Pro</h3>
              <p className="font-body-md text-body-md text-neutral-400 mb-6">Dành cho nghiên cứu sinh & chuyên gia.</p>
              <div className="text-3xl font-bold mb-6 text-white">99k<span className="text-neutral-400 text-base font-normal">/tháng</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>50 giờ xử lý / tháng</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>File tối đa 2 giờ/phiên</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Mọi định dạng học thuật</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Ưu tiên xử lý</li>
              </ul>
              <Link href="/app" className="w-full py-3 rounded-lg border border-white/20 font-label-md hover:bg-white/5 transition-all duration-200 text-white text-center">
                Nâng cấp Pro
              </Link>
            </div>

            {/* Ultra */}
            <div className="bg-[#0f0f0f] border border-white/30 p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col">
              <div className="absolute top-0 right-0 bg-white text-black font-label-sm py-1 px-3 rounded-bl-lg">Ultra</div>
              <h3 className="font-headline-md text-headline-md text-white mb-2">Ultra</h3>
              <p className="font-body-md text-body-md text-neutral-400 mb-6">Giải pháp tối ưu cho tổ chức.</p>
              <div className="text-3xl font-bold mb-6 text-white">199k<span className="text-neutral-400 text-base font-normal">/tháng</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>200 giờ xử lý/tháng</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>File tối đa 4 giờ/phiên</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Xuất DOCX cao cấp</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Hỗ trợ ưu tiên qua email</li>
                <li className="flex items-center gap-3 text-neutral-400"><span className="material-symbols-outlined text-white font-light">check_circle</span>Phân tích đa file</li>
              </ul>
              <Link href="/app" className="w-full py-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-label-md transition-all duration-200 text-center">
                Nâng cấp Ultra
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20 text-center relative border-t border-white/10 bg-[#0f0f0f]">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display-lg text-display-lg mb-6 text-white">Sẵn sàng thử chưa?</h2>
            <p className="font-body-lg text-neutral-400 mb-8">Trải nghiệm sức mạnh của ghi chú AI chuẩn học thuật ngay hôm nay.</p>
            <Link href="/app" className="bg-white hover:bg-neutral-200 text-black font-label-md text-label-md py-4 px-8 rounded-lg transition-all duration-200 text-lg hover:scale-105 inline-block">
              Tạo tài khoản miễn phí
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-[#0a0a0a] border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 max-w-7xl mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="font-headline-md text-headline-md font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Zero AI Note
            </div>
            <div className="text-neutral-400 font-label-sm text-label-sm">© 2026 Zero AI Note. Mọi quyền được bảo lưu.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="text-neutral-400 hover:text-white hover:underline transition-colors duration-200 font-label-sm text-label-sm">Privacy Policy</Link>
            <Link href="#" className="text-neutral-400 hover:text-white hover:underline transition-colors duration-200 font-label-sm text-label-sm">Terms of Service</Link>
            <Link href="#" className="text-neutral-400 hover:text-white hover:underline transition-colors duration-200 font-label-sm text-label-sm">Twitter</Link>
            <Link href="#" className="text-neutral-400 hover:text-white hover:underline transition-colors duration-200 font-label-sm text-label-sm">LinkedIn</Link>
            <Link href="#" className="text-neutral-400 hover:text-white hover:underline transition-colors duration-200 font-label-sm text-label-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}