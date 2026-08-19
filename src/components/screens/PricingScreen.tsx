import React, { useState, useEffect } from 'react';
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
  Loader2,
  FileCheck,
  Landmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentQrModal } from '../modals/PaymentQrModal';

export const PricingScreen: React.FC = () => {
  const { user, applyCouponCode, addToast, theme, language, t } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent?: number; discountValue?: number; baseAmount?: number; finalAmount?: number } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<string | null>(null);
  const [billData, setBillData] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Zero Tracking receiving accounts (real-time payee switch)
  const [payAccounts, setPayAccounts] = useState<any[]>([]);
  const [selectedPayAccount, setSelectedPayAccount] = useState<string>(''); // '' = app default
  const [payAccountsLoaded, setPayAccountsLoaded] = useState(false);

  const isDark = theme === 'dark';

  // Load linked payment accounts from Zero Tracking
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/billing/payment-accounts');
        const j = await res.json();
        if (!cancelled && j.accounts) {
          setPayAccounts(j.accounts);
        }
      } catch {
        // fail-open: keep empty list, checkout still works with app default
      } finally {
        if (!cancelled) setPayAccountsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      desc: language === 'vi' ? 'Khám phá & trải nghiệm ghi chú học thuật AI' : 'Start exploring academic AI notes',
      price: '0đ',
      period: language === 'vi' ? 'vĩnh viễn' : 'lifetime',
      badge: language === 'vi' ? 'Miễn phí' : 'Free Tier',
      features: [
        { text: language === 'vi' ? 'Lưu trữ tối đa 20 Notes' : 'Up to 20 Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? '3 templates nền tảng (Cornell, Outline, Tóm tắt)' : '3 foundational templates (Cornell, Outline, Summary)', included: true },
        { text: language === 'vi' ? 'Tối đa 5 Custom Templates' : 'Up to 5 Custom Templates', included: true },
        { text: language === 'vi' ? 'Xem trước Raw / Markdown' : 'Raw / Markdown preview', included: true },
        { text: language === 'vi' ? 'Xuất 3 định dạng cơ bản (.pdf, .docx, .md)' : 'Export 3 basic formats (.pdf, .docx, .md)', included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tĩnh & Tương tác' : 'Static & Interactive HTML preview', included: false },
        { text: language === 'vi' ? 'Checkbox Multi-Export / Nén ZIP' : 'Checkbox Multi-Export / ZIP bundle', included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      desc: language === 'vi' ? 'Dành cho sinh viên, giảng viên & người đi làm hằng ngày' : 'For students, teachers & daily researchers',
      price: '99.000đ',
      period: language === 'vi' ? 'tháng (~$4)' : 'month (~$4)',
      popular: true,
      badge: language === 'vi' ? 'Phổ biến nhất' : 'Most Popular',
      features: [
        { text: language === 'vi' ? 'Lưu trữ tối đa 50 Notes' : 'Up to 50 Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? '9 templates (Kế thừa Free + Họp, Bài giảng, Q&A, Phân tích, Charting, Boxing)' : '9 templates (Free + Meeting, Lecture, Q&A, Analysis, Charting, Boxing)', included: true },
        { text: language === 'vi' ? 'Tối đa 25 Custom Templates' : 'Up to 25 Custom Templates', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tĩnh chuẩn CSS' : 'Static HTML Preview with CSS styling', included: true },
        { text: language === 'vi' ? 'Xuất 4 định dạng (PDF, DOCX, MD, Webpage HTML)' : 'Export 4 formats (PDF, DOCX, MD, Webpage HTML)', included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tương tác Động (JS)' : 'Interactive Dynamic HTML Preview (JS)', included: false },
        { text: language === 'vi' ? 'Checkbox Multi-Export / Nén ZIP' : 'Checkbox Multi-Export / ZIP bundle', included: false },
      ]
    },
    {
      id: 'ultra',
      name: 'Ultra',
      desc: language === 'vi' ? 'Chuyên gia nghiên cứu, đề án chuyên ngành & xử lý chuyên sâu' : 'For master researchers, thesis projects & heavy workloads',
      price: '199.000đ',
      period: language === 'vi' ? 'tháng (~$8)' : 'month (~$8)',
      badge: language === 'vi' ? 'Toàn năng' : 'All Access',
      features: [
        { text: language === 'vi' ? 'KHÔNG GIỚI HẠN số lượng Note' : 'UNLIMITED Notes storage', highlight: true, included: true },
        { text: language === 'vi' ? 'Trọn bộ 17 templates (Feynman, First Principles, Mindmap, Flashcard, Syntopical, 5W1H, All-in-One)' : 'Full 17 templates (Feynman, First Principles, Mindmap, Flashcard, Syntopical, 5W1H, All-in-One)', included: true },
        { text: language === 'vi' ? 'KHÔNG GIỚI HẠN Custom Templates' : 'UNLIMITED Custom Templates', included: true },
        { text: language === 'vi' ? 'Xem trước HTML Tương tác Động (JS, chart hover, animation)' : 'Interactive Dynamic HTML Preview (JS, chart hover, animation)', included: true },
        { text: language === 'vi' ? 'Single-file Interactive HTML độc lập 100% offline' : 'Single-file Interactive HTML 100% offline', included: true },
        { text: language === 'vi' ? 'Checkbox Multi-Export & Đóng gói 1 file .ZIP' : 'Checkbox Multi-Export & Single .ZIP bundle', highlight: true, included: true },
        { text: language === 'vi' ? 'Dùng chung Gemini Key / Tự kết nối AI' : 'Shared Gemini Key / Connect Own AI', included: true },
        { text: language === 'vi' ? 'Ưu tiên tốc độ xử lý & hỗ trợ kỹ thuật 24/7' : 'Priority processing speed & 24/7 support', included: true },
      ]
    }
  ];

  const faqs = [
    {
      q: language === 'vi' ? 'Hạn mức lưu trữ Note được tính như thế nào?' : 'How is note storage quota counted?',
      a: language === 'vi' 
        ? 'Gói Miễn phí lưu tối đa 20 Notes, Gói Pro lưu tối đa 50 Notes, Gói Ultra không giới hạn. Bạn luôn có thể xóa các Note cũ trong Thùng rác để giải phóng dung lượng lưu trữ.' 
        : 'Free plan stores up to 20 Notes, Pro stores up to 50 Notes, Ultra is unlimited. You can always delete old notes in Trash to free up storage.'
    },
    {
      q: language === 'vi' ? 'Tính năng Checkbox Multi-Export của Ultra có gì đặc biệt?' : 'What is Ultra Checkbox Multi-Export?',
      a: language === 'vi' 
        ? 'Độc quyền Ultra: Hộp thoại xuất file cho phép bạn tick chọn đồng thời bất kỳ định dạng nào (PDF, Word, Markdown, Interactive HTML) để tải song song hoặc đóng gói vào 1 file .ZIP duy nhất.' 
        : 'Exclusive to Ultra: Select any formats simultaneously (PDF, Word, Markdown, Interactive HTML) to download in parallel or package into a single .ZIP bundle.'
    },
    {
      q: language === 'vi' ? 'Tôi có bị giới hạn giờ xử lý AI hay độ dài file không?' : 'Is there an AI processing time limit?',
      a: language === 'vi' 
        ? 'Không giới hạn giờ xử lý trên lý thuyết cho cả 3 gói. Hệ thống dùng chung Gemini Key. Nếu key quá tải, bạn có thể chuyển sang chế độ "Tự kết nối AI" với API Key của riêng bạn.' 
        : 'No time limits for all 3 tiers. The system uses a shared Gemini Key pool. If congested, you can seamlessly switch to "Connect Your Own AI" with your own API Key.'
    },
    {
      q: language === 'vi' ? 'Tôi thanh toán qua cổng nào và có an toàn không?' : 'How do I pay and is it secure?',
      a: language === 'vi' 
        ? 'Thanh toán trực tiếp qua cổng ZeroInvoice (VietQR tự động). Sau khi chuyển khoản đúng cú pháp, hệ thống sẽ kích hoạt nâng cấp gói ngay lập tức trong vài giây.' 
        : 'Payments are processed directly via ZeroInvoice VietQR gateway. Your plan is activated automatically within seconds after transferring.'
    }
  ];

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || isApplying) return;

    setIsApplying(true);
    const res = await applyCouponCode(couponCode);
    setIsApplying(false);

    if (res.success) {
      setAppliedCoupon({ code: couponCode.trim().toUpperCase() });
      addToast(language === 'vi' ? 'Áp dụng mã thành công' : 'Coupon Applied', res.message, 'success');
    } else {
      addToast(language === 'vi' ? 'Mã không hợp lệ' : 'Invalid coupon', res.message, 'error');
    }
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
          paymentAccountId: selectedPayAccount || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment invoice');
      }

      const data = await res.json();
      setBillData(data);
      setIsPaymentModalOpen(true);
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-10 space-y-10 sm:space-y-12 transition-colors duration-250 bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Bảng Giá Minh Bạch • Không Phí Ẩn' : 'Transparent Pricing • No Hidden Fees'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {language === 'vi' ? 'Nâng tầm ghi chú học thuật cùng AI' : 'Elevate Your Research With AI Notes'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          {language === 'vi' 
            ? 'Chọn gói dịch vụ phù hợp với nhu cầu học tập và nghiên cứu của bạn. Nâng cấp hoặc hạ gói bất kỳ lúc nào.' 
            : 'Choose the ideal plan for your learning workflow. Upgrade or downgrade anytime.'}
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {plans.map((plan) => {
          const isCurrentPlan = user.plan === plan.id;
          const isPro = plan.id === 'pro';
          const isUltra = plan.id === 'ultra';

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all duration-300 ${
                isUltra 
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-card)] shadow-xl shadow-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/30'
                  : isPro 
                    ? 'border-blue-500/40 bg-[var(--bg-card)] shadow-lg'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  isUltra 
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40' 
                    : isPro 
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' 
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}>
                  {plan.badge}
                </span>

                {isCurrentPlan && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {language === 'vi' ? 'Gói hiện tại' : 'Current Plan'}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 min-h-[32px]">{plan.desc}</p>

                <div className="mt-4 mb-6 pb-6 border-b border-[var(--border-color)]">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-1.5">/ {plan.period}</span>
                </div>

                {/* Features list */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      {feat.included ? (
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${feat.highlight ? 'text-[var(--accent-primary)] font-bold' : 'text-emerald-500'}`} />
                      ) : (
                        <X className="w-4 h-4 shrink-0 mt-0.5 text-gray-400 opacity-50" />
                      )}
                      <span className={`${feat.included ? (feat.highlight ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-primary)]') : 'text-[var(--text-muted)] line-through'}`}>
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
                    className="w-full py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-muted)] text-xs font-bold cursor-not-allowed text-center"
                  >
                    {language === 'vi' ? 'Đang sử dụng' : 'Active Plan'}
                  </button>
                ) : plan.id === 'free' ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-muted)] text-xs font-bold cursor-not-allowed text-center"
                  >
                    {language === 'vi' ? 'Gói Cơ Bản' : 'Default Plan'}
                  </button>
                ) : (
                  <button
                    id={`btn-upgrade-${plan.id}`}
                    onClick={() => handleCheckout(plan.id as 'pro' | 'ultra')}
                    disabled={isCreatingInvoice === plan.id}
                    className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                      isUltra 
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] hover:opacity-90 shadow-[var(--accent-primary)]/25'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                    }`}
                  >
                    {isCreatingInvoice === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{language === 'vi' ? `Nâng cấp lên ${plan.name}` : `Upgrade to ${plan.name}`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Receiving account selector (Zero Tracking real-time payee switch) */}
      {payAccountsLoaded && payAccounts.length > 0 && (
        <div className="max-w-md mx-auto w-full p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
            <Landmark className="w-4 h-4 text-emerald-500" />
            <span>{language === 'vi' ? 'Tài khoản nhận tiền (Zero Tracking)' : 'Receiving Account (Zero Tracking)'}</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            {language === 'vi'
              ? 'Chọn tài khoản/Ví để QR Code nhận tiền đúng realtime cho lượt thanh toán này.'
              : 'Pick the bank/e-wallet the VietQR routes to for this checkout, in real time.'}
          </p>
          <select
            value={selectedPayAccount}
            onChange={(e) => setSelectedPayAccount(e.target.value)}
            className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] cursor-pointer"
          >
            <option value="">{language === 'vi' ? '— Mặc định (tài khoản app) —' : '— App default account —'}</option>
            {payAccounts.filter((a) => a.type === 'bank').map((a) => (
              <option key={a.id} value={a.id}>
                🏦 {a.bank_name || 'Ngân hàng'} — {a.account_no}
              </option>
            ))}
            {payAccounts.filter((a) => a.type === 'momo').map((a) => (
              <option key={a.id} value={a.id}>🟣 MoMo — {a.account_no}</option>
            ))}
            {payAccounts.filter((a) => a.type === 'zalopay').map((a) => (
              <option key={a.id} value={a.id}>🔵 ZaloPay — {a.account_no}</option>
            ))}
          </select>
        </div>
      )}

      {/* Coupon input section */}
      <div className="max-w-md mx-auto w-full p-5 rounded-3xl border bg-[var(--bg-card)] border-[var(--border-color)] shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
          <span>{language === 'vi' ? 'Bạn có mã giảm giá?' : 'Have a promo coupon?'}</span>
        </div>
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder={language === 'vi' ? 'Nhập mã (VD: ZERONOTE50)' : 'Enter coupon code...'}
            className="flex-1 rounded-xl px-3.5 py-2 text-xs border uppercase tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          <button
            type="submit"
            disabled={isApplying || !couponCode.trim()}
            className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-bold cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (language === 'vi' ? 'Áp dụng' : 'Apply')}
          </button>
        </form>
        {appliedCoupon && (
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ {language === 'vi' ? `Đã áp dụng mã: ${appliedCoupon.code}` : `Applied coupon: ${appliedCoupon.code}`}
          </p>
        )}
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto w-full space-y-4 pt-4">
        <h2 className="text-lg font-bold text-center text-[var(--text-primary)]">
          {language === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions'}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border transition-colors bg-[var(--bg-card)] border-[var(--border-color)] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)]/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment QR Modal */}
      <PaymentQrModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        billData={billData}
        payAccounts={payAccounts}
        selectedPayAccount={selectedPayAccount}
        onBillChange={(newBill) => setBillData(newBill)}
      />
    </div>
  );
};
