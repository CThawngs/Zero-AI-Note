import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, QrCode, Copy, Check, Loader2, Sparkles, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QRPay } from 'vietnam-qr-pay';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  billData: {
    bill_id: string;
    amount: number;
    plan: 'pro' | 'ultra';
    payment_url: string;
    qr_image_url?: string | null;
    status_url?: string | null;
    qr_data?: {
      acqId?: string;
      amount?: number;
      addInfo?: string;
      bankName?: string;
      accountNo?: string;
      accountName?: string;
    };
    payee?: {
      accountNo?: string | null;
      bankName?: string | null;
      accountName?: string | null;
      acqId?: string | null;
      resolvedVia?: string | null;
    } | null;
  } | null;
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  billData,
}) => {
  const { user, setUser, addToast, theme, language } = useApp();
  const [isCopiedAccount, setIsCopiedAccount] = useState(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState(false);
  const [isCopiedContent, setIsCopiedContent] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [isVerifyingSubmitted, setIsVerifyingSubmitted] = useState(false);

  const isDark = theme === 'dark';

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsPaidSuccess(false);
      setIsSubmittingConfirm(false);
      setIsVerifyingSubmitted(false);
      setShowExitWarning(false);
      setPaymentError(null);
    }
  }, [isOpen, billData?.bill_id]);

  // Tự động kiểm tra trạng thái thanh toán Realtime mỗi 2 giây
  // Khi tiền vào tài khoản ngân hàng qua Zero Tracking -> Tự động nổ pháo hoa, nâng cấp gói, gỡ coupon và đóng popup
  useEffect(() => {
    if (!isOpen || !billData?.bill_id || isPaidSuccess) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/billing/check-status?billId=${billData.bill_id}&plan=${billData.plan}`);
        const data = await res.json().catch(() => ({}));
        if (!isMounted) return;

        if (data.isPaid || data.status === 'paid' || data.status === 'resolved') {
          clearInterval(pollInterval);
          setIsPaidSuccess(true);
          setUser(prev => ({ ...prev, plan: billData.plan, appliedCoupon: undefined }));
          onSuccess?.();

          confetti({
            particleCount: 160,
            spread: 85,
            origin: { y: 0.6 },
          });

          addToast(
            language === 'vi' ? '🎉 Thanh toán thành công!' : '🎉 Payment Received!',
            language === 'vi'
              ? `Tài khoản của bạn đã được nâng cấp lên gói ${billData.plan.toUpperCase()}.`
              : `Your account is now upgraded to ${billData.plan.toUpperCase()} plan.`,
            'success'
          );

          setTimeout(() => {
            if (isMounted) onClose();
          }, 2500);
        } else if (data.status === 'verifying') {
          setIsVerifyingSubmitted(true);
        }
      } catch (err) {
        console.warn('Auto-poll check payment error:', err);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, billData?.bill_id, isPaidSuccess, billData?.plan, language, onClose, onSuccess, setUser, addToast]);

  const OPEN_BANKING_BINS = ['970422', '970416', '970418', '970448', '970426', '970452', '970446', '970436', '970407', '970415'];
  const acqId = billData?.qr_data?.acqId || billData?.payee?.acqId || '970422';
  const isOpenBanking = true; // All Zero Tracking bills are integrated with real-time detection

  /** Dựng payload EMVCo VietQR chuẩn từ qr_data object (Napas spec 2022) */
  const buildVietQrString = (): string => {
    if (!billData) return '';
    const bankBin = billData.qr_data?.acqId || billData.payee?.acqId || '970422';
    const bankNumber = billData.qr_data?.accountNo || billData.payee?.accountNo || '0362475230';
    const amount = String(Number(billData.qr_data?.amount || billData.amount) || 0);
    const purpose = billData.qr_data?.addInfo || billData.bill_id;

    try {
      const qr = QRPay.initVietQR({
        bankBin,
        bankNumber,
        amount,
        purpose,
      });
      const payload = qr.build();
      if (payload && payload.startsWith('000201') && /63\d{2}[0-9A-F]{4}$/.test(payload)) {
        return payload;
      }
      return '';
    } catch (e) {
      console.error('VietQR build error:', e);
      return '';
    }
  };

  const qrValue = billData?.qr_data || billData?.payee ? buildVietQrString() : '';

  // Xử lý khi user bấm nút hành động (Kiểm tra thanh toán ngay)
  const handleActionClick = async () => {
    if (!billData || isSubmittingConfirm || isPaidSuccess) return;
    try {
      setIsSubmittingConfirm(true);
      setPaymentError(null);

      const res = await fetch(`/api/billing/check-status?billId=${billData.bill_id}&plan=${billData.plan}`);
      const data = await res.json().catch(() => ({}));

      if (data.isPaid || data.status === 'paid' || data.status === 'resolved') {
        setIsPaidSuccess(true);
        setUser(prev => ({ ...prev, plan: billData.plan, appliedCoupon: undefined }));
        onSuccess?.();

        confetti({
          particleCount: 160,
          spread: 85,
          origin: { y: 0.6 },
        });

        addToast(
          language === 'vi' ? '🎉 Thanh toán thành công!' : '🎉 Payment Received!',
          language === 'vi'
            ? `Tài khoản của bạn đã được nâng cấp lên gói ${billData.plan.toUpperCase()}.`
            : `Your account is now upgraded to ${billData.plan.toUpperCase()} plan.`,
          'success'
        );

        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        // Dự phòng: Thử confirm với Zero Tracking resolve
        const confirmRes = await fetch('/api/billing/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billId: billData.bill_id, plan: billData.plan }),
        });
        const confirmData = await confirmRes.json().catch(() => ({}));

        if (confirmData.ok && confirmData.isPaid) {
          setIsPaidSuccess(true);
          setUser(prev => ({ ...prev, plan: billData.plan, appliedCoupon: undefined }));
          onSuccess?.();
          confetti({ particleCount: 160, spread: 85, origin: { y: 0.6 } });
          setTimeout(() => onClose(), 2500);
        } else {
          const errorMsg = language === 'vi'
            ? 'Hệ thống chưa nhận được thông báo chuyển tiền từ ngân hàng. Vui lòng quét mã VietQR chuyển tiền và thử lại sau ít giây.'
            : 'Payment not detected in bank account yet. Please scan VietQR and try again.';
          setPaymentError(errorMsg);
          addToast(
            language === 'vi' ? 'Chưa nhận được thanh toán' : 'Payment Not Received',
            errorMsg,
            'warning'
          );
        }
      }
    } catch (e) {
      console.error('Payment action error:', e);
      const errMsg = language === 'vi'
        ? 'Có lỗi kết nối. Vui lòng thử lại sau ít giây.'
        : 'Connection error. Please try again.';
      setPaymentError(errMsg);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Intercept close request from X button, backdrop or Escape
  const handleRequestClose = () => {
    if (isPaidSuccess || isSubmittingConfirm) return;
    setShowExitWarning(true);
  };

  if (!billData) return null;

  const copyText = (text: string, type: 'acc' | 'amt' | 'content') => {
    navigator.clipboard?.writeText(text);
    if (type === 'acc') {
      setIsCopiedAccount(true);
      setTimeout(() => setIsCopiedAccount(false), 2000);
    } else if (type === 'amt') {
      setIsCopiedAmount(true);
      setTimeout(() => setIsCopiedAmount(false), 2000);
    } else {
      setIsCopiedContent(true);
      setTimeout(() => setIsCopiedContent(false), 2000);
    }
  };

  const bankName = billData.qr_data?.bankName || billData.payee?.bankName || 'Vietcombank';
  const accountNo = billData.qr_data?.accountNo || billData.payee?.accountNo || '1035194556';
  const accountName = billData.qr_data?.accountName || billData.payee?.accountName || 'NGUYEN CHI THANG';
  const transferNote = billData.qr_data?.addInfo || billData.bill_id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      disableClose={isPaidSuccess || isSubmittingConfirm}
      title={
        isPaidSuccess
          ? (language === 'vi' ? '🎉 Nâng Cấp Thành Công!' : '🎉 Upgrade Completed!')
          : (language === 'vi' ? `Quét Mã Thanh Toán Gói ${billData.plan.toUpperCase()}` : `Scan QR to Upgrade ${billData.plan.toUpperCase()}`)
      }
      subtitle={
        isPaidSuccess
          ? (language === 'vi' ? 'Đã xác nhận giao dịch qua VietQR Napas EMVCo' : 'Payment confirmed via VietQR Napas EMVCo')
          : (language === 'vi' ? 'Vui lòng chuyển khoản đúng nội dung và bấm Xác nhận bên dưới' : 'Please transfer with exact note and confirm below')
      }
      maxWidth="max-w-md"
    >
      <div className="relative space-y-4">
        
        {/* Exit Warning Confirmation Overlay */}
        <AnimatePresence>
          {showExitWarning && !isPaidSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-40 bg-[var(--bg-card)]/98 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl border border-amber-500/30 shadow-2xl"
            >
              <div className="w-13 h-13 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-500 flex items-center justify-center shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-extrabold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Bạn có chắc muốn thoát?' : 'Are you sure you want to exit?'}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  {language === 'vi' 
                    ? 'Nếu bạn đã chuyển tiền nhưng chưa bấm nút "Tôi Đã Chuyển Tiền Thành Công", hệ thống sẽ chưa thể ghi nhận giao dịch của bạn. Nếu bạn thoát bây giờ, giao dịch sẽ bị coi là chưa hoàn tất.' 
                    : 'If you already transferred money but did not click confirm, your payment is not yet recorded. If you exit now, this transaction is considered incomplete.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitWarning(false)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  {language === 'vi' ? 'Tiếp Tục Thanh Toán' : 'Continue Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitWarning(false);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-[var(--border-color)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95"
                >
                  {language === 'vi' ? 'Xác Nhận Thoát' : 'Confirm Exit'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isPaidSuccess ? (
          <div className="py-8 text-center space-y-4">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle className="w-9 h-9" />
            </motion.div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {language === 'vi' ? 'Giao dịch thành công!' : 'Transaction Successful!'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {language === 'vi' 
                  ? `Đặc quyền gói ${billData.plan.toUpperCase()} đã sẵn sàng để bạn sử dụng.` 
                  : `All ${billData.plan.toUpperCase()} features are now unlocked for you.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* VietQR Code Card */}
            <div className="p-4 rounded-2xl border flex flex-col items-center justify-center bg-[var(--bg-app)] border-[var(--border-color)] shadow-xs">
              {qrValue ? (
                <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="M"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
              ) : billData.qr_image_url ? (
                <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
                  <img
                    src={billData.qr_image_url}
                    alt="VietQR Napas Code"
                    className="w-[200px] h-[200px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-[var(--bg-hover)] rounded-2xl">
                  <QrCode className="w-16 h-16 text-[var(--text-muted)]" />
                </div>
              )}

              <p className="mt-3 text-[11px] text-[var(--text-secondary)] text-center font-medium">
                {language === 'vi' ? 'Mở App Ngân hàng bất kỳ để quét mã VietQR Napas EMVCo' : 'Open any Banking App to scan VietQR Napas EMVCo'}
              </p>
            </div>

            {/* Bank Transfer Details — Full & Clean */}
            <div className="space-y-2 text-xs">
              
              {/* Bank & Account Holder */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                    {language === 'vi' ? 'Ngân hàng' : 'Bank'}
                  </span>
                  <span className="font-bold text-[var(--text-primary)] truncate block">{bankName}</span>
                </div>
                <div className="p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                    {language === 'vi' ? 'Chủ tài khoản' : 'Account Name'}
                  </span>
                  <span className="font-bold text-[var(--text-primary)] uppercase truncate block">{accountName}</span>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                    {language === 'vi' ? 'Số tài khoản' : 'Account No'}
                  </span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)] tracking-wide">{accountNo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(accountNo, 'acc')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] transition-colors active:scale-95"
                >
                  {isCopiedAccount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedAccount ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
                </button>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                    {language === 'vi' ? 'Số tiền thanh toán' : 'Amount'}
                  </span>
                  <span className="font-bold text-sm text-[var(--accent-primary)] font-mono">
                    {billData.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(billData.amount.toString(), 'amt')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] transition-colors active:scale-95"
                >
                  {isCopiedAmount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedAmount ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
                </button>
              </div>

              {/* Transfer Note (AddInfo) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--accent-subtle)]/50 border-[var(--accent-primary)]/40">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--accent-primary)] block text-[10px] uppercase font-extrabold">
                      {language === 'vi' ? 'Nội dung chuyển khoản' : 'Transfer Note'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold uppercase">
                      {language === 'vi' ? 'Bắt buộc' : 'Required'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[var(--accent-primary)] block truncate">
                    {transferNote}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(transferNote, 'content')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-card)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)] hover:text-white text-[var(--accent-primary)] transition-colors active:scale-95 shrink-0"
                >
                  {isCopiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedContent ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
                </button>
              </div>

            </div>

            {/* Real-time Auto-Detection Radar Banner */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-3">
              <div className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
              </div>
              <div className="flex-1 text-left leading-relaxed">
                <span className="font-bold block text-[11px] uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  {language === 'vi' ? '⚡ Tự Động Kích Hoạt (Realtime Auto-Detect)' : '⚡ Real-time Auto-Detect 100%'}
                </span>
                <span className="text-[11px] opacity-90 block">
                  {language === 'vi' 
                    ? `Zero Tracking tự động lắng nghe biến động tài khoản ${bankName} — kích hoạt gói ngay khi nhận được tiền (không cần bấm).`
                    : `Zero Tracking listens to live transactions from ${bankName} — activates immediately upon receipt (no clicks needed).`}
                </span>
              </div>
            </div>

            {/* Inline Error Alert if payment not yet received */}
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span className="leading-relaxed font-medium">{paymentError}</span>
              </motion.div>
            )}

            {/* Action Buttons Area */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleActionClick}
                disabled={isSubmittingConfirm || isPaidSuccess}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer bg-[var(--bg-hover)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingConfirm ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'vi' ? 'Đang kiểm tra từ ngân hàng...' : 'Checking with Bank...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'vi' ? 'Kiểm Tra Thanh Toán Ngay' : 'Check Payment Status Now'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Security Notice */}
            <p className="text-[10px] text-center text-[var(--text-muted)] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {language === 'vi' ? 'Bảo mật qua Zero Tracking VietQR Napas EMVCo • Tự động đóng khi hoàn tất' : 'Secured via Zero Tracking VietQR Napas EMVCo • Auto-closes on completion'}
              </span>
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
