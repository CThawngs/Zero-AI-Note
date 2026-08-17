'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';

export const SetPasswordModal: React.FC = () => {
  const { user, setUser, theme, language, addToast } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});

  const isDark = theme === 'dark';
  const vi = language === 'vi';

  // Only show if user is logged in and needs password setup
  const isOpen = Boolean(user.id && user.needsPasswordSetup);

  if (!isOpen) return null;

  const validate = () => {
    const errs: typeof errors = {};
    if (!password) {
      errs.password = vi ? 'Vui lòng nhập mật khẩu mới' : 'Please enter a new password';
    } else if (password.length < 8) {
      errs.password = vi ? 'Mật khẩu phải có ít nhất 8 ký tự' : 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = vi ? 'Vui lòng xác nhận mật khẩu' : 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errs.confirmPassword = vi ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (vi ? 'Thiết lập mật khẩu thất bại' : 'Failed to set password'));

      setIsSuccess(true);
      addToast(
        vi ? 'Thiết lập mật khẩu thành công' : 'Password set successfully',
        vi ? 'Bạn có thể dùng mật khẩu này để đăng nhập trực tiếp bất cứ lúc nào.' : 'You can now use this password to sign in directly anytime.',
        'success'
      );
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Error setting password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    setUser((prev) => ({ ...prev, needsPasswordSetup: false }));
  };

  // Styles
  const cardBg = isDark ? 'bg-[#111111] border-white/15 text-white' : 'bg-white border-gray-200 text-black';
  const inputBg = isDark ? 'bg-[#0c0c0c] border-white/10 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400';
  const inputFocus = isDark ? 'focus:border-white/30 focus:bg-[#151515] focus:ring-1 focus:ring-white/10' : 'focus:border-black/40 focus:bg-white focus:ring-1 focus:ring-black/5';
  const inputErr = 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-500';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[420px] border rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 ${cardBg}`}
        >
          {/* Header Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isSuccess
                ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isDark ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {isSuccess
                  ? (vi ? 'Thiết lập mật khẩu thành công!' : 'Password Set Successfully!')
                  : (vi ? 'Thiết lập mật khẩu tài khoản' : 'Set Account Password')}
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${textMuted}`}>
                {user.email}
              </p>
            </div>
          </div>

          {!isSuccess ? (
            <>
              <p className={`text-xs leading-relaxed mb-4 p-3 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/8 text-neutral-300' : 'bg-gray-50 border-gray-100 text-gray-700'
              }`}>
                {vi
                  ? 'Bạn đã đăng nhập bằng Google. Vui lòng tạo mật khẩu bảo mật (tối thiểu 8 ký tự) để có thể đăng nhập bằng email & mật khẩu bất cứ lúc nào.'
                  : 'You signed in with Google. Please set a secure password (min 8 chars) so you can also sign in via email & password.'}
              </p>

              {errors.general && (
                <div className={`mb-3 p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
                  isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSetPassword} className="space-y-3">
                {/* New Password */}
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                    {vi ? 'Mật khẩu mới' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-500' : textMuted}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full border rounded-lg pl-8.5 pr-9 py-2.5 text-xs sm:text-sm outline-none transition-all ${inputBg} ${
                        errors.password ? inputErr : inputFocus
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer ${textMuted} hover:opacity-80`}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                    {vi ? 'Xác nhận lại mật khẩu' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <Lock className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-500' : textMuted}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="••••••••••••"
                      className={`w-full border rounded-lg pl-8.5 pr-3 py-2.5 text-xs sm:text-sm outline-none transition-all ${inputBg} ${
                        errors.confirmPassword ? inputErr : inputFocus
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                    isDark ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black hover:bg-gray-900 text-white'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-[2px] border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{vi ? 'Lưu mật khẩu & Tiếp tục' : 'Save Password & Continue'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success confirmation screen */
            <div className="space-y-4 pt-1">
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                {vi
                  ? 'Mật khẩu của bạn đã được cập nhật an toàn vào hệ thống. Giờ đây bạn có thể bắt đầu sử dụng Zero AI Note hoặc đăng nhập bằng cả Google lẫn Email/Mật khẩu.'
                  : 'Your password has been securely saved. You can now use Zero AI Note and sign in via either Google or Email/Password.'}
              </p>

              <button
                type="button"
                onClick={handleComplete}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                  isDark ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black hover:bg-gray-900 text-white'
                }`}
              >
                <span>{vi ? 'Bắt đầu sử dụng Zero AI Note →' : 'Start using Zero AI Note →'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
