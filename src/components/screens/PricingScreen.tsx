import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  X, 
  Sparkles, 
  Crown, 
  Rocket,
  ArrowRight, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PricingScreen: React.FC = () => {
  const { user, upgradeToPro, upgradeToUltra, applyCouponCode, addToast, theme, language, t } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isDark = theme === 'dark';

  const plans = [
    {
      id: 'FREE',
      name: language === 'vi' ? 'Free' : 'Free',
      desc: language === 'vi' ? 'Bắt đầu trải nghiệm ghi chú AI' : 'Start exploring AI notes',
      price: '0đ',
      period: language === 'vi' ? 'vĩnh viễn' : 'lifetime',
      features: [
        { text: language === 'vi' ? '2 giờ xử lý mỗi tháng' : '2 hours processing / month', included: true },
        { text: language === 'vi' ? '15 ghi chú trích xuất / tháng' : '15 note extractions / month', included: true },
        { text: language === 'vi' ? 'Mẫu Cornell, Outline, Tóm tắt nhanh' : 'Cornell, Outline, Quick Summary templates', included: true },
        { text: language === 'vi' ? 'Xuất file Markdown' : 'Markdown export', included: true },
        { text: language === 'vi' ? 'Lưu trữ đám mây 500MB' : '500 MB cloud storage', included: true },
        { text: language === 'vi' ? 'Thư viện không giới hạn' : 'Unlimited library', included: true },
        { text: language === 'vi' ? 'Chat tiếp theo nguồn' : 'Chat with your sources', included: true },
        { text: language === 'vi' ? 'Tóm tắt bằng âm thanh (TTS)' : 'AI Voice TTS summary', included: false },
        { text: language === 'vi' ? 'Tích hợp API Key riêng (BYOK)' : 'Custom API Key (BYOK)', included: false },
        { text: language === 'vi' ? 'Mô hình cao cấp (Claude, GPT-4o)' : 'Premium models (Claude, GPT-4o)', included: false },
      ]
    },
    {
      id: 'PRO',
      name: language === 'vi' ? 'Pro' : 'Pro',
      desc: language === 'vi' ? 'Toàn bộ sức mạnh cho người dùng hằng ngày' : 'Full power for daily users',
      price: '99.000đ',
      period: language === 'vi' ? 'tháng' : 'month',
      popular: true,
      features: [
        { text: language === 'vi' ? '20 giờ xử lý mỗi tháng' : '20 hours processing / month', included: true },
        { text: language === 'vi' ? '200 ghi chú trích xuất / tháng' : '200 note extractions / month', included: true },
        { text: language === 'vi' ? 'Mọi template: Q&A, Flashcard' : 'All templates: Q&A, Flashcard', included: true },
        { text: language === 'vi' ? 'Xuất file DOCX & PDF' : 'DOCX & PDF export', included: true },
        { text: language === 'vi' ? 'Lưu trữ đám mây 5GB' : '5 GB cloud storage', included: true },
        { text: language === 'vi' ? 'File dài tối đa 4 giờ' : 'Files up to 4 hours', included: true },
        { text: language === 'vi' ? 'Tóm tắt bằng âm thanh (TTS)' : 'AI Voice TTS summary', included: true },
        { text: language === 'vi' ? 'Tích hợp API Key riêng (BYOK)' : 'Custom API Key (BYOK)', included: true },
        { text: language === 'vi' ? 'Mô hình cao cấp (Claude, GPT-4o)' : 'Premium models (Claude, GPT-4o)', included: true },
      ]
    },
    {
      id: 'ULTRA',
      name: language === 'vi' ? 'Ultra' : 'Ultra',
      desc: language === 'vi' ? 'Cho chuyên gia, nhóm và xử lý nặng' : 'For pros, teams & heavy workloads',
      price: '199.000đ',
      period: language === 'vi' ? 'tháng' : 'month',
      features: [
        { text: language === 'vi' ? '100 giờ xử lý mỗi tháng' : '100 hours processing / month', included: true },
        { text: language === 'vi' ? 'Không giới hạn ghi chú' : 'Unlimited note extractions', included: true },
        { text: language === 'vi' ? 'Auto mode + Custom template' : 'Auto mode + Custom templates', included: true },
        { text: language === 'vi' ? 'Xuất mọi định dạng: HTML, DOCX, PDF' : 'All exports: HTML, DOCX, PDF', included: true },
        { text: language === 'vi' ? 'Lưu trữ đám mây 50GB' : '50 GB cloud storage', included: true },
        { text: language === 'vi' ? 'File dài 12 giờ+ (ưu tiên hàng đợi)' : '12h+ files (priority queue)', included: true },
        { text: language === 'vi' ? 'Mind map & biểu đồ trực quan' : 'Mind maps & visual diagrams', included: true },
        { text: language === 'vi' ? 'Tóm tắt bằng âm thanh (TTS)' : 'AI Voice TTS summary', included: true },
        { text: language === 'vi' ? 'Tích hợp API Key riêng (BYOK)' : 'Custom API Key (BYOK)', included: true },
        { text: language === 'vi' ? 'Ưu tiên tốc độ xử lý' : 'Priority processing speed', included: true },
      ]
    }
  ];

  const faqs = [
    {
      q: language === 'vi' ? 'Tôi có thể hủy gói Pro bất cứ lúc nào không?' : 'Can I cancel the Pro subscription anytime?',
      a: language === 'vi' 
        ? 'Hoàn toàn có thể. Bạn có thể hủy gia hạn trong phần Cài đặt Tài khoản bất cứ lúc nào mà không phát sinh thêm chi phí nào.' 
        : 'Yes, absolutely. You can cancel your subscription renewal directly in Settings without any hidden fees.'
    },
    {
      q: language === 'vi' ? 'Tính năng Tóm tắt Audio (TTS) hoạt động như thế nào?' : 'How does AI Audio TTS summary work?',
      a: language === 'vi' 
        ? 'Zero AI Note sử dụng giọng đọc AI tự nhiên cao cấp để chuyển toàn bộ dàn ý và từ khóa ghi chú thành file âm thanh tóm tắt 3-5 phút, giúp bạn nghe ôn tập khi di chuyển.' 
        : 'Zero AI Note uses state-of-the-art neural voice models to convert structured outlines and key definitions into 3-5 min audio recaps.'
    },
    {
      q: language === 'vi' ? 'Gói Pro và Ultra khác nhau như thế nào?' : 'How are Pro and Ultra different?',
      a: language === 'vi' 
        ? 'Pro phù hợp người dùng hằng ngày: 20 giờ xử lý/tháng, xuất DOCX/PDF, BYOK. Ultra dành cho chuyên gia/nhóm: 100 giờ, không giới hạn ghi chú, file 12h+, mind map, ưu tiên hàng đợi — gấp 5 lần tài nguyên với giá chỉ hơn 2 lần.' 
        : 'Pro fits daily users: 20h/month, DOCX/PDF export, BYOK. Ultra is for pros/teams: 100h, unlimited notes, 12h+ files, mind maps, priority queue — 5x resources at just 2x the price.'
    },
    {
      q: language === 'vi' ? 'Dữ liệu và ghi chú của tôi có được bảo mật không?' : 'Is my document and note data protected?',
      a: language === 'vi' 
        ? 'Chúng tôi cam kết không sử dụng dữ liệu ghi chép hoặc tài liệu của bạn để huấn luyện lại các mô hình AI công cộng.' 
        : 'We adhere to strict zero-retention policies; your documents and generated notes are never used for public model training.'
    }
  ];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || isApplying) return;

    setIsApplying(true);
    const res = await applyCouponCode(couponCode);
    setIsApplying(false);

    if (res.success) {
      addToast(language === 'vi' ? 'Áp dụng mã thành công' : 'Coupon Applied', res.message, 'success');
      setCouponCode('');
    } else {
      addToast(language === 'vi' ? 'Mã không hợp lệ' : 'Invalid coupon', res.message, 'error');
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'FREE') return;
    if (planId === 'PRO') upgradeToPro();
    if (planId === 'ULTRA') upgradeToUltra();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-10 space-y-10 sm:space-y-12 transition-colors duration-250 bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Mở rộng năng lực nghiên cứu của bạn' : 'Empower Your Research Potential'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {t('pricingTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {language === 'vi' 
            ? 'Chọn gói cước phù hợp với nhu cầu nghiên cứu, học tập và làm việc cùng AI' 
            : 'Select the optimal plan to scale your structured learning and AI extraction'}
        </p>
      </div>

      {/* Pricing Cards — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-6 max-w-5xl mx-auto w-full items-stretch">
        {plans.map((plan) => {
          const isCurrent = user.plan === plan.id;
          const isPopular = plan.id === 'PRO';
          const Icon = plan.id === 'ULTRA' ? Rocket : plan.id === 'PRO' ? Crown : Sparkles;
          return (
            <div
              key={plan.id}
              className={`p-6 sm:p-7 rounded-3xl border flex flex-col justify-between space-y-7 relative transition-colors bg-[var(--bg-card)] ${
                isPopular 
                  ? 'border-2 border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10' 
                  : 'border-[var(--border-color)] shadow-sm'
              }`}
            >
              {/* Popular Tag */}
              {isPopular && (
                <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-extrabold uppercase tracking-wider shadow-sm">
                  {language === 'vi' ? 'PHỔ BIẾN NHẤT' : 'MOST POPULAR'}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isPopular ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
                  </div>
                  <p className="text-xs mt-1 text-[var(--text-secondary)]">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    / {plan.period}
                  </span>
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 pt-4 border-t text-xs border-[var(--border-color)]">
                  {plan.features.map((f, idx) => (
                    <div key={idx} className={`flex items-center gap-2.5 ${f.included ? 'text-[var(--text-primary)]' : 'line-through text-[var(--text-muted)]'}`}>
                      {f.included 
                        ? <Check className={`w-4 h-4 shrink-0 ${isPopular ? 'text-[var(--accent-primary)]' : 'text-[var(--status-success)]'}`} />
                        : <X className="w-4 h-4 shrink-0" />}
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                id={`btn-plan-${plan.id.toLowerCase()}`}
                disabled={isCurrent || plan.id === 'FREE'}
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 rounded-2xl text-xs font-semibold text-center border transition-all cursor-pointer active:scale-97 ${
                  isCurrent
                    ? 'bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                    : isPopular
                      ? 'bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] shadow-md shadow-[var(--accent-primary)]/25'
                      : plan.id === 'FREE'
                        ? 'bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                        : 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              >
                {isCurrent 
                  ? (language === 'vi' ? 'Gói Đang Sử Dụng' : 'Current Plan') 
                  : plan.id === 'FREE'
                    ? (language === 'vi' ? 'Gói Miễn Phí' : 'Free Plan')
                    : plan.id === 'PRO'
                      ? (user.plan === 'ultra' ? (language === 'vi' ? 'Chuyển xuống Pro' : 'Downgrade to Pro') : (language === 'vi' ? 'Nâng cấp Pro' : 'Upgrade to Pro'))
                      : (language === 'vi' ? 'Nâng cấp Ultra' : 'Upgrade to Ultra')}
                {!isCurrent && plan.id !== 'FREE' && <ArrowRight className="w-4 h-4 inline ml-1" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Coupon promo bar */}
      <div className="max-w-xl mx-auto w-full p-4 rounded-2xl border text-center space-y-3 bg-[var(--bg-card)] border-[var(--border-color)] shadow-2xs">
        <p className="text-xs font-semibold text-[var(--text-primary)]">
          {language === 'vi' ? 'Bạn có mã giảm giá sự kiện hoặc học sinh / sinh viên?' : 'Have a student or seasonal promo coupon?'}
        </p>
        <form onSubmit={handleApplyCoupon} className="flex gap-2 max-w-sm mx-auto">
          <input
            id="input-pricing-coupon"
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder={language === 'vi' ? 'Nhập mã coupon (VD: PRO50)' : 'Enter promo code (e.g. PRO50)'}
            className="flex-1 border rounded-xl px-3 py-2 text-xs uppercase font-mono focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={!couponCode.trim() || isApplying}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 active:scale-95 text-[var(--accent-text)] text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            {isApplying && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{t('apply')}</span>
          </button>
        </form>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-2xl mx-auto w-full space-y-4 pt-4">
        <h3 className="text-base font-bold text-center text-[var(--text-primary)]">
          {language === 'vi' ? 'Câu Hỏi Thường Gặp' : 'Frequently Asked Questions'}
        </h3>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border overflow-hidden transition-colors bg-[var(--bg-card)] border-[var(--border-color)] shadow-2xs"
              >
                <button
                  id={`faq-toggle-${idx}`}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold cursor-pointer active:scale-99 transition-all text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--accent-primary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs leading-relaxed border-t pt-2.5 border-[var(--border-color)] text-[var(--text-secondary)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
