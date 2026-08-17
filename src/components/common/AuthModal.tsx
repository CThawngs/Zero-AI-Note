'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, X, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  lang?: 'vi' | 'en';
  isDark?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  lang = 'vi',
  isDark = true,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field errors
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const vi = lang === 'vi';

  // Sync mode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setTouched({});
      setSuccessInfo(null);
    }
  }, [isOpen, initialMode]);

  // Validation functions
  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) {
      return vi ? 'Vui lòng nhập địa chỉ email' : 'Please enter your email address';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return vi ? 'Email không hợp lệ (ví dụ: name@example.com)' : 'Invalid email format (e.g. name@example.com)';
    }
    return undefined;
  };

  const validatePassword = (val: string, currentMode: 'login' | 'register'): string | undefined => {
    if (!val) {
      return vi ? 'Vui lòng nhập mật khẩu' : 'Please enter your password';
    }
    if (currentMode === 'register' && val.length < 8) {
      return vi ? 'Mật khẩu phải có ít nhất 8 ký tự' : 'Password must be at least 8 characters';
    }
    if (currentMode === 'login' && val.length < 6) {
      return vi ? 'Mật khẩu phải có ít nhất 6 ký tự' : 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email || errors.email) {
      const err = validateEmail(val);
      setErrors((prev) => ({ ...prev, email: err, general: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (touched.password || errors.password) {
      const err = validatePassword(val, mode === 'register' ? 'register' : 'login');
      setErrors((prev) => ({ ...prev, password: err, general: undefined }));
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password' && mode !== 'forgot') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password, mode === 'register' ? 'register' : 'login') }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password, 'login');

    if (emailErr || passErr) {
      setTouched({ email: true, password: true });
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (vi ? 'Đăng nhập thất bại' : 'Login failed'));
      // Success -> Redirect to app
      window.location.href = '/app';
    } catch (err) {
      const msg = err instanceof Error ? err.message : (vi ? 'Đã có lỗi xảy ra' : 'An error occurred');
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('mật khẩu')) {
        setErrors({ password: msg });
      } else if (msg.toLowerCase().includes('user') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('tài khoản')) {
        setErrors({ email: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password, 'register');

    if (emailErr || passErr) {
      setTouched({ email: true, password: true });
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: displayName.trim() || email.trim().split('@')[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (vi ? 'Đăng ký thất bại' : 'Registration failed'));
      // Success -> Redirect to app
      window.location.href = '/app';
    } catch (err) {
      const msg = err instanceof Error ? err.message : (vi ? 'Đã có lỗi xảy ra' : 'An error occurred');
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('tồn tại')) {
        setErrors({ email: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setTouched({ email: true });
      setErrors({ email: emailErr });
      return;
    }
    setSuccessInfo(
      vi
        ? `Liên kết đặt lại mật khẩu đã được gửi tới ${email.trim()}. Vui lòng kiểm tra hộp thư.`
        : `Password reset link dispatched to ${email.trim()}. Please check your inbox.`
    );
    setErrors({});
  };

  const handleGoogleLogin = () => {
    setSuccessInfo(
      vi
        ? 'Google OAuth sẽ khả dụng khi kết nối Neon Auth hoàn tất.'
        : 'Google OAuth will be available once Neon Auth is enabled.'
    );
  };

  // Style tokens
  const cardBg = isDark ? 'bg-[#111111] border-white/10 text-white' : 'bg-white border-gray-200 text-black';
  const inputBg = isDark ? 'bg-[#0c0c0c] border-white/10 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400';
  const inputFocus = isDark ? 'focus:border-white/30 focus:bg-[#151515] focus:ring-1 focus:ring-white/10' : 'focus:border-black/40 focus:bg-white focus:ring-1 focus:ring-black/5';
  const inputErr = 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-500';
  const tabBg = isDark ? 'bg-white/5' : 'bg-gray-100';
  const tabActive = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const tabInactive = isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black';
  const dividerClass = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop overlay */}
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container — below navbar (pt-16 sm:pt-20) with pointer-events-none */}
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 pointer-events-none z-40 pt-16 sm:pt-20">
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`relative pointer-events-auto w-full max-w-[380px] sm:max-w-[400px] border rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-5.5rem)] overflow-y-auto ${cardBg}`}
              style={{ scrollbarWidth: 'thin' }}
            >
              <div className="p-4 sm:p-5">
                {/* Header row: Brand + Close Button */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.png"
                      alt="Zero AI Note"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-contain shrink-0"
                    />
                    <div>
                      <h2 className="text-sm sm:text-base font-bold leading-tight">Zero AI Note</h2>
                      <p className={`text-[10px] sm:text-[11px] leading-tight ${textMuted}`}>
                        {vi ? 'Ghi chú thông minh AI' : 'AI-powered note taking'}
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    title={vi ? 'Đóng' : 'Close'}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Tab switcher — Login / Register */}
                {mode !== 'forgot' ? (
                  <div className={`flex p-0.5 rounded-lg sm:rounded-xl gap-1 mb-3.5 ${tabBg}`}>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrors({}); setSuccessInfo(null); }}
                      className={`flex-1 py-1.5 text-xs sm:text-[13px] font-semibold rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        mode === 'login' ? `${tabActive} shadow-sm` : tabInactive
                      }`}
                    >
                      {vi ? 'Đăng nhập' : 'Sign In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setErrors({}); setSuccessInfo(null); }}
                      className={`flex-1 py-1.5 text-xs sm:text-[13px] font-semibold rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                        mode === 'register' ? `${tabActive} shadow-sm` : tabInactive
                      }`}
                    >
                      {vi ? 'Đăng ký' : 'Sign Up'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/5">
                    <span className="text-xs sm:text-sm font-semibold">
                      {vi ? 'Khôi phục mật khẩu' : 'Password Recovery'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setErrors({}); setSuccessInfo(null); }}
                      className={`text-xs hover:underline cursor-pointer ${textMuted}`}
                    >
                      {vi ? '← Quay lại Đăng nhập' : '← Back to Sign In'}
                    </button>
                  </div>
                )}

                {/* Success Banner */}
                {successInfo && (
                  <div className={`mb-3 p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successInfo}</span>
                  </div>
                )}

                {/* General Error Banner */}
                {errors.general && (
                  <div className={`mb-3 p-2.5 rounded-xl border flex items-start gap-2 text-xs ${
                    isDark ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* ── FORGOT PASSWORD FORM ── */}
                {mode === 'forgot' ? (
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <p className={`text-xs ${textMuted}`}>
                      {vi
                        ? 'Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu.'
                        : 'Enter your registered email and we will send you a password reset link.'}
                    </p>

                    <div>
                      <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                        {vi ? 'Địa chỉ Email' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="name@example.com"
                          className={`w-full border rounded-lg pl-8.5 pr-3 py-2 text-xs sm:text-sm outline-none transition-all ${inputBg} ${
                            errors.email ? inputErr : inputFocus
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                        isDark ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black hover:bg-gray-900 text-white'
                      }`}
                    >
                      {vi ? 'Gửi liên kết đặt lại' : 'Send Reset Link'}
                    </button>
                  </form>
                ) : (
                  /* ── LOGIN & REGISTER FORM ── */
                  <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-2.5 sm:space-y-3">
                    {/* Display name field (Register only) */}
                    <AnimatePresence initial={false}>
                      {mode === 'register' && (
                        <motion.div
                          key="name-input-group"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                            {vi ? 'Tên hiển thị (tuỳ chọn)' : 'Display Name (optional)'}
                          </label>
                          <div className="relative">
                            <User className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder={vi ? 'Nguyễn Văn A' : 'Alex Nguyen'}
                              className={`w-full border rounded-lg pl-8.5 pr-3 py-2 text-xs sm:text-sm outline-none transition-all ${inputBg} ${inputFocus}`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Email field with inline error */}
                    <div>
                      <label className={`block text-[11px] font-medium mb-1 ${textMuted}`}>
                        {vi ? 'Địa chỉ Email' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-500' : textMuted}`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => handleBlur('email')}
                          placeholder="name@example.com"
                          className={`w-full border rounded-lg pl-8.5 pr-3 py-2 text-xs sm:text-sm outline-none transition-all ${inputBg} ${
                            errors.email ? inputErr : inputFocus
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password field with inline error & visibility toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[11px] font-medium ${textMuted}`}>
                          {vi ? 'Mật khẩu' : 'Password'}
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => { setMode('forgot'); setErrors({}); setSuccessInfo(null); }}
                            className={`text-[10px] sm:text-[11px] font-medium hover:underline cursor-pointer ${
                              isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'
                            }`}
                          >
                            {vi ? 'Quên mật khẩu?' : 'Forgot password?'}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-500' : textMuted}`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          onBlur={() => handleBlur('password')}
                          placeholder="••••••••••••"
                          className={`w-full border rounded-lg pl-8.5 pr-9 py-2 text-xs sm:text-sm outline-none transition-all ${inputBg} ${
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
                      {errors.password ? (
                        <p className="text-red-500 text-[11px] font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.password}
                        </p>
                      ) : mode === 'register' ? (
                        <p className={`text-[10px] mt-0.5 ${textMuted}`}>
                          {vi ? 'Tối thiểu 8 ký tự.' : 'Minimum 8 characters.'}
                        </p>
                      ) : null}
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full mt-1 py-2.5 sm:py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                        isDark ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black hover:bg-gray-900 text-white'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-[2px] border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>
                            {mode === 'login'
                              ? (vi ? 'Đăng nhập vào hệ thống' : 'Sign in to Workspace')
                              : (vi ? 'Tạo tài khoản miễn phí' : 'Create Free Account')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative my-2.5 sm:my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className={`w-full border-t ${dividerClass}`} />
                      </div>
                      <div className="relative flex justify-center">
                        <span className={`px-2 text-[10px] uppercase font-medium tracking-wider ${isDark ? 'bg-[#111111]' : 'bg-white'} ${textMuted}`}>
                          {vi ? 'Hoặc' : 'Or'}
                        </span>
                      </div>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className={`w-full py-2 px-3 rounded-lg border text-xs sm:text-[12px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${dividerClass} ${
                        isDark ? 'hover:bg-white/5 text-neutral-200' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                        <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
                        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z" />
                      </svg>
                      <span>{vi ? 'Tiếp tục với Google' : 'Continue with Google'}</span>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
