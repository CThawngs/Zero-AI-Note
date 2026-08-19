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
  Archive,
  Edit3, 
  Clock, 
  Tag,
  Plus,
  Pin,
  MessageSquare,
  ArrowRight,
  Eye,
  Check,
  Calendar,
  Layers,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatSessionItem, NoteItem } from '../../types';
import { NoteCardSkeleton } from '../common/SkeletonLoader';
import { Modal } from '../common/Modal';
import { ShareNoteModal } from '../modals/ShareNoteModal';

export const LibraryScreen: React.FC = () => {
  const { 
    chatSessions,
    notes, 
    resumeChatSession,
    openNoteDetail, 
    startNewChatNote,
    renameChatSession,
    pinChatSession,
    archiveChatSession,
    libraryFilter, 
    setLibraryFilter, 
    librarySort, 
    setLibrarySort, 
    librarySearchQuery, 
    setLibrarySearchQuery, 
    libraryViewMode, 
    setLibraryViewMode, 
    focusSearchInput,
    setFocusSearchInput,
    isLoadingScreen,
    addToast,
    user,
    setCurrentScreen,
    theme,
    language,
    t
  } = useApp();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'with-notes' | 'shared'>('all');
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const [renameModalSession, setRenameModalSession] = useState<ChatSessionItem | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [archiveConfirmSession, setArchiveConfirmSession] = useState<ChatSessionItem | null>(null);
  const [previewNote, setPreviewNote] = useState<NoteItem | null>(null);
  const [sharingNote, setSharingNote] = useState<NoteItem | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (focusSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
      setFocusSearchInput(false);
    }
  }, [focusSearchInput, setFocusSearchInput]);

  const handleOpenRename = (session: ChatSessionItem) => {
    setRenameModalSession(session);
    setRenameTitleInput(session.title);
    setOpenMenuSessionId(null);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameModalSession && renameTitleInput.trim()) {
      renameChatSession(renameModalSession.id, renameTitleInput.trim());
      setRenameModalSession(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (archiveConfirmSession) {
      await archiveChatSession(archiveConfirmSession.id);
      setArchiveConfirmSession(null);
    }
  };

  const isDark = theme === 'dark';

  // Base list: use active non-archived chatSessions or fallback to notes mapped as sessions
  const baseSessions: ChatSessionItem[] = (chatSessions.length > 0 
    ? chatSessions 
    : notes.map(n => ({
        id: n.id,
        title: n.title,
        createdAt: n.date || n.updatedAt || '',
        updatedAt: n.updatedAt || n.date || '',
        model: 'Gemini 2.5 Flash',
        method: n.method || 'cornell',
        category: n.category || 'Học thuật',
        keywords: n.keywords || [],
        messages: [
          {
            id: `msg_${n.id}`,
            sender: 'user' as const,
            text: n.title,
            timestamp: n.date || 'Vừa xong'
          },
          {
            id: `msg_ai_${n.id}`,
            sender: 'ai' as const,
            text: n.summary || 'Ghi chú đã được AI cấu trúc sẵn sàng.',
            timestamp: n.date || 'Vừa xong',
            noteResultId: n.id
          }
        ],
        note: n,
        sources: n.sources?.map(s => ({ type: s.type as any, name: s.name })),
        isPinned: false,
        isArchived: n.isArchived,
        isShared: n.isShared
      }))).filter(s => !s.isArchived);

  // Tab counts
  const totalCount = baseSessions.length;
  const pinnedCount = baseSessions.filter(s => s.isPinned).length;
  const withNotesCount = baseSessions.filter(s => !!s.note).length;
  const sharedCount = baseSessions.filter(s => !!s.isShared).length;

  // Filter logic
  let filteredSessions = baseSessions.filter(s => {
    if (activeTab === 'pinned' && !s.isPinned) return false;
    if (activeTab === 'with-notes' && !s.note) return false;
    if (activeTab === 'shared' && !s.isShared) return false;

    if (libraryFilter !== 'all') {
      if (libraryFilter === 'khoa-hoc') return s.category === 'Khoa học' || s.category === 'Science';
      if (libraryFilter === 'du-an') return s.category === 'Dự án Alpha' || s.category === 'Project Alpha';
      if (libraryFilter === 'ca-nhan') return s.category === 'Cá nhân' || s.category === 'Personal';
      if (libraryFilter === 'ngon-ngu') return s.category === 'Học ngôn ngữ' || s.category === 'Language Learning';
      if (s.method === libraryFilter) return true;
      if (s.category?.toLowerCase() === libraryFilter.toLowerCase()) return true;
      return false;
    }

    if (librarySearchQuery.trim()) {
      const q = librarySearchQuery.toLowerCase().trim();
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchCategory = s.category?.toLowerCase().includes(q);
      const matchMethod = s.method?.toLowerCase().includes(q);
      const matchModel = s.model?.toLowerCase().includes(q);
      const matchKeywords = s.keywords?.some(kw => kw.toLowerCase().includes(q));
      const matchSources = s.sources?.some(src => src.name?.toLowerCase().includes(q));
      const matchMessages = s.messages?.some(m => m.text?.toLowerCase().includes(q));
      const matchNote = s.note && (s.note.title?.toLowerCase().includes(q) || s.note.summary?.toLowerCase().includes(q));

      return matchTitle || matchCategory || matchMethod || matchModel || matchKeywords || matchSources || matchMessages || matchNote;
    }

    return true;
  });

  // Sort logic
  filteredSessions = [...filteredSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (librarySort === 'az') return a.title.localeCompare(b.title);
    if (librarySort === 'za') return b.title.localeCompare(a.title);
    if (librarySort === 'messages') {
      return (b.messages?.length || 0) - (a.messages?.length || 0);
    }
    if (librarySort === 'oldest') {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeA - timeB;
    }
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      case 'audio': return <Headphones className="w-3.5 h-3.5 text-emerald-500" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      default: return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const isUltra = user.plan === 'ultra' || user.role === 'admin';
  const noteLimit = isUltra ? Infinity : (user.plan === 'pro' ? 50 : 20);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header */}
      <div className="p-4 sm:p-6 pb-4 border-b space-y-4 border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 border border-[var(--accent-primary)]/20 shadow-xs">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)]">
                {language === 'vi' ? 'Thư viện Ghi chú' : 'Notes Library'}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {language === 'vi' 
                  ? 'Quản lý các bài ghi chú học thuật AI, tiếp tục nghiên cứu và xuất bản tài liệu' 
                  : 'Manage AI-synthesized academic notes, resume research and export files'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Storage Quota Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)] text-xs shadow-2xs">
              <span className="text-[var(--text-secondary)] font-medium">
                {language === 'vi' ? 'Dung lượng:' : 'Storage:'}
              </span>
              <span className="font-bold text-[var(--text-primary)] font-mono">
                {baseSessions.length}/{isUltra ? '∞' : noteLimit}
              </span>
              {!isUltra && baseSessions.length >= (user.plan === 'pro' ? 40 : 15) && (
                <button
                  onClick={() => setCurrentScreen('pricing')}
                  className="font-bold text-[var(--accent-primary)] hover:underline ml-1 cursor-pointer"
                >
                  {language === 'vi' ? 'Nâng cấp' : 'Upgrade'}
                </button>
              )}
            </div>

            {/* Start New Note Button */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startNewChatNote()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] text-xs font-bold shadow-md shadow-[var(--accent-primary)]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === 'vi' ? 'Tạo Note mới' : 'New Note'}</span>
            </motion.button>
          </div>
        </div>

        {/* Tabs & Search Controls Row (No Windows horizontal scrollbar bug) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Segmented Filter Tabs without horizontal scrollbar */}
          <div className="flex p-1 rounded-2xl border bg-[var(--bg-app)] border-[var(--border-color)] self-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full">
            <button
              id="tab-library-all"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All'} ({totalCount})
            </button>
            <button
              id="tab-library-pinned"
              onClick={() => setActiveTab('pinned')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'pinned'
                  ? 'bg-[var(--bg-card)] text-amber-500 shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Đã ghim' : 'Pinned'}</span>
              {pinnedCount > 0 && <span className="font-mono opacity-80">({pinnedCount})</span>}
            </button>
            <button
              id="tab-library-with-notes"
              onClick={() => setActiveTab('with-notes')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'with-notes'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Có Note AI' : 'With Notes'}</span>
              {withNotesCount > 0 && <span className="font-mono opacity-80">({withNotesCount})</span>}
            </button>
            <button
              id="tab-library-shared"
              onClick={() => setActiveTab('shared')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'shared'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Được chia sẻ' : 'Shared with Me'}</span>
              {sharedCount > 0 && <span className="font-mono opacity-80">({sharedCount})</span>}
            </button>
          </div>

          {/* Search, Filter & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60 min-w-[190px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={searchInputRef}
                id="library-search-input"
                type="text"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm theo chủ đề, file, nội dung...' : 'Search topics, files, content...'}
                className="w-full rounded-xl pl-9 pr-7 py-1.5 text-xs border transition-colors bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] shadow-2xs"
              />
              {librarySearchQuery && (
                <button
                  onClick={() => setLibrarySearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-0.5"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                id="library-filter-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>{libraryFilter === 'all' ? (language === 'vi' ? 'Tất cả loại' : 'All Types') : libraryFilter}</span>
              </button>
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsFilterDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 4 }}
                      className="absolute right-0 mt-1.5 w-48 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                    >
                      {[
                        { id: 'all', label: language === 'vi' ? 'Tất cả thể loại' : 'All categories' },
                        { id: 'khoa-hoc', label: language === 'vi' ? 'Khoa học' : 'Science' },
                        { id: 'du-an', label: language === 'vi' ? 'Dự án Alpha' : 'Project Alpha' },
                        { id: 'ca-nhan', label: language === 'vi' ? 'Cá nhân' : 'Personal' },
                        { id: 'ngon-ngu', label: language === 'vi' ? 'Học ngôn ngữ' : 'Language' },
                        { id: 'cornell', label: 'Cornell Method' },
                        { id: 'outline', label: 'Outline Framework' },
                        { id: 'feynman', label: 'Feynman Technique' },
                        { id: 'flashcard', label: 'Flashcards' },
                        { id: 'qa', label: 'Q&A Knowledge' }
                      ].map(f => (
                        <button
                          key={f.id}
                          id={`filter-opt-${f.id}`}
                          onClick={() => {
                            setLibraryFilter(f.id);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            libraryFilter === f.id 
                              ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {librarySort === 'recent' 
                    ? (language === 'vi' ? 'Mới nhất' : 'Recent') 
                    : librarySort === 'az' 
                      ? 'A → Z' 
                      : librarySort === 'messages' 
                        ? (language === 'vi' ? 'Nhiều tin nhắn' : 'Most msgs') 
                        : (language === 'vi' ? 'Cũ nhất' : 'Oldest')}
                </span>
              </button>
              <AnimatePresence>
                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.96, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 4 }}
                      className="absolute right-0 mt-1.5 w-44 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                    >
                      {[
                        { id: 'recent', label: language === 'vi' ? 'Mới nhất trước' : 'Most recent' },
                        { id: 'messages', label: language === 'vi' ? 'Nhiều tin nhắn nhất' : 'Most messages' },
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
                          className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            librarySort === s.id 
                              ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
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
            <div className="flex p-0.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
              <button
                id="btn-view-grid"
                onClick={() => setLibraryViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  libraryViewMode === 'grid' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-xs font-bold' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-view-list"
                onClick={() => setLibraryViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  libraryViewMode === 'list' 
                    ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-xs font-bold' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="Danh sách"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {isLoadingScreen ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <NoteCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-84 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-3xl border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-xs max-w-xl mx-auto my-8"
          >
            <div className="w-14 h-14 rounded-3xl bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center mb-4 border border-[var(--accent-primary)]/20 shadow-sm">
              <FileText className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Chưa có bài ghi chú nào trong Thư viện' : 'No notes in Library yet'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md leading-relaxed">
              {language === 'vi' 
                ? 'Bắt đầu cuộc trò chuyện với AI hoặc tải lên tệp để tạo bài ghi chú học thuật đầu tiên của bạn.' 
                : 'Start a new AI conversation or upload documents to generate your first structured note.'}
            </p>
            <div className="flex items-center gap-3 mt-5">
              {librarySearchQuery && (
                <button
                  onClick={() => {
                    setLibrarySearchQuery('');
                    setLibraryFilter('all');
                    setActiveTab('all');
                  }}
                  className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => startNewChatNote()}
                className="px-5 py-2.5 bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold rounded-xl shadow-md shadow-[var(--accent-primary)]/20 cursor-pointer hover:opacity-90"
              >
                {language === 'vi' ? '+ Tạo bài ghi chú mới' : '+ Create New Note'}
              </motion.button>
            </div>
          </motion.div>
        ) : libraryViewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredSessions.map((session) => {
              const isPinned = !!session.isPinned;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative p-5 rounded-3xl border transition-all flex flex-col justify-between min-h-[260px] bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:shadow-xl hover:shadow-[var(--accent-primary)]/5 hover:-translate-y-1 ${
                    isPinned ? 'ring-1 ring-amber-500/40 border-amber-500/30' : ''
                  }`}
                >
                  <div>
                    {/* Card Header: Badges & Menu */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <Pin className="w-3 h-3 fill-amber-500" />
                            <span>Ghim</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-color)]">
                          {session.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] uppercase">
                          {session.method}
                        </span>
                      </div>

                      {/* 3-Dots Dropdown menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuSessionId(openMenuSessionId === session.id ? null : session.id);
                          }}
                          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {openMenuSessionId === session.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setOpenMenuSessionId(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 mt-1 w-48 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRename(session);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-left cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{language === 'vi' ? 'Đổi tên' : 'Rename'}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pinChatSession(session.id);
                                    setOpenMenuSessionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-left cursor-pointer"
                                >
                                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{isPinned ? (language === 'vi' ? 'Bỏ ghim' : 'Unpin') : (language === 'vi' ? 'Ghim lên đầu' : 'Pin to Top')}</span>
                                </button>
                                {session.note && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSharingNote(session.note!);
                                      setOpenMenuSessionId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-left cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{language === 'vi' ? 'Chia sẻ Note' : 'Share Note'}</span>
                                  </button>
                                )}
                                <div className="border-t my-1 border-[var(--border-color)]" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveConfirmSession(session);
                                    setOpenMenuSessionId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left cursor-pointer font-semibold"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>{language === 'vi' ? 'Chuyển vào Lưu trữ (30 ngày)' : 'Move to Archives (30d)'}</span>
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Session Title */}
                    <h3 
                      onClick={() => {
                        if (session.note) openNoteDetail(session.note);
                        else resumeChatSession(session.id);
                      }}
                      className="text-sm sm:text-base font-extrabold tracking-tight line-clamp-2 text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer mb-2"
                    >
                      {session.title}
                    </h3>

                    {/* Summary Snippet */}
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-3">
                      {session.note?.summary || session.messages?.[session.messages.length - 1]?.text || (language === 'vi' ? 'Bài ghi chú học thuật được tổng hợp bởi AI...' : 'AI-synthesized academic note...')}
                    </p>

                    {/* Sources attached */}
                    {session.sources && session.sources.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {session.sources.slice(0, 3).map((src, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] max-w-[140px] truncate"
                            title={src.name}
                          >
                            {getSourceIcon(src.type)}
                            <span className="truncate">{src.name}</span>
                          </div>
                        ))}
                        {session.sources.length > 3 && (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            +{session.sources.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t flex items-center justify-between border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium">
                      <span className="flex items-center gap-1 font-mono">
                        <MessageSquare className="w-3 h-3 text-[var(--accent-primary)]" />
                        {session.messages?.length || 1}
                      </span>
                      <span>•</span>
                      <span>{session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Archive Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setArchiveConfirmSession(session)}
                        className="p-1.5 rounded-xl border border-[var(--border-color)] hover:border-amber-500/50 hover:bg-amber-500/10 text-[var(--text-muted)] hover:text-amber-500 transition-all cursor-pointer"
                        title={language === 'vi' ? 'Lưu trữ (30 ngày)' : 'Archive (30d)'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Detail Button */}
                      {session.note ? (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => openNoteDetail(session.note!)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xs bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{language === 'vi' ? 'Xem Note' : 'View Note'}</span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => resumeChatSession(session.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-xs bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] cursor-pointer"
                        >
                          <span>{language === 'vi' ? 'Tiếp tục' : 'Resume'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="rounded-3xl border overflow-hidden shadow-xs border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="border-b font-bold uppercase text-xs tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-5 py-3.5">{language === 'vi' ? 'Tiêu Đề Bài Ghi Chú' : 'Note Title'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Mô Hình & Phương Pháp' : 'AI Model & Method'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Số Tin Nhắn' : 'Messages'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Ngày Cập Nhật' : 'Date'}</th>
                    <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                  {filteredSessions.map((session) => {
                    const isPinned = !!session.isPinned;
                    return (
                      <tr 
                        key={session.id} 
                        className={`hover:bg-[var(--bg-hover)] transition-colors ${
                          isPinned ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Title */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="flex items-center gap-2">
                            {isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500" />}
                            <span 
                              onClick={() => {
                                if (session.note) openNoteDetail(session.note);
                                else resumeChatSession(session.id);
                              }}
                              className="font-bold text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer truncate"
                              title={session.title}
                            >
                              {session.title}
                            </span>
                          </div>
                        </td>

                        {/* Model & Method */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
                              {session.method}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {session.model}
                            </span>
                          </div>
                        </td>

                        {/* Message Count */}
                        <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                          <span className="font-bold text-[var(--text-primary)]">{session.messages?.length || 1}</span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap text-[11px]">
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {session.note ? (
                              <button
                                onClick={() => openNoteDetail(session.note!)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] cursor-pointer hover:opacity-90 active:scale-95"
                              >
                                {language === 'vi' ? 'Xem Note' : 'View'}
                              </button>
                            ) : (
                              <button
                                onClick={() => resumeChatSession(session.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] cursor-pointer hover:opacity-90 active:scale-95"
                              >
                                {language === 'vi' ? 'Tiếp tục' : 'Resume'}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenRename(session)}
                              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                              title="Đổi tên"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setArchiveConfirmSession(session)}
                              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-amber-500/50 hover:bg-amber-500/10 text-[var(--text-muted)] hover:text-amber-500 cursor-pointer"
                              title="Lưu trữ"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RENAME MODAL */}
      {renameModalSession && (
        <Modal
          isOpen={true}
          onClose={() => setRenameModalSession(null)}
          title={language === 'vi' ? 'Đổi Tên Bài Ghi Chú' : 'Rename Note'}
          subtitle={language === 'vi' ? 'Cập nhật tiêu đề hiển thị trong Thư viện' : 'Update note title'}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRename} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                {language === 'vi' ? 'Tiêu đề mới' : 'New Title'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={renameTitleInput}
                onChange={(e) => setRenameTitleInput(e.target.value)}
                placeholder="VD: Kinh Tế Vĩ Mô: Lạm Phát & CPI"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-bold border bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameModalSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
              >
                {t('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {archiveConfirmSession && (
        <Modal
          isOpen={true}
          onClose={() => setArchiveConfirmSession(null)}
          title={language === 'vi' ? 'Chuyển Vào Mục Lưu Trữ & Thùng Rác' : 'Move to Trash & Archives'}
          subtitle={language === 'vi' ? 'Chính sách lưu trữ tự động trong vòng 30 ngày' : '30-day automatic retention policy'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[var(--text-primary)]">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  {language === 'vi' ? 'Lưu ý thời hạn 30 ngày:' : '30-day retention notice:'}
                </span>
                {language === 'vi' 
                  ? 'Ghi chú này sẽ được lưu trong mục Thùng rác & Lưu trữ trong 30 ngày. Quá 30 ngày, hệ thống sẽ tự động xóa vĩnh viễn không thể khôi phục.' 
                  : 'This note will remain in Trash & Archives for 30 days before being automatically purged forever.'}
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {language === 'vi' 
                ? `Bạn có muốn chuyển "${archiveConfirmSession.title}" vào mục Lưu trữ? Bạn có thể khôi phục lại bất kỳ lúc nào trước khi hết 30 ngày.`
                : `Move "${archiveConfirmSession.title}" to Archives? You can restore it anytime within 30 days.`}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArchiveConfirmSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xác nhận Lưu trữ' : 'Confirm Archive'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SHARE MODAL */}
      {sharingNote && (
        <ShareNoteModal
          isOpen={true}
          onClose={() => setSharingNote(null)}
          note={sharingNote}
        />
      )}
    </div>
  );
};
