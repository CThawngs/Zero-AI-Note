import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Loader2,
  FileCheck,
  Tag,
  CheckCircle2,
  Clock,
  Layers,
  Infinity as InfinityIcon,
  Flame,
  FileText,
  CreditCard,
  QrCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentQrModal } from '../modals/PaymentQrModal';

export const PricingScreen: React.FC = () => {
  const { user, setUser, applyCouponCode, addToast, addNotification, theme, language, t } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    discountPercent?: number; 
    baseAmount?: number; 
    finalAmount?: number 
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<string | null>(null);
  const [billData, setBillData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const isDark = theme === 'dark';

  const plans = [
    {
      id: 'free',
      name: language === 'vi' ? 'Gói Miễn Phí' : 'Free Plan',
      desc: language === 'vi' ? 'Khám phá & trải nghiệm ghi chú học thuật chuẩn AI' : 'Start exploring academic AI notes',
      price: '0đ',
      rawPrice: 0,
      period: language === 'vi' ? 'vĩnh viễn' : 'lifetime',
      badge: language === 'vi' ? 'Cơ Bản' : 'Free Tier',
      icon: <FileText className="w-5 h-5 text-[var(--text-secondary)]" />,
      features: [
        { text: language === 'vi' ? 'Lưu trữ tối đa 20 Notes' : 'Up to 20 Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? '3 templates cơ bản (Cornell, Outline, Tóm tắt)' : '3 foundational templates (Cornell, Outline, Summary)', included: true },
        { text: language === 'vi' ? 'Tối đa 5 Custom Templates' : 'Up to 5 Custom Templates', highlight: true, included: true },
        { text: language === 'vi' ? 'Xem trước Raw / Markdown' : 'Raw / Markdown preview', included: true },
        { text: language === 'vi' ? 'Xuất 3 định dạng cơ bản (.pdf, .docx, .md)' : 'Export 3 basic formats (.pdf, .docx, .md)', included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tĩnh & Tương tác' : 'Static & Interactive HTML preview', included: false },
        { text: language === 'vi' ? 'Checkbox Multi-Export / Nén ZIP' : 'Checkbox Multi-Export / ZIP bundle', included: false },
      ]
    },
    {
      id: 'pro',
      name: language === 'vi' ? 'Gói Pro' : 'Pro Plan',
      desc: language === 'vi' ? 'Dành cho sinh viên, giảng viên & người làm việc hằng ngày' : 'For students, teachers & daily researchers',
      price: '99.000đ',
      rawPrice: 99000,
      period: language === 'vi' ? 'tháng (~$4)' : 'month (~$4)',
      popular: true,
      badge: language === 'vi' ? 'Phổ Biến Nhất' : 'Most Popular',
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
      features: [
        { text: language === 'vi' ? 'Lưu trữ tối đa 50 Notes' : 'Up to 50 Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? '9 templates (Kế thừa Free + Họp, Bài giảng, Q&A, Phân tích, Charting, Boxing)' : '9 templates (Free + Meeting, Lecture, Q&A, Analysis, Charting, Boxing)', included: true },
        { text: language === 'vi' ? 'Tối đa 25 Custom Templates' : 'Up to 25 Custom Templates', highlight: true, included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tĩnh chuẩn CSS styling' : 'Static HTML Preview with CSS styling', highlight: true, included: true },
        { text: language === 'vi' ? 'Xuất 4 định dạng (PDF, DOCX, MD, Webpage HTML)' : 'Export 4 formats (PDF, DOCX, MD, Webpage HTML)', included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tương tác Động (JS)' : 'Interactive Dynamic HTML Preview (JS)', included: false },
        { text: language === 'vi' ? 'Checkbox Multi-Export / Nén ZIP' : 'Checkbox Multi-Export / ZIP bundle', included: false },
      ]
    },
    {
      id: 'ultra',
      name: language === 'vi' ? 'Gói Ultra' : 'Ultra Plan',
      desc: language === 'vi' ? 'Chuyên gia nghiên cứu, đề án chuyên ngành & khối lượng lớn' : 'For master researchers, thesis projects & heavy workloads',
      price: '199.000đ',
      rawPrice: 199000,
      period: language === 'vi' ? 'tháng (~$8)' : 'month (~$8)',
      ultra: true,
      badge: language === 'vi' ? 'Tối Thượng' : 'All Access',
      icon: <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />,
      features: [
        { text: language === 'vi' ? 'KHÔNG GIỚI HẠN số lượng Note' : 'UNLIMITED Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? 'Trọn bộ 17 templates (Feynman, First Principles, Mindmap, Flashcard, Syntopical, 5W1H, All-in-One)' : 'Full 17 templates (Feynman, First Principles, Mindmap, Flashcard, Syntopical, 5W1H, All-in-One)', included: true },
        { text: language === 'vi' ? 'KHÔNG GIỚI HẠN Custom Templates' : 'UNLIMITED Custom Templates', highlight: true, included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tương tác Động (JS, chart hover, animation)' : 'Interactive Dynamic HTML Preview (JS, chart hover, animation)', highlight: true, included: true },
        { text: language === 'vi' ? 'Single-file Interactive HTML độc lập 100% offline' : 'Single-file Interactive HTML 100% offline', included: true },
        { text: language === 'vi' ? 'Checkbox Multi-Export & Đóng gói 1 file .ZIP duy nhất' : 'Checkbox Multi-Export & Single .ZIP bundle', highlight: true, included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Ưu tiên tốc độ xử lý & hỗ trợ kỹ thuật 24/7' : 'Priority processing speed & 24/7 support', included: true },
      ]
    }
  ];

  const faqs = [
    {
      q: language === 'vi' ? 'Hạn mức lưu trữ Note & Custom Template được tính như thế nào?' : 'How is note and template quota calculated?',
      a: language === 'vi' 
        ? 'Gói Free lưu tối đa 20 Notes và tạo tối đa 5 Custom Templates; Gói Pro lưu tối đa 50 Notes và tạo tối đa 25 Custom Templates; Gói Ultra hoàn toàn không giới hạn. Bạn luôn có thể chuyển các Note cũ vào mục Lưu trữ 30 ngày để tái sử dụng dung lượng.' 
        : 'Free plan provides up to 20 notes & 5 custom templates; Pro provides 50 notes & 25 custom templates; Ultra has unlimited notes and templates.'
    },
    {
      q: language === 'vi' ? 'Tính năng Checkbox Multi-Export & Single .ZIP của Ultra hoạt động ra sao?' : 'How does Ultra Multi-Export & Single .ZIP work?',
      a: language === 'vi' 
        ? 'Độc quyền Ultra: Hộp thoại xuất file cho phép bạn tick chọn đồng thời bất kỳ định dạng nào (PDF, Word, Markdown, Interactive HTML) để tải song song hoặc đóng gói tự động vào 1 file .ZIP duy nhất chỉ với 1 click.' 
        : 'Exclusive to Ultra: Select any format combinations (PDF, Word, Markdown, Interactive HTML) to download simultaneously or packaged into a single .ZIP bundle in one click.'
    },
    {
      q: language === 'vi' ? 'Tôi có bị giới hạn giờ xử lý AI hay độ dài video/audio không?' : 'Is there an AI processing time limit?',
      a: language === 'vi' 
        ? 'Hệ thống không giới hạn thời lượng trên lý thuyết cho cả 3 gói qua Gemini Key dùng chung hoặc chế độ Tự kết nối AI cá nhân (BYOK API Key).' 
        : 'No time limits for all 3 tiers. The system uses a shared Gemini Key pool or your own connected BYOK API Key.'
    },
    {
      q: language === 'vi' ? 'Hệ thống thanh toán hoạt động như thế nào?' : 'How does the payment system work?',
      a: language === 'vi' 
        ? 'Thanh toán trực tiếp qua cổng ZeroInvoice (VietQR tự động). Sau khi chuyển khoản đúng cú pháp, hệ thống sẽ tự động xác nhận và nâng cấp tài khoản của bạn sau vài giây mà không cần bấm xác nhận.' 
        : 'Payments are processed via ZeroInvoice VietQR gateway. Plan upgrades activate automatically within seconds after transferring with no manual confirmation needed.'
    }
  ];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || isApplying) return;

    setIsApplying(true);
    const res = await applyCouponCode(couponCode);
    setIsApplying(false);

    if (res.success) {
      setAppliedCoupon({ 
        code: couponCode.trim().toUpperCase(),
        discountPercent: res.discountPercent,
        baseAmount: res.baseAmount,
        finalAmount: res.finalAmount
      });
      addNotification(
        language === 'vi' ? 'Kích hoạt mã thành công' : 'Coupon activated',
        res.message,
        'success'
      );
    } else {
      addNotification(
        language === 'vi' ? 'Mã giảm giá không hợp lệ' : 'Invalid coupon',
        res.message,
        'error'
      );
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    addToast(language === 'vi' ? 'Đã gỡ mã giảm giá' : 'Coupon removed', '', 'info');
  };

  const handleCheckout = async (planId: 'pro' | 'ultra') => {
    try {
      setIsCreatingInvoice(planId);
      const res = await fetch('/api/billing/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          couponCode: appliedCoupon?.code || couponCode.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment invoice');
      }

      const data = await res.json();
      setBillData(data);
      if (data.autoActivated) {
        setIsPaymentModalOpen(false);
        setUser(prev => ({ ...prev, plan: planId }));
        addNotification(
          language === 'vi' ? 'Kích hoạt gói thành công (0đ)' : 'Plan activated (0đ)',
          language === 'vi' ? `Đã áp dụng coupon ${data.coupon?.code || ''} và nâng cấp ${planId.toUpperCase()}.` : `Coupon ${data.coupon?.code || ''} applied, ${planId.toUpperCase()} activated.`,
          'success'
        );
        addToast(
          language === 'vi' ? 'Nâng cấp thành công!' : 'Upgrade Successful!',
          language === 'vi' ? `Tài khoản của bạn đã được nâng cấp lên gói ${planId.toUpperCase()}.` : `Account upgraded to ${planId.toUpperCase()}.`,
          'success'
        );
      } else {
        setIsPaymentModalOpen(true);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      addToast(
        language === 'vi' ? 'Lỗi tạo hóa đơn' : 'Invoice Error',
        err instanceof Error ? err.message : 'Could not initiate payment',
        'error'
      );
    } finally {
      setIsCreatingInvoice(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-10 transition-colors duration-250 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto w-full space-y-10 sm:space-y-12 pb-16">
        
        {/* Top Banner & Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-bold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Bảng Giá Minh Bạch • Tự Động Kích Hoạt VietQR' : 'Transparent Pricing • Automatic VietQR Activation'}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)]"
          >
            {language === 'vi' ? 'Nâng tầm ghi chú học thuật cùng AI' : 'Elevate Your Research With AI Notes'}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto"
          >
            {language === 'vi' 
              ? 'Chọn gói dịch vụ phù hợp với nhu cầu học tập và nghiên cứu của bạn. Hệ thống tự động kích hoạt ngay sau khi quét mã VietQR.' 
              : 'Choose the ideal plan for your learning workflow. Instant automatic activation via VietQR transfer.'}
          </motion.p>
        </div>

        {/* Coupon Promo Box — Enhanced & Rock-solid layout */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto w-full relative z-0 shrink-0"
        >
          <div className="p-4 sm:p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Left info */}
              <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {language === 'vi' ? 'Có mã khuyến mãi ưu đãi?' : 'Have a promo coupon?'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    {appliedCoupon 
                      ? (language === 'vi' ? `Đang áp dụng: ${appliedCoupon.code} (-${appliedCoupon.discountPercent}%)` : `Active code: ${appliedCoupon.code} (-${appliedCoupon.discountPercent}%)`)
                      : (language === 'vi' ? 'Nhập mã giảm giá để nhận chiết khấu trực tiếp' : 'Enter code for instant discount')}
                  </p>
                </div>
              </div>

              {/* Right action form / state */}
              {appliedCoupon ? (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>-{appliedCoupon.discountPercent}% OFF</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/40 cursor-pointer transition-colors"
                  >
                    {language === 'vi' ? 'Gỡ mã' : 'Remove'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={language === 'vi' ? 'NHẬP MÃ' : 'COUPON CODE'}
                    className="w-full sm:w-40 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-muted)] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!couponCode.trim() || isApplying}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs hover:opacity-90 active:scale-95 shrink-0 flex items-center gap-1"
                  >
                    {isApplying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{language === 'vi' ? 'Áp dụng' : 'Apply'}</span>
                  </button>
                </form>
              )}

            </div>
          </div>
        </motion.div>

        {/* Pricing Cards Grid with generous top padding for floating badges */}
        <div className="pt-6 sm:pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const isCurrentPlan = user.plan === plan.id;
            const isPro = plan.id === 'pro';
            const isUltra = plan.id === 'ultra';

            const hasDiscount = appliedCoupon && plan.rawPrice > 0 && (appliedCoupon.discountPercent ?? 0) > 0;
            const discountedPrice = hasDiscount 
              ? Math.max(0, Math.round(plan.rawPrice * (1 - (appliedCoupon.discountPercent ?? 0) / 100)))
              : plan.rawPrice;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx, duration: 0.3 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 backdrop-blur-xl ${
                  isUltra 
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-card)]/95 shadow-xl shadow-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30'
                    : isPro 
                      ? 'border-blue-500/40 bg-[var(--bg-card)]/95 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)]/90 shadow-sm'
                }`}
              >
                {/* Floating Top Badge for Pro / Ultra */}
                {isUltra && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-[var(--accent-primary)] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap z-20">
                    <Crown className="w-3.5 h-3.5 fill-white" />
                    <span>{language === 'vi' ? 'Tối Thượng • Toàn Năng' : 'Ultimate • All Access'}</span>
                  </div>
                )}
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5 whitespace-nowrap z-20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Khuyên Dùng • Phổ Biến' : 'Most Popular Choice'}</span>
                  </div>
                )}

                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${
                        isUltra 
                          ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)]/30' 
                          : isPro 
                            ? 'bg-blue-500/15 border-blue-500/30' 
                            : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
                      }`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">{plan.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          isUltra 
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40' 
                            : isPro 
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {plan.badge}
                        </span>
                      </div>
                    </div>

                    {isCurrentPlan && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {language === 'vi' ? 'Đang Dùng' : 'Current'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] min-h-[32px] leading-relaxed mb-4">
                    {plan.desc}
                  </p>

                  {/* Price Display */}
                  <div className="py-4 border-y border-[var(--border-color)] mb-6">
                    {hasDiscount ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm line-through text-[var(--text-muted)] font-mono">{plan.price}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            -{appliedCoupon.discountPercent}%
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {discountedPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            / {discountedPrice === 0 ? (language === 'vi' ? 'tháng' : 'month') : plan.period}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] font-mono">
                          {plan.price}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">/ {plan.period}</span>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                      {language === 'vi' ? 'Quyền lợi & Tính năng' : 'Features & Benefits'}
                    </span>
                    {plan.features.map((feat, fIdx) => (
                      <div 
                        key={fIdx} 
                        className={`flex items-start gap-2.5 text-xs leading-relaxed ${
                          feat.included ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] line-through opacity-50'
                        }`}
                      >
                        {feat.included ? (
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isUltra 
                              ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)]' 
                              : isPro 
                                ? 'bg-blue-500/15 text-blue-500' 
                                : 'bg-emerald-500/15 text-emerald-500'
                          }`}>
                            <Check className="w-3 h-3 stroke-[2.8]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 stroke-[2]" />
                          </div>
                        )}
                        <span className={feat.highlight ? 'font-bold text-[var(--text-primary)]' : ''}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-2xl border text-xs font-bold bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'vi' ? 'Đang Sử Dụng Gói Này' : 'Currently Active'}</span>
                    </button>
                  ) : plan.id === 'free' ? (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-2xl border text-xs font-bold bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-secondary)] cursor-default flex items-center justify-center gap-2"
                    >
                      <span>{language === 'vi' ? 'Gói Cơ Bản Miễn Phí' : 'Free Tier'}</span>
                    </button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isCreatingInvoice === plan.id}
                      onClick={() => handleCheckout(plan.id as 'pro' | 'ultra')}
                      className={`w-full py-3.5 px-4 rounded-2xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
                        isUltra
                          ? 'bg-[var(--accent-primary)] hover:opacity-95 text-[var(--accent-text)] shadow-[var(--accent-primary)]/20'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                      }`}
                    >
                      {isCreatingInvoice === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{language === 'vi' ? 'Đang Tạo VietQR...' : 'Generating QR...'}</span>
                        </>
                      ) : (
                        <>
                          {isUltra ? <Crown className="w-4 h-4 fill-current" /> : <Rocket className="w-4 h-4" />}
                          <span>
                            {language === 'vi' 
                              ? `Nâng Cấp ${plan.name} Ngay` 
                              : `Upgrade to ${plan.name}`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="pt-10 max-w-3xl mx-auto space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Câu Hỏi Thường Gặp' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {language === 'vi' ? 'Giải đáp các thắc mắc về thanh toán và quyền lợi gói cước' : 'Everything you need to know about plans and payments'}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, fIdx) => (
              <div 
                key={fIdx}
                className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === fIdx ? null : fIdx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                    {faq.q}
                  </span>
                  {openFaqIndex === fIdx ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaqIndex === fIdx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/40 pt-3">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* VietQR Payment Modal */}
      <PaymentQrModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        billData={billData}
      />
    </div>
  );
};
