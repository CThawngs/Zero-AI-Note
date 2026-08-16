import React from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Folder, 
  User, 
  LayoutTemplate, 
  Archive, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ScreenType } from '../../types';

export const Sidebar: React.FC = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    user, 
    notes, 
    openNoteDetail, 
    startNewChatNote, 
    setLibrarySearchQuery,
    setFocusSearchInput,
    t,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    theme
  } = useApp();

  const navItems = [
    { id: 'library', label: t('navNotes'), icon: FileText, screen: 'library' as ScreenType },
    { 
      id: 'search', 
      label: t('navSearch'), 
      icon: Search, 
      action: () => {
        setCurrentScreen('library');
        setFocusSearchInput(true);
        setIsMobileSidebarOpen(false);
      }
    },
    { id: 'files', label: t('navFiles'), icon: Folder, screen: 'files' as ScreenType },
    { id: 'templates', label: t('navTemplates'), icon: LayoutTemplate, screen: 'templates' as ScreenType },
    { id: 'archives', label: t('navArchives'), icon: Archive, screen: 'archives' as ScreenType },
    { id: 'account', label: t('navAccount'), icon: User, screen: 'settings' as ScreenType }
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.screen) {
      setCurrentScreen(item.screen);
      setIsMobileSidebarOpen(false);
    }
  };

  const isNavActive = (item: typeof navItems[0]) => {
    if (item.id === 'search') return false;
    if (item.screen === currentScreen) return true;
    if (item.id === 'library' && currentScreen === 'note-detail') return true;
    return false;
  };

  const isDark = theme === 'dark';

  const sidebarContent = (
    <aside 
      className={`w-[85vw] max-w-[320px] sm:w-[260px] h-full flex flex-col justify-between select-none shrink-0 transition-colors duration-200 ${
        isDark 
          ? 'bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] text-[var(--text-primary)]' 
          : 'bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] text-[var(--text-primary)] shadow-xs'
      }`}
    >
      {/* Top Header Section (Sticky) */}
      <div className="p-4 pb-2 border-b border-[var(--border-color)] shrink-0">
        {/* Brand & Mobile Close */}
        <div className="flex items-center justify-between mb-3">
          <div 
            onClick={() => {
              setCurrentScreen('chat');
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-[var(--accent-primary)]/20 group-hover:scale-105 transition-transform shrink-0 accent-gradient text-[var(--accent-text)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight flex items-center gap-1.5 text-[var(--text-primary)]">
                {t('brandName')}
              </h1>
              <span className="text-xs uppercase tracking-wider font-semibold block leading-tight text-[var(--accent-primary)]">
                {t('brandTagline')}
              </span>
            </div>
          </div>

          {/* Mobile / Tablet close button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer active:scale-95 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary "+ Note mới" button */}
        <button
          id="btn-new-note"
          onClick={() => {
            startNewChatNote();
            setIsMobileSidebarOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl active:scale-[0.97] text-xs font-bold transition-all cursor-pointer shadow-md bg-[var(--accent-primary)] hover:opacity-90 active:opacity-100 text-[var(--accent-text)] shadow-[var(--accent-primary)]/25"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('newNote')}</span>
        </button>
      </div>

      {/* Middle Scrollable Section: Search + Navigation + Note History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar min-h-0">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            id="sidebar-quick-search"
            type="text"
            placeholder={t('searchPlaceholder')}
            onChange={(e) => {
              setLibrarySearchQuery(e.target.value);
              if (currentScreen !== 'library') setCurrentScreen('library');
            }}
            className="w-full text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none transition-colors border bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30"
          />
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all relative cursor-pointer active:scale-[0.99] ${
                  active
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] shadow-2xs font-semibold border border-[var(--accent-primary)]/30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--accent-primary)]" />
                )}
                <Icon className={`w-4 h-4 ${
                  active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                }`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Recent Notes History (Scrollable) */}
        <div className="pt-3 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('recentNotes')}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {notes.length}
            </span>
          </div>

          <div className="space-y-1">
            {notes.map((note) => (
              <button
                key={note.id}
                id={`recent-note-${note.id}`}
                onClick={() => {
                  openNoteDetail(note);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate flex items-center gap-2 transition-colors cursor-pointer group active:scale-[0.99] ${
                  currentScreen === 'note-detail' && note.id === notes[0]?.id
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/70'
                }`}
                title={note.title}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 group-hover:scale-125 transition-transform bg-[var(--accent-primary)]" />
                <span className="truncate">{note.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section: Admin switch & User (Sticky) */}
      <div className="p-3 border-t shrink-0 flex flex-col gap-2 border-[var(--border-color)] bg-[var(--bg-sidebar)]">
        {/* Admin Portal Shortcut */}
        <button
          id="btn-switch-admin"
          onClick={() => {
            setCurrentScreen(currentScreen === 'admin-coupons' ? 'chat' : 'admin-coupons');
            setIsMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer active:scale-[0.99] ${
            currentScreen === 'admin-coupons'
              ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-semibold'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--status-success)]" />
            <span>{t('navAdminArea')}</span>
          </div>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-[var(--status-success)]/20 text-[var(--status-success)]">
            {currentScreen === 'admin-coupons' ? 'Active' : 'Portal'}
          </span>
        </button>

        {/* User Profile Card */}
        <div 
          id="user-profile-card"
          onClick={() => {
            setCurrentScreen('settings');
            setIsMobileSidebarOpen(false);
          }}
          className="flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer group active:scale-[0.99] bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--accent-primary)]/40"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 bg-[var(--status-success)] ring-[var(--bg-card)]" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold truncate transition-colors text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                {user.name}
              </p>
              <span className={`inline-block text-xs font-bold px-1.5 py-0.2 rounded ${
                user.plan === 'pro' 
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' 
                  : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
              }`}>
                {user.plan === 'pro' ? t('proPlan') : t('freePlan')}
              </span>
            </div>
          </div>
          <Settings className="w-4 h-4 transition-colors text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg+ / >= 1024px) */}
      <div className="hidden lg:flex h-full shrink-0 z-20">
        {sidebarContent}
      </div>

      {/* Mobile & Tablet Drawer (visible on < lg when opened) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
            />

            {/* Slide Drawer from left (~250ms) */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl flex max-w-[85vw] sm:max-w-none"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
