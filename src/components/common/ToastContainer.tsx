import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <CheckCircle2 className="w-5 h-5 text-[var(--status-success)] shrink-0" />;
          let borderStyle = 'border-[var(--status-success)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl';

          if (toast.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-[var(--status-error)] shrink-0" />;
            borderStyle = 'border-[var(--status-error)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-[var(--status-warning)] shrink-0" />;
            borderStyle = 'border-[var(--status-warning)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl';
          } else if (toast.type === 'info') {
            icon = <Info className="w-5 h-5 text-[var(--status-info)] shrink-0" />;
            borderStyle = 'border-[var(--status-info)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md ${borderStyle}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                <p className="font-semibold leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs opacity-85 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                id={`close-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
