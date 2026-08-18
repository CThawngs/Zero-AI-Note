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
  Server,
  Trash2,
  BellOff,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X
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
    notifications,
    hasUnreadNotifications,
    markNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    t
  } = useApp();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  const isEn = language === 'en';

  // Custom models derived from user's configured BYOK providers
  const customModels: ModelCatalogItem[] = useMemo(() => {
    return aiProviders.map(p => ({
      id: p.defaultModel,
      name: p.defaultModel,
      provider: p.name,
      providerId: p.providerId,
      descVi: `Endpoint: ${p.endpointUrl}`,
      descEn: `Endpoint: ${p.endpointUrl}`,
      isSystem: false,
      status: p.status,
    }));
  }, [aiProviders]);

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
    return SYSTEM_GEMINI_MODELS.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.id.toLowerCase().includes(q) || 
      m.descVi.toLowerCase().includes(q) || 
      m.descEn.toLowerCase().includes(q)
    );
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
            <span className="max-w-[150px] sm:max-w-[240px] truncate font-semibold">
              {currentModel.name}
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
                      {allModels.length} {isEn ? 'LLM models' : 'mô hình LLM'}
                    </span>
                  </div>

                  {/* Search Filter Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder={isEn ? 'Search Gemini, GPT, Claude, Llama...' : 'Tìm kiếm mô hình Gemini, GPT, Claude, Llama...'}
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
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-semibold' 
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              <div className="text-left min-w-0 pr-2">
                                <p className="font-semibold truncate">{m.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5 line-clamp-1">
                                  {isEn ? m.descEn : m.descVi}
                                </p>
                              </div>
                              <div className="flex items-center shrink-0">
                                {isSelected && <Check className="w-4 h-4 text-[var(--status-success)]" />}
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
                          <span>{isEn ? 'Your BYOK Providers' : 'Nhà cung cấp riêng của bạn (BYOK)'}</span>
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
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 font-semibold' 
                                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                              }`}
                            >
                              <div className="text-left min-w-0 pr-2">
                                <p className="font-semibold truncate">{m.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] truncate">{m.provider}</p>
                              </div>
                              <div className="flex items-center shrink-0">
                                {isSelected && <Check className="w-4 h-4 text-[var(--status-success)]" />}
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
                      <span>{isEn ? '+ Add Custom BYOK Key' : '+ Thêm Provider Riêng (BYOK)'}</span>
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
            <span>{isEn ? '🇺🇸 EN' : '🇻🇳 VI'}</span>
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
                    {isEn ? 'Language' : 'Ngôn ngữ'}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--accent-primary)]/50 bg-[var(--accent-subtle)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-[var(--accent-text)] text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs group"
          >
            <Crown className="w-3.5 h-3.5 text-[var(--accent-primary)] group-hover:text-[var(--accent-text)] fill-[var(--accent-primary)] group-hover:fill-[var(--accent-text)] transition-colors" />
            <span className="hidden md:inline">{isEn ? 'Upgrade to Pro' : 'Nâng cấp Pro'}</span>
            <span className="md:hidden">Pro</span>
          </button>
        )}

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            id="btn-notifications-toggle"
            onClick={() => {
              if (!isNotificationsOpen) {
                markNotificationsAsRead();
              }
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 ${
              isDark 
                ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)]' 
                : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] shadow-2xs'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--status-error)] animate-pulse" />
            )}
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
                  {/* Notification Header */}
                  <div className="flex items-center justify-between px-1 pb-2 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                        {isEn ? 'Notifications' : 'Thông báo'}
                      </span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-[11px] text-[var(--status-error)] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isEn ? 'Clear all' : 'Xóa tất cả'}</span>
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  {notifications.length === 0 ? (
                    <div className="py-7 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-muted)]">
                        <BellOff className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {isEn ? 'No notifications' : 'Không có thông báo nào'}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                        {isEn ? 'System alerts and account updates will appear here.' : 'Các cảnh báo hệ thống hoặc cập nhật tài khoản sẽ xuất hiện tại đây.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                      {(showAllNotifications ? notifications : notifications.slice(0, 3)).map((n) => {
                        const isErr = n.type === 'error';
                        const isWarn = n.type === 'warning';
                        const isSuccess = n.type === 'success';
                        return (
                          <div 
                            key={n.id} 
                            className={`p-2.5 rounded-xl border text-xs space-y-1 relative group transition-colors ${
                              isDark 
                                ? 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40' 
                                : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)] min-w-0 pr-1">
                                {isErr && <AlertCircle className="w-3.5 h-3.5 text-[var(--status-error)] shrink-0" />}
                                {isWarn && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />}
                                {!isErr && !isWarn && !isSuccess && <Info className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />}
                                <span className="truncate">{n.title}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-[var(--text-muted)]">{n.time}</span>
                                <button
                                  type="button"
                                  onClick={() => deleteNotification(n.id)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--status-error)] transition-all cursor-pointer"
                                  title={isEn ? 'Delete' : 'Xóa'}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{n.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Notification Footer: View All & Clear All */}
                  {notifications.length > 3 && (
                    <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
                      <button 
                        onClick={() => setShowAllNotifications(!showAllNotifications)}
                        className="text-xs font-semibold text-[var(--accent-primary)] hover:underline py-1 cursor-pointer"
                      >
                        {showAllNotifications 
                          ? (isEn ? 'Collapse' : 'Thu gọn') 
                          : (isEn ? `View all (${notifications.length})` : `Xem tất cả (${notifications.length})`)}
                      </button>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--status-error)] hover:underline py-1 cursor-pointer"
                      >
                        {isEn ? 'Clear all' : 'Xóa hết'}
                      </button>
                    </div>
                  )}
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
          <span className="hidden sm:inline">{isEn ? 'Share' : 'Chia sẻ'}</span>
        </button>
      </div>
    </header>
  );
};
