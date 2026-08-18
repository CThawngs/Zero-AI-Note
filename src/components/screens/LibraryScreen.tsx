import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  FileText, 
  Youtube, 
  Headphones, 
  Image as ImageIcon, 
  Folder, 
  Sparkles, 
  Share2, 
  Trash2, 
  Edit3, 
  Clock, 
  Tag,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { NoteCardSkeleton } from '../common/SkeletonLoader';
import { Modal } from '../common/Modal';

export const LibraryScreen: React.FC = () => {
  const { 
    notes, 
    openNoteDetail, 
    archiveNote, 
    renameNote,
    startNewChatNote, 
    libraryFilter, 
    setLibraryFilter, 
    librarySort, 
    setLibrarySort, 
    librarySearchQuery, 
    setLibrarySearchQuery, 
    libraryViewMode, 
    setLibraryViewMode, 
    libraryActiveTab, 
    setLibraryActiveTab,
    focusSearchInput,
    setFocusSearchInput,
    isLoadingScreen,
    addToast,
    theme,
    language,
    t
  } = useApp();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);
  const [renameModalNote, setRenameModalNote] = useState<NoteItem | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (focusSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
      setFocusSearchInput(false);
    }
  }, [focusSearchInput, setFocusSearchInput]);

  const handleOpenRename = (note: NoteItem) => {
    setRenameModalNote(note);
    setRenameTitleInput(note.title);
    setOpenMenuNoteId(null);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameModalNote && renameTitleInput.trim()) {
      renameNote(renameModalNote.id, renameTitleInput.trim());
      setRenameModalNote(null);
    }
  };

  const handleShareNote = (note: NoteItem) => {
    setOpenMenuNoteId(null);
    navigator.clipboard?.writeText(`${window.location.origin}/notes/${note.id}`);
    addToast(t('copied'), t('toastCopied'));
  };

  const isDark = theme === 'dark';

  // Filter and sort logic
  let filteredNotes = notes.filter(n => {
    if (libraryActiveTab === 'shared' && !n.isShared) return false;
    if (libraryFilter !== 'all') {
      if (libraryFilter === 'khoa-hoc') return n.category === 'Khoa học' || n.category === 'Science';
      if (libraryFilter === 'du-an') return n.category === 'Dự án Alpha' || n.category === 'Project Alpha';
      if (libraryFilter === 'ca-nhan') return n.category === 'Cá nhân' || n.category === 'Personal';
      if (libraryFilter === 'ngon-ngu') return n.category === 'Học ngôn ngữ' || n.category === 'Language Learning';
      if (n.method === libraryFilter) return true;
      if (n.category?.toLowerCase() === libraryFilter.toLowerCase()) return true;
      return false;
    }
    if (librarySearchQuery.trim()) {
      const q = librarySearchQuery.toLowerCase().trim();
      return (
        n.title?.toLowerCase().includes(q) ||
        n.summary?.toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q) ||
        n.method?.toLowerCase().includes(q) ||
        n.keywords?.some(kw => kw.toLowerCase().includes(q)) ||
        n.sources?.some(s => s.name?.toLowerCase().includes(q)) ||
        n.coreQuestions?.some(cq => cq.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort
  filteredNotes = [...filteredNotes].sort((a, b) => {
    if (librarySort === 'az') return a.title.localeCompare(b.title);
    if (librarySort === 'za') return b.title.localeCompare(a.title);
    if (librarySort === 'oldest') {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeA - timeB;
    }
    // Default 'recent'
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-[var(--status-error)]" />;
      case 'audio': return <Headphones className="w-3.5 h-3.5 text-[var(--status-success)]" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-[var(--status-info)]" />;
      default: return <FileText className="w-3.5 h-3.5 text-[var(--status-info)]" />;
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Top Controls Bar */}
      <div className={`p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors ${
        isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]/80' : 'border-[var(--border-color)] bg-white'
      }`}>
        {/* Title & Tabs row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${'text-[var(--text-primary)]'}`}>
              {t('libraryTitle')}
            </h2>
            
            {/* Tabs */}
            <div className={`flex p-0.5 rounded-xl border ${
              isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
            }`}>
              <button
                id="library-tab-my-notes"
                onClick={() => setLibraryActiveTab('my-notes')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  libraryActiveTab === 'my-notes'
                    ? isDark ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-xs' : 'bg-white text-[var(--text-primary)] shadow-xs'
                    : isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('tabMyNotes')} ({notes.length})
              </button>
              <button
                id="library-tab-shared"
                onClick={() => setLibraryActiveTab('shared')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  libraryActiveTab === 'shared'
                    ? isDark ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-xs' : 'bg-white text-[var(--text-primary)] shadow-xs'
                    : isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t('tabShared')}
              </button>
            </div>
          </div>

          <button
            id="btn-library-new-note"
            onClick={() => startNewChatNote()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] rounded-xl text-xs font-semibold shadow-md shadow-[var(--accent-primary)]/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newNote')}</span>
          </button>
        </div>

        {/* Search, Filter, Sort & View Mode row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'
            }`} />
            <input
              ref={searchInputRef}
              id="library-search-input"
              type="text"
              value={librarySearchQuery}
              onChange={(e) => setLibrarySearchQuery(e.target.value)}
              placeholder={t('searchNotesPlaceholder')}
              className={`w-full rounded-xl pl-10 pr-8 py-2.5 sm:py-2 text-sm sm:text-xs transition-colors border ${
                isDark 
                  ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)]' 
                  : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] shadow-2xs'
              }`}
            />
            {librarySearchQuery && (
              <button
                onClick={() => setLibrarySearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter, Sort & View Toggle */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                id="library-filter-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                  isDark 
                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]' 
                    : 'bg-white border-[var(--border-color)] hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs'
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>{t('filter')}: {libraryFilter === 'all' ? t('all') : libraryFilter}</span>
              </button>
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFilterDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 4 }}
                      className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border ${
                        isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                      }`}
                    >
                      {[
                        { id: 'all', label: t('catAll') },
                        { id: 'khoa-hoc', label: t('catScience') },
                        { id: 'du-an', label: t('catProject') },
                        { id: 'ca-nhan', label: t('catPersonal') },
                        { id: 'ngon-ngu', label: t('catLanguage') }
                      ].map(f => (
                        <button
                          key={f.id}
                          id={`filter-opt-${f.id}`}
                          onClick={() => {
                            setLibraryFilter(f.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 sm:py-1.5 rounded-lg transition-colors cursor-pointer ${
                            libraryFilter === f.id 
                              ? isDark ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold' : 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold'
                              : isDark ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-app)]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                id="library-sort-btn"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                  isDark 
                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]' 
                    : 'bg-white border-[var(--border-color)] hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>{librarySort === 'recent' ? t('recent') : librarySort === 'az' ? t('nameAsc') : t('createdDate')}</span>
              </button>
              <AnimatePresence>
                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 4 }}
                      className={`absolute right-0 mt-1.5 w-40 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border ${
                        isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                      }`}
                    >
                      {[
                        { id: 'recent', label: t('recent') },
                        { id: 'az', label: language === 'vi' ? 'Tên A → Z' : 'Name A → Z' },
                        { id: 'za', label: language === 'vi' ? 'Tên Z → A' : 'Name Z → A' },
                        { id: 'oldest', label: language === 'vi' ? 'Cũ nhất trước' : 'Oldest first' }
                      ].map(s => (
                        <button
                          key={s.id}
                          id={`sort-opt-${s.id}`}
                          onClick={() => {
                            setLibrarySort(s.id);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 sm:py-1.5 rounded-lg transition-colors cursor-pointer ${
                            librarySort === s.id 
                              ? isDark ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold' : 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold'
                              : isDark ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-app)]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* View Mode Toggle */}
            <div className={`flex p-1 rounded-xl border shrink-0 ${
              isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
            }`}>
              <button
                id="btn-view-grid"
                onClick={() => setLibraryViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  libraryViewMode === 'grid' 
                    ? isDark ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'bg-white text-[var(--text-primary)] shadow-2xs' 
                    : isDark ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={t('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="btn-view-list"
                onClick={() => setLibraryViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                  libraryViewMode === 'list' 
                    ? isDark ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'bg-white text-[var(--text-primary)] shadow-2xs' 
                    : isDark ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title={t('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {isLoadingScreen ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl ${
            isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-white'
          }`}>
            <FileText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
            <h3 className={`text-sm font-semibold ${'text-[var(--text-primary)]'}`}>
              {language === 'vi' ? 'Không tìm thấy ghi chú nào' : 'No notes found'}
            </h3>
            <p className={`text-xs mt-1 max-w-sm ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Thử tìm kiếm với từ khóa khác hoặc tạo một ghi chú mới bằng AI.' : 'Try adjusting your search terms or create a new note with AI.'}
            </p>
            <button
              onClick={() => {
                setLibrarySearchQuery('');
                setLibraryFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-semibold rounded-xl transition-colors cursor-pointer active:scale-95"
            >
              {language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
            </button>
          </div>
        ) : libraryViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => openNoteDetail(note)}
                className={`group relative p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer min-h-[220px] active:scale-[0.98] ${
                  isDark 
                    ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 hover:shadow-xl hover:shadow-[var(--accent-primary)]/5 hover:-translate-y-0.5' 
                    : 'bg-white hover:bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-[var(--accent-primary)]/5 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Card Header badges & 3-dots */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]'
                      }`}>
                        {note.category}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] uppercase">
                        {note.method}
                      </span>
                    </div>

                    {/* 3-dots menu button */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`note-menu-btn-${note.id}`}
                        onClick={() => setOpenMenuNoteId(openMenuNoteId === note.id ? null : note.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {openMenuNoteId === note.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setOpenMenuNoteId(null)} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`absolute right-0 mt-1 w-44 rounded-xl shadow-2xl p-1.5 z-40 space-y-0.5 text-xs border ${
                                isDark ? 'bg-[var(--bg-hover)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuNoteId(null);
                                  openNoteDetail(note);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]'
                                }`}
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                <span>{language === 'vi' ? 'Mở chi tiết' : 'Open details'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenRename(note)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                                <span>{t('rename')}</span>
                              </button>
                              <button
                                onClick={() => handleShareNote(note)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isDark ? 'text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)]'
                                }`}
                              >
                                <Share2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                                <span>{t('share')}</span>
                              </button>
                              <div className={`border-t my-1 ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]'}`} />
                              <button
                                onClick={() => {
                                  setOpenMenuNoteId(null);
                                  archiveNote(note.id);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--status-error)] hover:bg-[var(--status-error)]/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('delete')}</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Title & Preview */}
                  <h3 className={`text-sm font-bold transition-colors line-clamp-1 mb-1.5 ${
                    'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                  }`}>
                    {note.title}
                  </h3>
                  <p className={`text-xs line-clamp-3 leading-relaxed ${
                    isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    {note.summary}
                  </p>
                </div>

                {/* Card Footer: Sources & Timestamp */}
                <div className={`flex items-center justify-between pt-3 border-t text-xs ${
                  isDark ? 'border-[var(--border-color)] text-[var(--text-muted)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {note.sources.slice(0, 3).map((s, idx) => (
                      <span key={idx} title={s.name}>
                        {getSourceIcon(s.type)}
                      </span>
                    ))}
                    {note.sources.length > 3 && (
                      <span className="text-xs font-mono">+{note.sources.length - 3}</span>
                    )}
                  </div>
                  <span className="text-xs">{note.updatedAt}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => openNoteDetail(note)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group active:scale-[0.99] ${
                  isDark 
                    ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40' 
                    : 'bg-white hover:bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                        'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                      }`}>
                        {note.title}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                      }`}>
                        {note.category}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                      {note.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 text-xs text-[var(--text-muted)] shrink-0 ml-3 sm:ml-4">
                  <div className="hidden sm:flex items-center gap-1.5">
                    {note.sources.map((s, idx) => (
                      <span key={idx}>{getSourceIcon(s.type)}</span>
                    ))}
                  </div>
                  <span className="text-xs hidden md:inline">{note.updatedAt}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveNote(note.id);
                    }}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--status-error)] rounded transition-colors cursor-pointer"
                    title={t('delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModalNote && (
        <Modal
          isOpen={true}
          onClose={() => setRenameModalNote(null)}
          title={t('renameModalTitle')}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRename} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {t('renameInputLabel')}
              </label>
              <input
                type="text"
                required
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)] border ${
                  isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameModalNote(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-semibold cursor-pointer shadow-md shadow-[var(--accent-primary)]/25 active:scale-95"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
