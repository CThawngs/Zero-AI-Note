import React, { useState } from 'react';
import { 
  ChevronDown, 
  Globe, 
  Sparkles, 
  Bell, 
  Share2, 
  Crown,
  Check,
  Cpu,
  Menu,
  Sun,
  Moon,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { 
    selectedModel, 
    setSelectedModel, 
    aiProviders,
    selectedLanguage, 
    setSelectedLanguage,
    isProcessingChat,
    user,
    setCurrentScreen,
    setSettingsActiveTab,
    addToast,
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    setIsMobileSidebarOpen
  } = useApp();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Dynamic models derived exclusively from configured AI Providers
  const configuredModels = aiProviders.map(p => ({
    name: p.defaultModel,
    provider: p.name,
    providerId: p.providerId,
    status: p.status,
    latency: p.latencyMs,
    badge: p.status === 'active' ? `${p.latencyMs}ms` : (language === 'vi' ? 'Tạm tắt' : 'Disabled')
  }));

  const activeModels = configuredModels.filter(m => m.status === 'active');

  const availableLanguages = [
    { name: 'Tiếng Việt', code: 'vi' as const, flag: '🇻🇳' },
    { name: 'English', code: 'en' as const, flag: '🇺🇸' }
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast(t('copied'), t('toastCopied'));
  };

  const isDark = theme === 'dark';

  // Display text for model button
  const currentModelDisplay = selectedModel || (configuredModels.length > 0 ? configuredModels[0].name : (language === 'vi' ? 'Chưa cấu hình Model' : 'No Model Configured'));

  return (
    <header className={`h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 transition-colors duration-250 border-b ${
      isDark 
        ? 'bg-[var(--bg-card)]/95 border-[var(--border-color)] text-[var(--text-primary)]' 
        : 'bg-[var(--bg-card)]/95 border-[var(--border-color)] text-[var(--text-primary)] shadow-xs'
    } backdrop-blur-md`}>
      {/* Left side: Mobile Menu Button & Model/Language Selectors */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile / Tablet Hamburger Button (< 1024px) */}
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`lg:hidden min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 flex items-center justify-center rounded-xl border transition-colors cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
              : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]'
          }`}
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* AI Engine Model Dropdown (Dynamic from configured AI Providers) */}
        <div className="relative">
          <button
            id="header-model-selector"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer active:scale-[0.98] ${
              isDark 
                ? 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
                : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0 text-[var(--accent-primary)]" />
            <span className="max-w-[110px] sm:max-w-[160px] truncate">{currentModelDisplay}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
          </button>

          <AnimatePresence>
            {isModelDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsModelDropdownOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 mt-1.5 w-72 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 border ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                  }`}
                >
                  <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>{t('modelSelectorLabel')}</span>
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                      {configuredModels.length} {language === 'vi' ? 'nhà cung cấp' : 'providers'}
                    </span>
                  </div>

                  {configuredModels.length === 0 ? (
                    /* Empty state khi chưa thêm Provider nào */
                    <div className="p-4 text-center space-y-2.5">
                      <div className="w-9 h-9 mx-auto rounded-full flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-muted)]">
                        <AlertCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {language === 'vi' ? 'Chưa có Provider AI nào' : 'No AI Providers configured'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          {language === 'vi' 
                            ? 'Thêm Provider AI trong Cài đặt để bắt đầu' 
                            : 'Add an AI Provider in Settings to start'}
                        </p>
                      </div>
                      <button
                        id="btn-goto-add-provider"
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setCurrentScreen('settings');
                          setSettingsActiveTab('ai-providers');
                        }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? '+ Thêm Provider AI' : '+ Add AI Provider'}</span>
                      </button>
                    </div>
                  ) : (
                    /* Danh sách model từ các AI Provider thực tế đã cấu hình */
                    <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {configuredModels.map((m) => {
                        const isSelected = selectedModel === m.name;
                        const isInactive = m.status === 'inactive';
                        return (
                          <button
                            key={`${m.providerId}-${m.name}`}
                            id={`model-option-${m.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                            disabled={isInactive}
                            onClick={() => {
                              setSelectedModel(m.name);
                              setIsModelDropdownOpen(false);
                              addToast(
                                language === 'vi' ? 'Đã đổi mô hình AI' : 'Model Switched', 
                                `${m.name} (${m.provider})`, 
                                'info'
                              );
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                              isInactive 
                                ? 'opacity-50 cursor-not-allowed bg-transparent'
                                : isSelected
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-semibold' 
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <div className="text-left min-w-0 pr-2">
                              <p className="font-semibold truncate">{m.name}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{m.provider}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                isInactive 
                                  ? 'bg-[var(--bg-app)] text-[var(--text-muted)]'
                                  : 'bg-[var(--bg-hover)] text-[var(--accent-primary)]'
                              }`}>
                                {m.badge}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {configuredModels.length > 0 && (
                    <div className="pt-1 border-t border-[var(--border-color)]">
                      <button
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setCurrentScreen('settings');
                          setSettingsActiveTab('ai-providers');
                        }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-[var(--accent-primary)] hover:underline cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Quản lý AI Providers trong Cài đặt' : 'Manage Providers in Settings'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            id="header-language-selector"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer active:scale-[0.98] ${
              isDark 
                ? 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
                : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="font-semibold">{language.toUpperCase()}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
          </button>

          <AnimatePresence>
            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsLangDropdownOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 mt-1.5 w-36 rounded-xl shadow-2xl p-1 z-40 space-y-0.5 border ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                  }`}
                >
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      id={`lang-option-${lang.code}`}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        language === lang.code
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold' 
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {language === lang.code && <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Live Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-app)]">
          <span className={`w-2 h-2 rounded-full ${
            isProcessingChat ? 'bg-[var(--accent-primary)] animate-ping' : 'bg-[var(--status-success)]'
          }`} />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            {isProcessingChat ? t('processing') : t('ready')}
          </span>
        </div>
      </div>

      {/* Right side: Theme Toggle + Pro Upgrade + Notifications + Share */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick Theme Toggle Button in Header */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--bg-hover)]"
          title={isDark ? t('lightMode') : t('darkMode')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {user.plan === 'FREE' && (
          <button
            id="header-upgrade-btn"
            onClick={() => setCurrentScreen('pricing')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 bg-[var(--accent-subtle)] border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
          >
            <Crown className="w-3.5 h-3.5 shrink-0 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">{t('upgradePro')}</span>
            <span className="sm:hidden">Pro</span>
          </button>
        )}

        {/* Notifications */}
        <button
          id="header-notifications-btn"
          onClick={() => setCurrentScreen('settings')}
          className="p-2 rounded-xl border transition-colors relative cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          title={t('notifications')}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 bg-[var(--accent-primary)] ring-[var(--accent-primary)]/30" />
        </button>

        {/* Share Button */}
        <button
          id="header-share-workspace-btn"
          onClick={handleShare}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer active:scale-95 bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t('share')}</span>
        </button>
      </div>
    </header>
  );
};
