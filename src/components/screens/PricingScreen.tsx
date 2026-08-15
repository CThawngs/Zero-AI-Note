import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, 
  X, 
  Sparkles, 
  Crown, 
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
  const { user, upgradeToPro, applyCouponCode, addToast, theme, language, t } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isDark = theme === 'dark';

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
      q: language === 'vi' ? 'Gói Pro hỗ trợ những mô hình AI nào?' : 'Which AI models are supported on Pro?',
      a: language === 'vi' 
        ? 'Gói Pro hỗ trợ các mô hình tân tiến nhất hiện nay gồm Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash, DeepSeek R1 cùng tính năng kết nối API Key riêng (BYOK).' 
        : 'Pro tier gives full access to Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash, DeepSeek R1, plus Bring Your Own Key (BYOK) custom endpoints.'
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

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto w-full items-stretch">
        {/* Basic Plan */}
        <div className="p-6 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-8 relative transition-colors bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('freePlan')}</h3>
              <p className="text-xs mt-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Dành cho cá nhân bắt đầu trải nghiệm ghi chú AI' : 'For individuals discovering structured AI notes'}
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">0đ</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                / {language === 'vi' ? 'vĩnh viễn' : 'lifetime'}
              </span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-4 border-t text-xs border-[var(--border-color)]">
              <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>{language === 'vi' ? 'Tối đa 15 ghi chú trích xuất mỗi tháng' : 'Up to 15 note extractions / month'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>{language === 'vi' ? 'Mẫu Cornell & Outline cơ bản' : 'Basic Cornell & Outline templates'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>{language === 'vi' ? 'Lưu trữ đám mây 500MB' : '500 MB cloud storage'}</span>
              </div>
              <div className="flex items-center gap-2.5 line-through text-[var(--text-muted)]">
                <X className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Tóm tắt bằng âm thanh (AI Voice TTS)' : 'AI Neural Voice TTS summary'}</span>
              </div>
              <div className="flex items-center gap-2.5 line-through text-[var(--text-muted)]">
                <X className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Tích hợp API Key riêng (BYOK)' : 'Custom API Key (BYOK)'}</span>
              </div>
              <div className="flex items-center gap-2.5 line-through text-[var(--text-muted)]">
                <X className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Hỗ trợ mô hình Claude 3.5 & GPT-4o' : 'Claude 3.5 Sonnet & GPT-4o access'}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-current-free-plan"
            disabled={user.plan === 'FREE'}
            className="w-full py-3 rounded-2xl text-xs font-semibold text-center border cursor-not-allowed bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)]"
          >
            {user.plan === 'FREE' ? (language === 'vi' ? 'Gói Đang Sử Dụng' : 'Current Active Plan') : t('freePlan')}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="p-6 sm:p-8 rounded-3xl border-2 border-[var(--accent-primary)] flex flex-col justify-between space-y-8 relative shadow-lg shadow-[var(--accent-primary)]/10 bg-[var(--bg-card)]">
          {/* Popular Tag */}
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-extrabold uppercase tracking-wider shadow-sm">
            {language === 'vi' ? 'PHỔ BIẾN NHẤT' : 'MOST POPULAR'}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('proPlan')}</h3>
              </div>
              <p className="text-xs mt-1 text-[var(--text-secondary)]">
                {language === 'vi' ? 'Toàn bộ sức mạnh trích xuất và lưu trữ không giới hạn' : 'Unlimited extractions, neural TTS, and multi-model power'}
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">199.000đ</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                / {language === 'vi' ? 'tháng' : 'month'}
              </span>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-4 border-t text-xs border-[var(--border-color)]">
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Không giới hạn số lượng ghi chú AI' : 'Unlimited AI note extractions'}</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Mọi mô hình AI (Claude 3.5, GPT-4o, DeepSeek)' : 'All advanced LLMs (Claude 3.5, GPT-4o, DeepSeek)'}</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Giọng đọc tóm tắt AI Voice TTS tự nhiên' : 'AI Neural Voice TTS natural summaries'}</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Dung lượng lưu trữ đám mây 5.0 GB' : '5.0 GB cloud storage'}</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Tùy biến cấu trúc và xuất đa định dạng (DOCX, PDF)' : 'Custom outlines & multi-export (PDF, DOCX)'}</span>
              </div>
              <div className="flex items-center gap-2.5 font-medium text-[var(--text-primary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                <span>{language === 'vi' ? 'Tích hợp Provider riêng (BYOK & Local LLM)' : 'Custom BYOK & local inference support'}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-upgrade-to-pro-action"
            onClick={upgradeToPro}
            className="w-full py-3.5 rounded-2xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-97"
          >
            <span>{user.plan === 'PRO' ? (language === 'vi' ? 'Gia Hạn Gói Pro' : 'Renew Pro Plan') : t('upgradePro')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
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
