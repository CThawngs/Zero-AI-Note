import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Sun, Moon, Globe, X } from 'lucide-react';
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
    setAuthMode
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authMode || 'login');

  React.useEffect(() => {
    if (authMode) {
      setActiveTab(authMode);
    }
  }, [authMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const isDark = theme === 'dark';

  // Quay lại landing page
  const goBackToLanding = () => {
    window.location.href = '/';
  };

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

        if (!res.ok) {
          throw new Error(data.error ?? 'Login failed');
        }

        // Cookies are set by the server via Set-Cookie header
        setUser(data.user);
        addToast(
          language === 'vi' ? 'Đăng nhập thành công' : 'Logged in successfully',
          language === 'vi' ? 'Chào mừng bạn quay trở lại với Zero AI Note!' : 'Welcome back to Zero AI Note!',
          'success'
        );
        setCurrentScreen('chat');
      } catch (err) {
        addToast(
          language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed',
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
            body: JSON.stringify({ email, password, displayName: email.split('@')[0] }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error ?? 'Registration failed');
          }

          setUser(data.user);
          addToast(
            language === 'vi' ? 'Đăng ký thành công' : 'Registration successful',
            language === 'vi' ? 'Chào mừng bạn đến với Zero AI Note!' : 'Welcome to Zero AI Note!',
            'success'
          );
          setCurrentScreen('chat');
        } catch (err) {
          addToast(
            language === 'vi' ? 'Đăng ký thất bại' : 'Registration failed',
            err instanceof Error ? err.message : 'Unknown error',
            'error'
          );
        } finally {
          setIsLoading(false);
        }
      };

      const handleGoogleLogin = () => {
        addToast(
          language === 'vi' ? 'Chưa hỗ trợ' : 'Not supported yet',
          language === 'vi' ? 'Google OAuth sẽ có khi Neon DB sẵn sàng.' : 'Google OAuth coming when Neon DB ready.',
          'info'
        );
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

  const bgClass = isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black';
  const cardClass = isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-50 border-gray-200';
  const inputClass = isDark ? 'bg-[#0a0a0a] border-white/10 text-white placeholder-neutral-500' : 'bg-white border-gray-200 text-black placeholder-gray-400';
  const textMuted = isDark ? 'text-neutral-400' : 'text-gray-600';
  const tabActiveClass = isDark ? 'bg-white text-black' : 'bg-black text-white';
  const tabInactiveClass = isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-black';
  const borderClass = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${bgClass}`}
      onClick={goBackToLanding}
    >
      {/* Top right Theme and Language switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Language Toggle */}
        <button
          id="login-lang-toggle"
          onClick={(e) => { e.stopPropagation(); toggleLanguage(); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${cardClass} ${textMuted} hover:opacity-80`}
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="login-theme-toggle"
          onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
          className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${cardClass} ${textMuted} hover:opacity-80`}
          title={isDark ? t('lightMode') : t('darkMode')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Ambient background glows */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-white/5' : 'bg-black/5'}`} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md border rounded-2xl shadow-xl p-6 sm:p-8 relative z-10 transition-colors duration-300 ${cardClass}`}
      >
        {/* Close button — X đỏ thoát về landing */}
        <button
          id="btn-close-auth"
          onClick={goBackToLanding}
          title={language === 'vi' ? 'Thoát' : 'Close'}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-90 hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 bg-white text-black dark:bg-white dark:text-black shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            {t('brandName')}
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>
            {language === 'vi' ? 'Ghi chú thông minh, tư duy đột phá.' : 'AI-native research & high-structure intelligence.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className={`flex p-1 rounded-xl border mb-6 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'}`}>
          <button
            id="tab-login"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
              activeTab === 'login'
                ? `${tabActiveClass} shadow-sm`
                : tabInactiveClass
            }`}
          >
            {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </button>
          <button
            id="tab-register"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 ${
              activeTab === 'register'
                ? `${tabActiveClass} shadow-sm`
                : tabInactiveClass
            }`}
          >
            {language === 'vi' ? 'Đăng ký tài khoản' : 'Sign Up'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={activeTab === 'login' ? handleSubmit : handleRegister} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${textMuted}`}>
              {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/40 transition-colors ${inputClass} ${borderClass}`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-medium ${textMuted}`}>
                {language === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              {activeTab === 'login' && (
                <button
                  type="button"
                  id="btn-forgot-password"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className={`text-xs hover:underline transition-colors cursor-pointer ${isDark ? 'text-white' : 'text-black'}`}
                >
                  {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-white/40 transition-colors ${inputClass} ${borderClass}`}
              />
              <button
                type="button"
                id="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${textMuted} hover:opacity-80`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-submit-auth"
            disabled={isLoading}
            className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-gray-800 text-white'}`}
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
            <div className={`w-full border-t ${borderClass}`} />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={`px-3 font-semibold text-xs ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'} ${textMuted}`}>
              {language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          id="btn-google-login"
          type="button"
          onClick={handleGoogleLogin}
          className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 ${borderClass} ${isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-100 text-black'}`}
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

        {/* Hint: click outside to go back */}
        <p className={`text-center text-[11px] mt-4 ${textMuted}`}>
          {language === 'vi' ? 'Bấm vào vùng tối bên ngoài hoặc dấu ✕ để quay lại trang chủ' : 'Click outside or press ✕ to return home'}
        </p>
      </motion.div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm`} onClick={(e) => { e.stopPropagation(); setIsForgotPasswordOpen(false); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl transition-colors duration-300 ${cardClass}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {language === 'vi' ? 'Khôi phục mật khẩu' : 'Password Recovery'}
              </h3>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className={`text-xs mb-4 ${textMuted}`}>
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
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-white/40 transition-colors ${inputClass} ${borderClass}`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-all ${isDark ? 'bg-white/5 text-neutral-300' : 'bg-gray-100 text-gray-600'}`}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
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
