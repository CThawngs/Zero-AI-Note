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
  billData: {
    bill_id: string;
    amount: number;
    plan: 'pro' | 'ultra';
    payment_url: string;
    qr_data?: {
      acqId: string;
      amount: number;
      addInfo: string;
      bankName: string;
      accountNo: string;
      accountName: string;
    };
    payee?: {
      accountNo: string | null;
      bankName: string | null;
      accountName: string | null;
    } | null;
  } | null;
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  isOpen,
  onClose,
  billData,
}) => {
  const { user, setUser, addToast, theme, language } = useApp();
  const [isCopiedAccount, setIsCopiedAccount] = useState(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState(false);
  const [isCopiedContent, setIsCopiedContent] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isDark = theme === 'dark';

  // Reset success state when a new bill opens
  useEffect(() => {
    if (isOpen) {
      setIsPaidSuccess(false);
    }
  }, [isOpen, billData?.bill_id]);

  /** Dựng payload EMVCo VietQR chuẩn từ qr_data object (Napas spec 2022) */
  const buildVietQrString = (): string => {
    if (!billData?.qr_data) return '';
    const { acqId, accountNo, amount, addInfo } = billData.qr_data;
    try {
      const qr = QRPay.initVietQR({
        bankBin: acqId || '970436', // Default Vietcombank BIN if empty
        bankNumber: accountNo,
        amount: String(Number(amount) || 0),
        purpose: addInfo || billData.bill_id,
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

  const qrValue = billData?.qr_data ? buildVietQrString() : '';

  // Auto-polling: Tự động kiểm tra trạng thái thanh toán mỗi 2.5s
  // KHÔNG CẦN BUTTON XÁC NHẬN THỦ CÔNG
  useEffect(() => {
    if (!isOpen || !billData || isPaidSuccess) return;

    const interval = setInterval(async () => {
      try {
        setIsChecking(true);
        const res = await fetch(`/api/billing/check-status?billId=${billData.bill_id}&plan=${billData.plan}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid) {
            setIsPaidSuccess(true);
            // Cập nhật State tức thì trên client
            setUser(prev => ({ ...prev, plan: billData.plan }));
            confetti({
              particleCount: 140,
              spread: 80,
              origin: { y: 0.6 },
            });
            addToast(
              language === 'vi' ? 'Thanh toán thành công!' : 'Payment Successful!',
              language === 'vi' 
                ? `Tài khoản của bạn đã được tự động nâng cấp lên gói ${billData.plan.toUpperCase()}.` 
                : `Your account has been automatically upgraded to ${billData.plan.toUpperCase()} plan.`,
              'success'
            );
            setTimeout(() => {
              onClose();
            }, 2500);
          }
        }
      } catch (err) {
        console.warn('Check payment status error:', err);
      } finally {
        setIsChecking(false);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, billData, isPaidSuccess, setUser, addToast, language, onClose]);

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
  const accountName = billData.qr_data?.accountName || billData.payee?.accountName || 'NGUYEN ANH THANG';
  const transferNote = billData.qr_data?.addInfo || billData.bill_id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPaidSuccess
          ? (language === 'vi' ? '🎉 Nâng Cấp Thành Công!' : '🎉 Upgrade Completed!')
          : (language === 'vi' ? `Quét Mã Thanh Toán Gói ${billData.plan.toUpperCase()}` : `Scan QR to Upgrade ${billData.plan.toUpperCase()}`)
      }
      subtitle={
        isPaidSuccess
          ? (language === 'vi' ? 'Đã xác nhận giao dịch qua VietQR Napas EMVCo' : 'Payment confirmed via VietQR Napas EMVCo')
          : (language === 'vi' ? 'Hệ thống tự động kích hoạt ngay sau khi chuyển khoản' : 'System auto-activates immediately after transfer')
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
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
                <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="M"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-[var(--bg-hover)] rounded-2xl">
                  <QrCode className="w-16 h-16 text-[var(--text-muted)]" />
                </div>
              )}

              {/* Automatic Realtime Status Radar */}
              <div className="mt-3.5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
                </span>
                <span>{language === 'vi' ? 'Đang tự động nhận diện thanh toán...' : 'Listening for automatic payment...'}</span>
              </div>
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

            {/* Helper notice — NO manual confirm button needed */}
            <p className="text-[11px] text-center text-[var(--text-muted)] pt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'vi' ? 'Tự động kích hoạt trong 3-5 giây • Không cần bấm xác nhận' : 'Auto-activates in 3-5s • No manual confirmation needed'}</span>
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
