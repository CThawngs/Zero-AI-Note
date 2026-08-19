import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  Copy, 
  Check, 
  Globe, 
  Twitter, 
  Linkedin, 
  Send, 
  Mail, 
  QrCode, 
  FileText,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../common/Modal';
import { NoteItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteItem | null;
}

export const ShareNoteModal: React.FC<ShareNoteModalProps> = ({
  isOpen,
  onClose,
  note,
}) => {
  const { addToast, theme, language, t } = useApp();
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedMd, setIsCopiedMd] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!note || !isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://zeronote.ai';
  const shareUrl = `${origin}/app?noteId=${encodeURIComponent(note.id)}`;
  const isDark = theme === 'dark';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    setIsCopiedLink(true);
    addToast(
      language === 'vi' ? 'Đã sao chép liên kết' : 'Link Copied',
      language === 'vi' ? 'Liên kết bài ghi chú đã được lưu vào clipboard.' : 'Share link copied to clipboard.',
      'success'
    );
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleCopyMarkdown = () => {
    const content = `${note.title}\n\n${note.summary}\n\n${note.rawMarkdown}`;
    navigator.clipboard?.writeText(content);
    setIsCopiedMd(true);
    addToast(
      language === 'vi' ? 'Đã sao chép Markdown' : 'Markdown Copied',
      language === 'vi' ? 'Toàn bộ nội dung ghi chú đã được sao chép.' : 'Full note markdown copied to clipboard.',
      'success'
    );
    setTimeout(() => setIsCopiedMd(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.summary || `Ghi chú học thuật: ${note.title}`,
          url: shareUrl,
        });
        addToast(language === 'vi' ? 'Chia sẻ thành công' : 'Shared Successfully', '', 'success');
      } catch {
        // user cancelled or share unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const shareText = encodeURIComponent(`📚 ${note.title} — Ghi chú học thuật AI từ Zero AI Note:`);
  const encodedUrl = encodeURIComponent(shareUrl);

  const socialLinks = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`,
      color: 'hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:bg-blue-600/10 hover:text-blue-600 hover:border-blue-600/30'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
      color: 'hover:bg-sky-600/10 hover:text-sky-600 hover:border-sky-600/30'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(note.title)}&body=${shareText}%0A%0A${encodedUrl}`,
      color: 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30'
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'vi' ? 'Chia Sẻ Bài Ghi Chú' : 'Share Academic Note'}
      subtitle={language === 'vi' ? 'Chia sẻ liên kết hoặc xuất bản nội dung ghi chú này đến bạn bè và đồng nghiệp' : 'Share link or export note content to collaborators'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1">
        {/* Note Card Preview */}
        <div className="p-3.5 rounded-2xl border bg-[var(--bg-app)] border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
              {note.method.toUpperCase()} NOTE
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">• {note.category || 'General'}</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] line-clamp-2">
            {note.title}
          </h4>
          {note.summary && (
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {note.summary}
            </p>
          )}
        </div>

        {/* Copy Share Link Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[var(--text-primary)]">
            {language === 'vi' ? 'Liên kết trực tiếp' : 'Direct Note Link'}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 rounded-xl px-3.5 py-2 text-xs font-mono border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none select-all truncate"
            />
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0"
            >
              {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedLink ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Native Share / Copy Markdown / QR */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-2xs"
          >
            {isCopiedMd ? <Check className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4 text-[var(--accent-primary)]" />}
            <span>{isCopiedMd ? (language === 'vi' ? 'Đã chép MD' : 'Copied') : (language === 'vi' ? 'Chép Markdown' : 'Copy Markdown')}</span>
          </button>

          <button
            onClick={() => setShowQr(!showQr)}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-2xs"
          >
            <QrCode className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>{showQr ? (language === 'vi' ? 'Ẩn mã QR' : 'Hide QR') : (language === 'vi' ? 'Hiện mã QR' : 'Show QR Code')}</span>
          </button>
        </div>

        {/* QR Code Container */}
        {showQr && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl border bg-white flex flex-col items-center justify-center space-y-2 border-zinc-200 shadow-sm"
          >
            <QRCodeSVG value={shareUrl} size={160} level="M" fgColor="#000000" bgColor="#FFFFFF" />
            <p className="text-[11px] text-zinc-600 font-medium text-center">
              {language === 'vi' ? 'Quét camera điện thoại để mở ghi chú ngay' : 'Scan with mobile camera to open note'}
            </p>
          </motion.div>
        )}

        {/* Social Share Grid */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {language === 'vi' ? 'Chia sẻ nhanh qua mạng xã hội' : 'Share via social channels'}
          </span>
          <div className="grid grid-cols-4 gap-2">
            {socialLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs ${item.color} active:scale-95`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{item.name.split(' ')[0]}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
