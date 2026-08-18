'use client';

import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  ChevronDown, 
  Bell, 
  Sun, 
  Moon, 
  Crown, 
  Share2, 
  Check, 
  Menu,
  PlusCircle,
  Zap,
  Search,
  Sparkles,
  ShieldCheck,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { SYSTEM_GEMINI_MODELS, ModelCatalogItem } from '../../data/modelCatalog';

export const Header: React.FC = () => {
  const { 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    user, 
    setCurrentScreen, 
    setSettingsActiveTab,
    selectedModel, 
    setSelectedModel, 
    aiProviders,
    setIsMobileSidebarOpen,
    addToast,
    t
  } = useApp();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  const notifications = [
    { id: 1, title: 'Server Upgrade', content: 'The AI server is undergoing an upgrade to enhance performance and stability.', time: '2 mins ago', flag: 'red' },
    { id: 2, title: 'New Template', content: 'A new research template has been added to your library.', time: '1 hour ago', flag: 'green' },
    { id: 3, title: 'Quota Warning', content: 'You have used 80% of your monthly AI quota. Consider upgrading to the Pro plan for more.', time: '3 hours ago', flag: 'orange' },
    { id: 4, title: 'Export Ready', content: 'Your document export is processing and will be ready for download shortly.', time: '5 hours ago', flag: 'blue' },
    { id: 5, title: 'Update Available', content: 'Version 2.1 is now available. Click to update for new features.', time: '1 day ago', flag: 'orange' },
    { id: 6, title: 'Welcome', content: 'Welcome to Zero AI Note. Start by creating your first research project.', time: '2 days ago', flag: 'green' },
  ];

  // Custom models derived from user's configured BYOK providers
  const customModels: ModelCatalogItem[] = useMemo(() => {
    return aiProviders.map(p => ({
      id: p.defaultModel,
      name: p.defaultModel,
      provider: p.name,
      providerId: p.providerId,
      description: `Endpoint: ${p.endpointUrl}`,
      badge: p.status === 'active' ? `${p.latencyMs}ms` : (language === 'vi' ? 'Tạm tắt' : 'Disabled'),
      isSystem: false,
      status: p.status,
    }));
  }, [aiProviders, language]);

  // All combined available models
  const allModels: ModelCatalogItem[] = useMemo(() => {
    return [...SYSTEM_GEMINI_MODELS, ...customModels];
  }, [customModels]);

  // Currently selected model object
  const currentModel = useMemo(() => {
    if (!selectedModel) return SYSTEM_GEMINI_MODELS[0];
    return allModels.find(m => m.id === selectedModel || m.name === selectedModel) || SYSTEM_GEMINI_MODELS[0];
  }, [allModels, selectedModel]);

  // Filtered models based on search query
  const filteredSystemModels = useMemo(() => {
    if (!modelSearchQuery.trim()) return SYSTEM_GEMINI_MODELS;
    const q = modelSearchQuery.toLowerCase();
    return SYSTEM_GEMINI_MODELS.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }, [modelSearchQuery]);

  const filteredCustomModels = useMemo(() => {
    if (!modelSearchQuery.trim()) return customModels;
    const q = modelSearchQuery.toLowerCase();
    return customModels.filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q));
  }, [customModels, modelSearchQuery]);

  const availableLanguages = [
    { name: 'Tiếng Việt', code: 'vi' as const, flag: '🇻🇳' },
    { name: 'English', code: 'en' as const, flag: '🇺🇸' }
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast(t('copied'), t('toastCopied'));
  };

  const isDark = theme === 'dark';

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

        {/* AI Engine Model Dropdown (Full Gemini Suite + Custom BYOK) */}
        <div className="relative">
          <button
            id="header-model-selector"
            onClick={() => {
              setIsModelDropdownOpen(!isModelDropdownOpen);
              setModelSearchQuery('');
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer active:scale-[0.98] bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-[var(--accent-primary)]" />
            <span className="max-w-[130px] sm:max-w-[210px] truncate font-semibold">
              {currentModel.name}
            </span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold">
              {currentModel.badge}
            </span>
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
                  className={`absolute left-0 mt-1.5 w-84 sm:w-96 rounded-2xl shadow-2xl p-2.5 z-40 space-y-2.5 border ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                  }`}
                >
                  {/* Header & Total Count */}
                  <div className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>{t('modelSelectorLabel')}</span>
                    <span className="text-[11px] font-normal text-[var(--text-muted)]">
                      {allModels.length} {language === 'vi' ? 'mô hình LLM' : 'LLM models'}
                    </span>
                  </div>

                  {/* Search Filter Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder={language === 'vi' ? 'Tìm kiếm mô hình Gemini, GPT, Claude, Llama...' : 'Search Gemini, GPT, Claude, Llama...'}
                      className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                      autoFocus
                    />
                  </div>

                  {/* Model List Container */}
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-0.5">
                    {/* Section 1: System Gemini Suite (Free Pool) */}
                    {filteredSystemModels.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                          <Zap className="w-3 h-3" />
                          <span>Google AI Studio (Gemini Free Pool)</span>
                        </div>

                        {filteredSystemModels.map((m) => {
                          const isSelected = (selectedModel === m.id || selectedModel === m.name) || (!selectedModel && m.id === 'gemini-2.0-flash');
                          return (
                            <button
                              key={m.id}
                              id={`model-option-${m.id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setIsModelDropdownOpen(false);
                                addToast(
                                  language === 'vi' ? 'Đã chọn mô hình Gemini' : 'Gemini Model Selected', 
                                  m.name, 
                                  'info'
                                );
                              }}
                              className={`w-full flex items-start justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-semibold' 
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              <div className="text-left min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold truncate">{m.name}</p>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5 line-clamp-1">
                                  {m.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-[var(--bg-hover)] text-[var(--accent-primary)]">
                                  {m.badge}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Section 2: Custom BYOK Providers */}
                    {customModels.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                          <Server className="w-3 h-3 text-[var(--accent-primary)]" />
                          <span>{language === 'vi' ? 'Nhà cung cấp riêng của bạn (BYOK)' : 'Your BYOK Providers'}</span>
                        </div>

                        {filteredCustomModels.map((m) => {
                          const isSelected = selectedModel === m.id || selectedModel === m.name;
                          return (
                            <button
                              key={`${m.providerId}-${m.name}`}
                              id={`model-option-${m.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                              onClick={() => {
                                setSelectedModel(m.name);
                                setIsModelDropdownOpen(false);
                                addToast(
                                  language === 'vi' ? 'Đã đổi mô hình AI' : 'Model Switched', 
                                  `${m.name} (${m.provider})`, 
                                  'info'
                                );
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-semibold' 
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              <div className="text-left min-w-0 pr-2">
                                <p className="font-semibold truncate">{m.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] truncate">{m.provider}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                                  {m.badge}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--status-success)]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add BYOK Provider Button */}
                  <div className="pt-2 border-t border-[var(--border-color)]">
                    <button
                      id="btn-goto-add-provider"
                      onClick={() => {
                        setIsModelDropdownOpen(false);
                        setCurrentScreen('settings');
                        setSettingsActiveTab('ai-providers');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? '+ Thêm Provider Riêng (BYOK)' : '+ Add Custom BYOK Key'}</span>
                    </button>
                  </div>
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
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer active:scale-[0.98] ${
              isDark 
                ? 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
                : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
            }`}
          >
            <span>{language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
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
                  className={`absolute left-0 mt-1.5 w-40 rounded-2xl shadow-xl p-1.5 z-40 space-y-1 border ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                  }`}
                >
                  <div className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                  </div>
                  {availableLanguages.map((l) => {
                    const isSelected = language === l.code;
                    return (
                      <button
                        key={l.code}
                        id={`lang-option-${l.code}`}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Global Pipeline Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-app)] text-xs text-[var(--text-secondary)] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
          <span className="font-medium text-[var(--text-primary)]">
            {language === 'vi' ? 'Sẵn sàng xử lý' : 'Ready to process'}
          </span>
        </div>
      </div>

      {/* Right side Actions: Theme Toggle, Upgrade, Notifications, Share */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme mode toggle: Light / Dark */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
              : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
          }`}
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent-primary)]" /> : <Moon className="w-4 h-4 text-[var(--accent-primary)]" />}
        </button>

        {/* Upgrade Plan Button (Free Plan Only) */}
        {user.plan === 'free' && (
          <button
            id="btn-upgrade-plan-header"
            onClick={() => setCurrentScreen('pricing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs ${
              isDark
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400'
                : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-800 hover:border-amber-400 shadow-2xs'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="hidden md:inline">{language === 'vi' ? 'Nâng cấp Pro' : 'Upgrade to Pro'}</span>
            <span className="md:hidden">Pro</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 ${
              isDark 
                ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
                : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--status-error)]" />
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsNotificationsOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-1.5 w-80 sm:w-96 rounded-2xl shadow-2xl border p-3 z-40 space-y-3 ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">{t('notifications')}</span>
                    <span className="text-xs text-[var(--status-info)] cursor-pointer hover:underline">
                      {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark all as read'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                    {(showAllNotifications ? notifications : notifications.slice(0, 3)).map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                          isDark 
                            ? 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40' 
                            : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[var(--text-primary)]">{n.title}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{n.time}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-[var(--border-color)]">
                    <button 
                      onClick={() => setShowAllNotifications(!showAllNotifications)}
                      className="w-full text-center text-xs font-semibold text-[var(--accent-primary)] hover:underline py-1"
                    >
                      {showAllNotifications ? (language === 'vi' ? 'Thu gọn' : 'Collapse') : (language === 'vi' ? 'Xem tất cả' : 'View all')}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Global Share Workspace Button */}
        <button
          id="btn-global-share"
          onClick={handleShare}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60' 
              : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 shadow-2xs'
          }`}
          title="Share workspace"
        >
          <Share2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="hidden sm:inline">{language === 'vi' ? 'Chia sẻ' : 'Share'}</span>
        </button>
      </div>
    </header>
  );
};
