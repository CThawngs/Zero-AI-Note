import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatSessionItem, NoteItem } from '../../types';
import { Modal } from '../common/Modal';

export const ArchivesScreen: React.FC = () => {
  const { 
    archivedNotes, 
    archivedChatSessions,
    restoreNote, 
    deleteNotePermanently, 
    restoreChatSession, 
    deleteChatSessionPermanently, 
    emptyTrash, 
    theme, 
    language, 
    t,
    setCurrentScreen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<'all' | 'urgent' | 'safe'>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'name' | 'expiring'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: string; title: string; isSession?: boolean } | null>(null);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  const isDark = theme === 'dark';

  // Compute days left out of 30 days
  const computeDaysLeft = (archivedAt?: string, fallbackDays = 30): number => {
    if (!archivedAt) return fallbackDays;
    const archivedTime = new Date(archivedAt).getTime();
    if (isNaN(archivedTime)) return fallbackDays;
    const elapsedDays = Math.floor((Date.now() - archivedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - elapsedDays);
  };

  // Unified items list: combine archivedChatSessions & archivedNotes without duplicates
  const sessionMap = new Map<string, {
    id: string;
    title: string;
    summary: string;
    category: string;
    method: string;
    archivedAt?: string;
    daysLeft: number;
    messagesCount: number;
    hasNote: boolean;
    note?: NoteItem;
  }>();

  archivedChatSessions.forEach(s => {
    const days = computeDaysLeft(s.archivedAt || s.updatedAt, s.archiveDaysLeft ?? 30);
    sessionMap.set(s.id, {
      id: s.id,
      title: s.title,
      summary: (s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1]?.text : '') || s.note?.summary || '',
      category: s.category || 'Học thuật',
      method: s.method || 'cornell',
      archivedAt: s.archivedAt || s.updatedAt,
      daysLeft: days,
      messagesCount: s.messages?.length || 1,
      hasNote: !!s.note,
      note: s.note
    });
  });

  archivedNotes.forEach(n => {
    if (!sessionMap.has(n.id)) {
      const days = computeDaysLeft(n.archivedAt || n.updatedAt, n.archiveDaysLeft ?? 30);
      sessionMap.set(n.id, {
        id: n.id,
        title: n.title,
        summary: n.summary || '',
        category: n.category || 'Học thuật',
        method: n.method || 'cornell',
        archivedAt: n.archivedAt || n.updatedAt,
        daysLeft: days,
        messagesCount: 1,
        hasNote: true,
        note: n
      });
    }
  });

  const allArchivedItems = Array.from(sessionMap.values());

  // Filter items
  let filteredItems = allArchivedItems.filter(item => {
    if (filterOption === 'urgent' && item.daysLeft > 5) return false;
    if (filterOption === 'safe' && item.daysLeft <= 5) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    if (sortOption === 'name') return a.title.localeCompare(b.title);
    if (sortOption === 'expiring') return a.daysLeft - b.daysLeft;
    if (sortOption === 'oldest') {
      const timeA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const timeB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return timeA - timeB;
    }
    // Default 'recent'
    const timeA = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
    const timeB = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
    return timeB - timeA;
  });

  // Restore action
  const handleRestore = async (id: string) => {
    await restoreChatSession(id);
    await restoreNote(id);
  };

  // Permanent Delete action
  const handleDeletePermanently = async (id: string) => {
    await deleteChatSessionPermanently(id);
    await deleteNotePermanently(id);
    setConfirmDeleteItem(null);
  };

  // Empty all trash
  const handleEmptyAll = async () => {
    for (const item of allArchivedItems) {
      await deleteChatSessionPermanently(item.id);
      await deleteNotePermanently(item.id);
    }
    emptyTrash();
    setIsConfirmEmptyTrashOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 pb-4 border-b space-y-4 border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
              <Archive className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {language === 'vi' ? 'Thùng rác & Lưu trữ' : 'Trash & Archives'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {language === 'vi' 
                  ? 'Danh sách phiên hội thoại & ghi chú tạm lưu trữ — Tự động xóa vĩnh viễn sau 30 ngày' 
                  : 'Archived conversations and notes — Auto-purged permanently after 30 days'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              id="btn-empty-trash-header"
              disabled={allArchivedItems.length === 0}
              onClick={() => setIsConfirmEmptyTrashOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Dọn sạch thùng rác' : 'Empty Trash'} ({allArchivedItems.length})</span>
            </button>
          </div>
        </div>

        {/* 30-Day Retention Notice Banner */}
        <div className="p-3.5 rounded-2xl border flex items-start sm:items-center gap-3 bg-[var(--accent-subtle)]/40 border-[var(--accent-primary)]/30 text-[var(--text-primary)]">
          <Clock className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs leading-relaxed flex-1">
            <span className="font-bold text-[var(--accent-primary)]">
              {language === 'vi' ? 'Chính sách lưu trữ 30 ngày: ' : '30-Day Retention Policy: '}
            </span>
            {language === 'vi'
              ? <>Các phiên chat và ghi chú tại đây được giữ trong <strong className="font-bold text-[var(--text-primary)]">30 ngày</strong> kể từ khi chuyển vào. Nhấn <strong className="font-bold text-[var(--accent-primary)]">Khôi phục</strong> để đưa phiên làm việc trở lại Lịch sử bất cứ lúc nào.</>
              : <>Archived sessions and notes are retained for <strong className="font-bold text-[var(--text-primary)]">30 days</strong>. Click <strong className="font-bold text-[var(--accent-primary)]">Restore</strong> anytime to return them to History.</>}
          </div>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="input-search-archives"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm trong mục lưu trữ...' : 'Search archived items...'}
              className="w-full rounded-xl pl-9 pr-8 py-1.5 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-0.5"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Pills & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
                { id: 'urgent', label: language === 'vi' ? 'Sắp hết hạn (≤ 5 ngày)' : 'Expiring Soon (≤ 5d)' },
                { id: 'safe', label: language === 'vi' ? 'Còn hạn (> 5 ngày)' : 'Safe (> 5d)' }
              ].map((f) => (
                <button
                  key={f.id}
                  id={`filter-archive-${f.id}`}
                  onClick={() => setFilterOption(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    filterOption === f.id
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-xs'
                      : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                id="archive-sort-btn"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {sortOption === 'recent' 
                    ? (language === 'vi' ? 'Mới lưu trữ' : 'Recent') 
                    : sortOption === 'expiring' 
                    ? (language === 'vi' ? 'Sắp hết hạn trước' : 'Expiring soonest')
                    : sortOption === 'name' 
                    ? 'Tên A → Z' 
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
                        { id: 'recent', label: language === 'vi' ? 'Mới lưu trữ trước' : 'Recent' },
                        { id: 'expiring', label: language === 'vi' ? 'Sắp hết hạn trước' : 'Expiring soonest' },
                        { id: 'name', label: language === 'vi' ? 'Tên A → Z' : 'Name A → Z' },
                        { id: 'oldest', label: language === 'vi' ? 'Cũ nhất trước' : 'Oldest' }
                      ].map(s => (
                        <button
                          key={s.id}
                          id={`sort-archive-${s.id}`}
                          onClick={() => {
                            setSortOption(s.id as any);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                            sortOption === s.id 
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
          </div>
        </div>
      </div>

      {/* Main Content List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-80 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-3xl border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-xs max-w-xl mx-auto my-8"
          >
            <div className="w-14 h-14 rounded-3xl bg-[var(--bg-hover)] text-[var(--text-muted)] flex items-center justify-center mb-4 border border-[var(--border-color)]">
              <Archive className="w-7 h-7 stroke-[1.8]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Thùng rác & Lưu trữ trống' : 'Trash & Archives is empty'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md leading-relaxed">
              {language === 'vi' 
                ? 'Không có phiên hội thoại hoặc ghi chú nào đang chờ xóa trong mục này.' 
                : 'No conversations or notes are currently pending deletion.'}
            </p>
            <button
              onClick={() => setCurrentScreen('library')}
              className="mt-5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm cursor-pointer hover:opacity-90 active:scale-95"
            >
              {language === 'vi' ? 'Quay lại Lịch sử' : 'Back to History'}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {filteredItems.map((item) => {
              const isUrgent = item.daysLeft <= 5;
              const isModerate = item.daysLeft > 5 && item.daysLeft <= 15;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border transition-all gap-4 bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 hover:shadow-lg shadow-xs"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                      {item.hasNote ? (
                        <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-md">
                          {item.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold border bg-[var(--bg-app)] text-[var(--text-secondary)] border-[var(--border-color)]">
                          {item.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold bg-[var(--accent-subtle)] text-[var(--accent-primary)] uppercase">
                          {item.method}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-1 text-[var(--text-secondary)] leading-relaxed">
                        {item.summary || (language === 'vi' ? 'Phiên làm việc nghiên cứu cùng AI...' : 'AI research session...')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Retention Countdown & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
                    {/* Countdown Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      isUrgent 
                        ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400' 
                        : isModerate 
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                          : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {language === 'vi' 
                          ? `Còn ${item.daysLeft} ngày` 
                          : `${item.daysLeft}d left`}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Restore Button */}
                      <motion.button
                        id={`btn-restore-${item.id}`}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleRestore(item.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent-subtle)] hover:opacity-90 text-[var(--accent-primary)] text-xs font-bold border border-[var(--accent-primary)]/30 transition-all cursor-pointer shadow-2xs"
                        title={language === 'vi' ? 'Khôi phục về Lịch sử' : 'Restore to History'}
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>{language === 'vi' ? 'Khôi phục' : 'Restore'}</span>
                      </motion.button>

                      {/* Permanent Delete Button */}
                      <motion.button
                        id={`btn-delete-perm-${item.id}`}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setConfirmDeleteItem(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold border border-red-500/25 transition-all cursor-pointer active:scale-95"
                        title={language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete permanently'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete'}</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal - Single Item Permanent Delete */}
      {confirmDeleteItem && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmDeleteItem(null)}
          title={language === 'vi' ? 'Xác Nhận Xóa Vĩnh Viễn' : 'Permanent Delete Confirmation'}
          subtitle={language === 'vi' ? 'Hành động này sẽ xóa dữ liệu ngay lập tức và không thể hoàn tác' : 'This action cannot be undone'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-red-600 dark:text-red-400 font-medium">
                {language === 'vi'
                  ? 'Toàn bộ tin nhắn trao đổi với AI và file ghi chú liên kết sẽ bị gỡ bỏ hoàn toàn khỏi database.'
                  : 'All conversation messages and associated note artifacts will be permanently purged from the database.'}
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {language === 'vi' ? 'Bạn có chắc chắn muốn xóa vĩnh viễn ' : 'Are you sure you want to permanently delete '}
              <strong className="text-[var(--text-primary)] font-bold">"{confirmDeleteItem.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeletePermanently(confirmDeleteItem.id)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-red-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xác nhận xóa vĩnh viễn' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal - Empty All Trash */}
      {isConfirmEmptyTrashOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfirmEmptyTrashOpen(false)}
          title={language === 'vi' ? 'Dọn Sạch Toàn Bộ Thùng Rác' : 'Empty Trash Confirmation'}
          subtitle={language === 'vi' ? `Xóa vĩnh viễn toàn bộ ${allArchivedItems.length} mục đang lưu trữ` : `Permanently delete all ${allArchivedItems.length} archived items`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-red-600 dark:text-red-400 font-medium">
                {language === 'vi'
                  ? `Toàn bộ ${allArchivedItems.length} phiên hội thoại và ghi chú trong mục Lưu trữ sẽ bị xóa vĩnh viễn ngay lập tức.`
                  : `All ${allArchivedItems.length} conversations and notes in Archives will be permanently removed.`}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleEmptyAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-red-500/20 active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Dọn sạch ngay' : 'Empty All Now'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
