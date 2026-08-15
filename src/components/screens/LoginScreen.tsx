import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Sun, Moon, Globe } from 'lucide-react';
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
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setUser(prev => ({
        ...prev,
        email: email || prev.email,
        name: email.split('@')[0] || 'Zero User'
      }));
      addToast(
        language === 'vi' ? 'Đăng nhập thành công' : 'Logged in successfully',
        language === 'vi' ? 'Chào mừng bạn quay trở lại với Zero AI Note!' : 'Welcome back to Zero AI Note!',
        'success'
      );
      setCurrentScreen('chat');
    }, 800);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setUser(prev => ({
        ...prev,
        name: 'Zero User',
        email: 'user.google@gmail.com'
      }));
      addToast(
        language === 'vi' ? 'Đăng nhập Google thành công' : 'Google Auth Successful',
        language === 'vi' ? 'Xác thực qua tài khoản Google hoàn tất.' : 'Google account verified successfully.',
        'success'
      );
      setCurrentScreen('chat');
    }, 700);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotPasswordOpen(false);
    addToast(
      language === 'vi' ? 'Đã gửi email khôi phục' : 'Recovery email dispatched',
      language === 'vi' ? `Liên kết đặt lại mật khẩu đã gửi tới ${forgotEmail || email}.` : `Password reset link sent to ${forgotEmail || email}.`,
      'info'
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-250 bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top right Theme and Language switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Language Toggle */}
        <button
          id="login-lang-toggle"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-2xs"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="login-theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-xl border transition-all cursor-pointer active:scale-95 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--bg-hover)] shadow-2xs"
          title={isDark ? t('lightMode') : t('darkMode')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--accent-hover)]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md border rounded-2xl shadow-xl p-6 sm:p-8 relative z-10 transition-colors duration-250 bg-[var(--bg-card)] border-[var(--border-color)]"
      >
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl accent-gradient shadow-md shadow-[var(--accent-primary)]/20 mb-4 text-[var(--accent-text)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {t('brandName')}
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[var(--text-secondary)]">
            {language === 'vi' ? 'Ghi chú thông minh, tư duy đột phá.' : 'AI-native research & high-structure intelligence.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 rounded-xl border mb-6 bg-[var(--bg-app)] border-[var(--border-color)]">
          <button
            id="tab-login"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-97 ${
              activeTab === 'login'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </button>
          <button
            id="tab-register"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-97 ${
              activeTab === 'register'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {language === 'vi' ? 'Đăng ký tài khoản' : 'Sign Up'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[var(--text-secondary)]">
              {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {language === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[var(--accent-primary)] hover:underline transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
              <button
                type="button"
                id="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-auth"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 active:scale-97 text-[var(--accent-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[var(--accent-primary)]/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {activeTab === 'login' 
                    ? (language === 'vi' ? 'Đăng nhập vào hệ thống' : 'Sign in to Workspace') 
                    : (language === 'vi' ? 'Tạo tài khoản mới' : 'Create Free Account')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-3 font-semibold text-xs bg-[var(--bg-card)] text-[var(--text-muted)]">
              {language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          id="btn-google-login"
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-97 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
            />
          </svg>
          <span>{language === 'vi' ? 'Đăng nhập với Google' : 'Sign in with Google'}</span>
        </button>
      </motion.div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm border rounded-2xl p-6 shadow-2xl transition-colors duration-250 bg-[var(--bg-card)] border-[var(--border-color)]"
          >
            <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">
              {language === 'vi' ? 'Khôi phục mật khẩu' : 'Password Recovery'}
            </h3>
            <p className="text-xs mb-4 text-[var(--text-secondary)]">
              {language === 'vi' 
                ? 'Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu trong 1 phút.'
                : 'Enter your registered email address. We will send you instructions immediately.'}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  {language === 'vi' ? 'Gửi mã xác nhận' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
