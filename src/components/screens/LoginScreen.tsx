import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sun, Moon, Globe, X, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginScreen: React.FC = () => {
  const {
    setCurrentScreen,
    setUser,
    addToast,
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    t,
    authMode,
    setAuthMode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authMode || 'login');

  React.useEffect(() => {
    if (authMode) setActiveTab(authMode);
  }, [authMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const vi = language === 'vi';

  const goBackToLanding = () => { window.location.href = '/'; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      setUser(data.user);
      addToast(
        vi ? 'Đăng nhập thành công' : 'Logged in successfully',
        vi ? 'Chào mừng bạn quay trở lại với Zero AI Note!' : 'Welcome back to Zero AI Note!',
        'success'
      );
      setCurrentScreen('chat');
    } catch (err) {
      addToast(
        vi ? 'Đăng nhập thất bại' : 'Login failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: displayName || email.split('@')[0] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');
      setUser(data.user);
      addToast(
        vi ? 'Đăng ký thành công' : 'Registration successful',
        vi ? 'Chào mừng bạn đến với Zero AI Note!' : 'Welcome to Zero AI Note!',
        'success'
      );
      setCurrentScreen('chat');
    } catch (err) {
      addToast(
        vi ? 'Đăng ký thất bại' : 'Registration failed',
        err instanceof Error ? err.message : 'Unknown error',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    addToast(
      vi ? 'Chưa hỗ trợ' : 'Not supported yet',
      vi ? 'Google OAuth sẽ có khi Neon DB sẵn sàng.' : 'Google OAuth coming when Neon DB ready.',
      'info'
    );
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotPasswordOpen(false);
    addToast(
      vi ? 'Đã gửi email khôi phục' : 'Recovery email dispatched',
      vi ? `Liên kết đặt lại mật khẩu đã gửi tới ${forgotEmail || email}.` : `Password reset link sent to ${forgotEmail || email}.`,
      'info'
    );
  };

  // ── Derived style tokens ──────────────────────────────────────────────────
  const bg         = isDark ? 'bg-[#080808]'             : 'bg-[#f5f5f5]';
  const card       = isDark ? 'bg-[#111111] border-white/8' : 'bg-white border-gray-200/80';
  const inputBg    = isDark ? 'bg-[#0c0c0c] border-white/10 text-white placeholder-neutral-600'
                            : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400';
  const inputFocus = isDark ? 'focus:border-white/30 focus:bg-[#111] focus:ring-2 focus:ring-white/5'
                            : 'focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-black/5';
  const muted      = isDark ? 'text-neutral-500'           : 'text-gray-500';
  const sub        = isDark ? 'text-neutral-400'           : 'text-gray-600';
  const divider    = isDark ? 'border-white/8'             : 'border-gray-200';
  const tabBg      = isDark ? 'bg-white/5'                 : 'bg-gray-100';
  const tabActive  = isDark ? 'bg-white text-black'       : 'bg-black text-white';
  const tabInactive = isDark ? 'text-neutral-400 hover:text-neutral-200' : 'text-gray-500 hover:text-gray-800';

  // ── Input field component ─────────────────────────────────────────────────
  const InputField = ({
    id, type = 'text', label, placeholder, value, onChange, icon: Icon, rightSlot, rightSlot2
  }: {
    id: string; type?: string; label: string; placeholder: string;
    value: string; onChange: (v: string) => void;
    icon: React.FC<{ className?: string }>;
    rightSlot?: React.ReactNode; rightSlot2?: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={id} className={`block text-[11px] sm:text-xs font-medium mb-1 ${sub}`}>{label}</label>
      <div className="relative group">
        <Icon className={`w-3.5 h-3.5 sm:w-[15px] sm:h-[15px] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
          focusedField === id ? (isDark ? 'text-neutral-300' : 'text-gray-600') : (isDark ? 'text-neutral-600' : 'text-gray-400')
        }`} />
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedField(id)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          className={`w-full border rounded-lg sm:rounded-xl pl-8 sm:pl-9.5 ${rightSlot ? 'pr-9 sm:pr-10' : 'pr-3 sm:pr-4'} py-2 sm:py-2.5 text-xs sm:text-sm outline-none transition-all duration-200 ${inputBg} ${inputFocus}`}
        />
        {rightSlot}
        {rightSlot2}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 ${bg} transition-colors duration-300 relative overflow-hidden`}
      onClick={goBackToLanding}
    >
      {/* Ambient glows */}
      <div className={`absolute -top-48 -left-48 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-50 ${isDark ? 'bg-white/3' : 'bg-black/3'}`} />
      <div className={`absolute -bottom-48 -right-48 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-50 ${isDark ? 'bg-white/3' : 'bg-black/3'}`} />

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5">
        <button
          id="login-lang-toggle"
          onClick={(e) => { e.stopPropagation(); toggleLanguage(); }}
          className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer active:scale-95 ${card} ${sub} hover:opacity-80`}
        >
          <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{language.toUpperCase()}</span>
        </button>
        <button
          id="login-theme-toggle"
          onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
          className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer active:scale-95 ${card} ${sub} hover:opacity-80`}
          title={isDark ? t('lightMode') : t('darkMode')}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>

      {/* Card — with max-height & clean scrolling for compact viewport optimization */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full max-w-[390px] sm:max-w-[420px] max-h-[calc(100vh-2rem)] sm:max-h-[92vh] overflow-y-auto border rounded-xl sm:rounded-2xl shadow-2xl ${card}`}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Close button */}
        <button
          id="btn-close-auth"
          onClick={goBackToLanding}
          title={vi ? 'Thoát' : 'Close'}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
            isDark ? 'text-neutral-500 hover:text-neutral-200 hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="p-4 sm:p-5 md:p-6">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
            <img
              src="/logo.png"
              alt="Zero AI Note Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-contain flex-shrink-0"
            />
            <div>
              <h1 className={`text-sm sm:text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {t('brandName')}
              </h1>
              <p className={`text-[10px] sm:text-[11px] leading-tight mt-0.5 ${muted}`}>
                {vi ? 'Ghi chú thông minh với AI' : 'AI-powered note taking'}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className={`flex p-0.5 sm:p-1 rounded-lg sm:rounded-xl gap-1 mb-3.5 sm:mb-4 ${tabBg}`}>
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  activeTab === tab ? `${tabActive} shadow-sm` : tabInactive
                }`}
              >
                {tab === 'login'
                  ? (vi ? 'Đăng nhập' : 'Sign In')
                  : (vi ? 'Đăng ký' : 'Sign Up')}
              </button>
            ))}
          </div>

          {/* Welcome text */}
          <div className="mb-3 sm:mb-4">
            <h2 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {activeTab === 'login'
                ? (vi ? 'Chào mừng trở lại 👋' : 'Welcome back 👋')
                : (vi ? 'Tạo tài khoản mới ✨' : 'Create your account ✨')}
            </h2>
            <p className={`text-[11px] sm:text-xs mt-0.5 ${muted}`}>
              {activeTab === 'login'
                ? (vi ? 'Đăng nhập để tiếp tục ghi chú của bạn.' : 'Sign in to continue your notes.')
                : (vi ? 'Bắt đầu miễn phí, không cần thẻ tín dụng.' : 'Start free, no credit card required.')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={activeTab === 'login' ? handleSubmit : handleRegister} className="space-y-2.5 sm:space-y-3">
            {/* Display name — only on register */}
            <AnimatePresence initial={false}>
              {activeTab === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <InputField
                    id="register-name-input"
                    label={vi ? 'Tên hiển thị (tuỳ chọn)' : 'Display name (optional)'}
                    placeholder={vi ? 'Nguyễn Văn A' : 'Your full name'}
                    value={displayName}
                    onChange={setDisplayName}
                    icon={User}
                    type="text"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <InputField
              id="login-email-input"
              type="email"
              label={vi ? 'Địa chỉ Email' : 'Email Address'}
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              icon={Mail}
            />

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password-input" className={`text-[11px] sm:text-xs font-medium ${sub}`}>
                  {vi ? 'Mật khẩu' : 'Password'}
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    id="btn-forgot-password"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className={`text-[10px] sm:text-[11px] font-medium hover:underline transition-colors cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                  >
                    {vi ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className={`w-3.5 h-3.5 sm:w-[15px] sm:h-[15px] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  focusedField === 'login-password-input' ? (isDark ? 'text-neutral-300' : 'text-gray-600') : (isDark ? 'text-neutral-600' : 'text-gray-400')
                }`} />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('login-password-input')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••••"
                  className={`w-full border rounded-lg sm:rounded-xl pl-8 sm:pl-9.5 pr-9 sm:pr-10 py-2 sm:py-2.5 text-xs sm:text-sm outline-none transition-all duration-200 ${inputBg} ${inputFocus}`}
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${muted} hover:opacity-80`}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
              {activeTab === 'register' && (
                <p className={`text-[10px] sm:text-[11px] mt-1 ${muted}`}>
                  {vi ? 'Tối thiểu 8 ký tự.' : 'Minimum 8 characters.'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="btn-submit-auth"
              disabled={isLoading}
              className={`w-full mt-1 py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-[13px] flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                isDark ? 'bg-white hover:bg-neutral-100 text-black' : 'bg-black hover:bg-gray-900 text-white'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-[2px] border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {activeTab === 'login'
                      ? (vi ? 'Đăng nhập' : 'Sign In')
                      : (vi ? 'Tạo tài khoản miễn phí' : 'Create Free Account')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3 sm:my-4">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${divider}`} />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-2.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider ${isDark ? 'bg-[#111111]' : 'bg-white'} ${muted}`}>
                {vi ? 'Hoặc tiếp tục với' : 'Or continue with'}
              </span>
            </div>
          </div>

          {/* Google */}
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
            className={`w-full py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl border text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${divider} ${
              isDark ? 'hover:bg-white/5 text-neutral-200' : 'hover:bg-gray-50 text-gray-800'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z" />
            </svg>
            <span>{vi ? 'Đăng nhập với Google' : 'Sign in with Google'}</span>
          </button>

          {/* Footer hint */}
          <p className={`text-center text-[10px] sm:text-[11px] mt-3 ${muted}`}>
            {vi ? 'Nhấn bên ngoài hoặc dấu ✕ để quay về trang chủ' : 'Click outside or ✕ to return home'}
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <motion.div
            key="forgot-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setIsForgotPasswordOpen(false); }}
          >
            <motion.div
              key="forgot-card"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl ${card}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    {vi ? 'Khôi phục mật khẩu' : 'Password Recovery'}
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${muted}`}>
                    {vi ? 'Chúng tôi sẽ gửi link đặt lại mật khẩu ngay.' : "We'll send a reset link immediately."}
                  </p>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isDark ? 'text-neutral-500 hover:text-neutral-200 hover:bg-white/8' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-2.5">
                <div className="relative">
                  <Mail className={`w-3.5 h-3.5 sm:w-[15px] sm:h-[15px] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full border rounded-lg sm:rounded-xl pl-8 sm:pl-9.5 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none transition-all duration-200 ${inputBg} ${inputFocus}`}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className={`flex-1 py-2 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-medium cursor-pointer active:scale-[0.98] transition-all ${
                      isDark ? 'bg-white/6 text-neutral-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-semibold cursor-pointer active:scale-[0.98] transition-all ${
                      isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    {vi ? 'Gửi mã xác nhận' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
