'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, ArrowLeft, ArrowRight, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleAccount {
  name: string;
  email: string;
  avatarBg: string;
  avatarText?: string;
  avatarUrl?: string;
}

const PRESET_ACCOUNTS: GoogleAccount[] = [
  {
    name: 'Chí Thắng Nguyễn',
    email: 'nguyenchithang2804@gmail.com',
    avatarBg: 'bg-teal-600 text-white',
    avatarText: 'C',
  },
  {
    name: 'Chí Thắng Nguyễn',
    email: 'ffnguyenchithangff@gmail.com',
    avatarBg: 'bg-emerald-700 text-white',
    avatarText: 'T',
  },
  {
    name: 'Hoa Xuân',
    email: 'hoakarry2509@gmail.com',
    avatarBg: 'bg-rose-600 text-white',
    avatarText: 'H',
  },
  {
    name: 'Fashion TT',
    email: 'ttfashioncompany@gmail.com',
    avatarBg: 'bg-neutral-800 text-white',
    avatarText: 'F',
  },
  {
    name: 'TechGrowth Vietnam',
    email: 'techgrowthvietnam@gmail.com',
    avatarBg: 'bg-blue-600 text-white',
    avatarText: 'TG',
  },
];

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount?: (account: { email: string; name: string }) => Promise<void>;
  isDark?: boolean;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isDark = true,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChoose = async (acc: { email: string; name: string }) => {
    setSelectedEmail(acc.email);
    setIsLoading(true);
    setError(null);
    try {
      if (onSelectAccount) {
        await onSelectAccount(acc);
      } else {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: acc.email,
            displayName: acc.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Google sign in failed');
        window.location.href = '/app';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed');
      setIsLoading(false);
      setSelectedEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail.trim())) {
      setError('Địa chỉ email không hợp lệ (ví dụ: name@gmail.com)');
      return;
    }
    handleChoose({
      email: customEmail.trim(),
      name: customName.trim() || customEmail.trim().split('@')[0],
    });
  };

  const modalBg = isDark ? 'bg-[#1e1e1e] text-neutral-100 border-neutral-700' : 'bg-white text-gray-900 border-gray-200';
  const itemHover = isDark ? 'hover:bg-white/6 active:bg-white/10' : 'hover:bg-gray-50 active:bg-gray-100';
  const borderCol = isDark ? 'border-neutral-800' : 'border-gray-200';
  const subText = isDark ? 'text-neutral-400' : 'text-gray-500';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-[560px] border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${modalBg}`}
        >
          {/* Top Bar: Google Logo + Title + Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium tracking-wide">Sign in with Google</span>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              title="Close"
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-black hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {error && (
              <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                isDark ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!isCustomMode ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left Side: Choose an account */}
                <div className="md:col-span-2 flex flex-col justify-start">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                    Choose an account
                  </h2>
                  <p className={`text-xs sm:text-sm leading-relaxed ${subText}`}>
                    to continue to <strong className={isDark ? 'text-white' : 'text-black'}>Zero AI Note</strong>
                  </p>
                </div>

                {/* Right Side: Account List */}
                <div className="md:col-span-3 space-y-1">
                  <div className={`rounded-xl border divide-y overflow-hidden ${borderCol} ${isDark ? 'divide-neutral-800' : 'divide-gray-100'}`}>
                    {PRESET_ACCOUNTS.map((acc) => {
                      const isSelected = selectedEmail === acc.email && isLoading;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleChoose({ email: acc.email, name: acc.name })}
                          className={`w-full flex items-center gap-3.5 p-3 sm:p-3.5 text-left transition-all cursor-pointer ${itemHover} ${
                            isSelected ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${acc.avatarBg}`}>
                            {acc.avatarText}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold truncate leading-tight">{acc.name}</p>
                            <p className={`text-[11px] truncate mt-0.5 leading-tight ${subText}`}>{acc.email}</p>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    {/* Use another account button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => { setIsCustomMode(true); setError(null); }}
                      className={`w-full flex items-center gap-3.5 p-3 sm:p-3.5 text-left transition-all cursor-pointer ${itemHover}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-white/10 text-neutral-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium leading-tight">Use another account</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Custom Account Input Form */
              <form onSubmit={handleCustomSubmit} className="max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isDark ? 'border-white/10 hover:bg-white/10' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold">Sign in with your Google Account</h3>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${subText}`}>
                    Email or phone
                  </label>
                  <div className="relative">
                    <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${subText}`} />
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-all ${
                        isDark
                          ? 'bg-black/40 border-neutral-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20'
                          : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isDark ? 'bg-white/8 hover:bg-white/12' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
