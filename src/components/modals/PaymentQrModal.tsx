import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, ExternalLink, QrCode, Copy, Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
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
  } | null;
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({ isOpen, onClose, billData }) => {
  const { user, setUser, addToast, theme, language } = useApp();
  const [isCopiedAccount, setIsCopiedAccount] = useState(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState(false);
  const [isCopiedContent, setIsCopiedContent] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const isDark = theme === 'dark';

  // Generate VietQR direct image URL
  const qrUrl = billData?.qr_data
    ? `https://img.vietqr.io/image/${billData.qr_data.acqId}-${billData.qr_data.accountNo}-compact2.png?amount=${billData.qr_data.amount}&addInfo=${encodeURIComponent(billData.qr_data.addInfo)}&accountName=${encodeURIComponent(billData.qr_data.accountName || 'ZERO NOTE')}`
    : '';

  // Poll payment status every 3.5 seconds
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
            // Update user in context
            setUser(prev => ({ ...prev, plan: billData.plan }));
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });
            addToast(
              language === 'vi' ? 'Thanh toán thành công!' : 'Payment Successful!',
              language === 'vi' 
                ? `Tài khoản của bạn đã được nâng cấp lên gói ${billData.plan.toUpperCase()}.` 
                : `Your account has been upgraded to ${billData.plan.toUpperCase()} plan.`,
              'success'
            );
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      } catch (err) {
        console.warn('Check payment status error:', err);
      } finally {
        setIsChecking(false);
      }
    }, 3500);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPaidSuccess
          ? (language === 'vi' ? '🎉 Nâng Cấp Thành Công!' : '🎉 Upgrade Completed!')
          : (language === 'vi' ? `Thanh Toán Nâng Cấp Gói ${billData.plan.toUpperCase()}` : `Upgrade to ${billData.plan.toUpperCase()} Plan`)
      }
      subtitle={
        isPaidSuccess
          ? (language === 'vi' ? 'Đã xác nhận thanh toán qua ZeroInvoice VietQR' : 'Payment confirmed via ZeroInvoice VietQR')
          : (language === 'vi' ? 'Quét mã VietQR hoặc chuyển khoản với nội dung bên dưới' : 'Scan VietQR or transfer using the info below')
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {isPaidSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Giao dịch thành công!' : 'Transaction Successful!'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {language === 'vi' 
                  ? `Bạn đang sở hữu toàn bộ đặc quyền của gói ${billData.plan.toUpperCase()}.` 
                  : `You now have full access to ${billData.plan.toUpperCase()} features.`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* QR Code container */}
            <div className="p-4 rounded-2xl border flex flex-col items-center justify-center bg-[var(--bg-app)] border-[var(--border-color)]">
              {qrUrl ? (
                <div className="bg-white p-3 rounded-xl shadow-md">
                  <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>{language === 'vi' ? 'Đang chờ thanh toán qua VietQR...' : 'Awaiting VietQR transfer...'}</span>
              </div>
            </div>

            {/* Transfer details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">{language === 'vi' ? 'Ngân hàng' : 'Bank'}</span>
                  <span className="font-bold text-[var(--text-primary)]">{billData.qr_data?.bankName || 'Vietcombank'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">{language === 'vi' ? 'Số tài khoản' : 'Account No'}</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{billData.qr_data?.accountNo || '1035194556'}</span>
                </div>
                <button
                  onClick={() => copyText(billData.qr_data?.accountNo || '1035194556', 'acc')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  {isCopiedAccount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedAccount ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">{language === 'vi' ? 'Số tiền thanh toán' : 'Amount'}</span>
                  <span className="font-bold text-sm text-[var(--accent-primary)]">
                    {billData.amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <button
                  onClick={() => copyText(billData.amount.toString(), 'amt')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  {isCopiedAmount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedAmount ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">{language === 'vi' ? 'Nội dung chuyển khoản (Bắt buộc)' : 'Transfer Note'}</span>
                  <span className="font-mono font-bold text-xs text-[var(--accent-primary)]">{billData.qr_data?.addInfo || billData.bill_id}</span>
                </div>
                <button
                  onClick={() => copyText(billData.qr_data?.addInfo || billData.bill_id, 'content')}
                  className="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  {isCopiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedContent ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Direct ZeroInvoice payment page button */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={billData.payment_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[var(--accent-primary)]/20 transition-all cursor-pointer text-center"
              >
                <span>{language === 'vi' ? 'Mở trang thanh toán ZeroInvoice' : 'Open ZeroInvoice Checkout'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer text-center"
              >
                {language === 'vi' ? 'Đóng cửa sổ' : 'Close'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
