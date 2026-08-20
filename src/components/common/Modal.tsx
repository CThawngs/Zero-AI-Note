import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  disableClose?: boolean;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  disableClose = false,
  hideCloseButton = false,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, disableClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!disableClose) onClose();
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`relative w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] border transition-colors duration-200 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]`}
          >
            {title && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-hover)]">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                  {subtitle && <p className="text-xs mt-0.5 text-[var(--text-secondary)]">{subtitle}</p>}
                </div>
                {!hideCloseButton && (
                  <button
                    id="close-modal-btn"
                    onClick={() => {
                      if (!disableClose) onClose();
                    }}
                    disabled={disableClose}
                    className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center p-2 rounded-xl transition-colors ${
                      disableClose 
                        ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]' 
                        : 'cursor-pointer active:scale-95 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                    }`}
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
