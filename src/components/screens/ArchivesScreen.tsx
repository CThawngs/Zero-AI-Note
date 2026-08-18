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
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { Modal } from '../common/Modal';

export const ArchivesScreen: React.FC = () => {
  const { archivedNotes, restoreNote, deleteNotePermanently, emptyTrash, theme, language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<'all' | 'urgent' | 'safe'>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'name' | 'expiring'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<NoteItem | null>(null);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  const isDark = theme === 'dark';

  let filteredArchived = archivedNotes.filter(n => {
    const daysLeft = n.archiveDaysLeft !== undefined ? n.archiveDaysLeft : 30;
    if (filterOption === 'urgent' && daysLeft > 5) return false;
    if (filterOption === 'safe' && daysLeft <= 5) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        (n.category && n.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  filteredArchived = [...filteredArchived].sort((a, b) => {
    if (sortOption === 'name') return a.title.localeCompare(b.title);
    if (sortOption === 'expiring') {
      const daysA = a.archiveDaysLeft !== undefined ? a.archiveDaysLeft : 30;
      const daysB = b.archiveDaysLeft !== undefined ? b.archiveDaysLeft : 30;
      return daysA - daysB;
    }
    if (sortOption === 'oldest') {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeA - timeB;
    }
    // Default 'recent'
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors ${
        isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]/80' : 'border-[var(--border-color)] bg-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {t('archivesTitle')}
            </h2>
            <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
              {language === 'vi' 
                ? 'Danh sách ghi chú tạm thời lưu trữ — Tự động xóa vĩnh viễn sau 30 ngày để tối ưu dữ liệu' 
                : 'Archived notes pending deletion — Auto-purged after 30 days to free up database storage'}
            </p>
          </div>

          <button
            id="btn-empty-trash-header"
            disabled={archivedNotes.length === 0}
            onClick={() => setIsConfirmEmptyTrashOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Dọn sạch thùng rác' : 'Empty Trash'} ({archivedNotes.length})</span>
          </button>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="input-search-archives"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm trong mục lưu trữ...' : 'Search archived notes...'}
              className="w-full rounded-xl pl-10 pr-8 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm cursor-pointer p-1"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: t('all') },
                { id: 'urgent', label: language === 'vi' ? 'Sắp hết hạn (≤ 5 ngày)' : 'Expiring Soon (≤ 5 days)' },
                { id: 'safe', label: language === 'vi' ? 'Còn hạn an toàn' : 'Safe (> 5 days)' }
              ].map((f) => (
                <button
                  key={f.id}
                  id={`filter-archive-${f.id}`}
                  onClick={() => setFilterOption(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border active:scale-95 ${
                    filterOption === f.id
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 shadow-2xs'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {sortOption === 'recent' 
                    ? (language === 'vi' ? 'Mới lưu trữ' : 'Recent') 
                    : sortOption === 'expiring' 
                    ? (language === 'vi' ? 'Sắp hết hạn' : 'Expiring soonest')
                    : sortOption === 'name' 
                    ? (language === 'vi' ? 'Tên A → Z' : 'Name A → Z') 
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
                      className="absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                    >
                      {[
                        { id: 'recent', label: language === 'vi' ? 'Mới lưu trữ' : 'Recent' },
                        { id: 'expiring', label: language === 'vi' ? 'Sắp hết hạn trước' : 'Expiring soonest' },
                        { id: 'name', label: language === 'vi' ? 'Tên A → Z' : 'Name A → Z' },
                        { id: 'oldest', label: language === 'vi' ? 'Cũ nhất' : 'Oldest' }
                      ].map(s => (
                        <button
                          key={s.id}
                          id={`sort-archive-${s.id}`}
                          onClick={() => {
                            setSortOption(s.id as any);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            sortOption === s.id 
                              ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold' 
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

        {/* Warning Banner */}
        <div className={`p-4 rounded-xl border flex items-start sm:items-center gap-3 ${
          isDark ? 'bg-[var(--accent-subtle)]/20 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]/90' : 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
        }`}>
          <AlertTriangle className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">{language === 'vi' ? 'Lưu ý về chính sách lưu trữ: ' : 'Archive Retention Policy: '}</span>
            {language === 'vi'
              ? <>Các ghi chú trong mục này sẽ tự động bị xóa vĩnh viễn sau <strong className="font-bold">30 ngày</strong> kể từ thời điểm chuyển vào. Hãy khôi phục lại Thư viện nếu bạn vẫn cần sử dụng.</>
              : <>Archived notes will be permanently purged after <strong className="font-bold">30 days</strong>. Restore them back to your Library anytime beforehand.</>}
          </div>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {filteredArchived.length === 0 ? (
          <div className={`h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl ${
            isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-white'
          }`}>
            <Archive className={`w-10 h-10 mb-3 ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`} />
            <h3 className={`text-sm font-bold ${'text-[var(--text-primary)]'}`}>
              {language === 'vi' ? 'Mục lưu trữ trống' : 'Archive is empty'}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Không có ghi chú nào đang chờ xoá.' : 'No notes are currently stored here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArchived.map((note) => {
              const isDanger = (note.archiveDaysLeft || 30) <= 5;
              return (
                <div
                  key={note.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 active:scale-[0.99] ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] hover:border-[var(--border-color)] shadow-xs'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold truncate ${'text-[var(--text-primary)]'}`}>
                          {note.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
                          isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                        }`}>
                          {note.category}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-1 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                        {note.summary}
                      </p>
                    </div>
                  </div>

                  {/* Right: Days left & Actions */}
                  <div className={`flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                    isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]'
                  }`}>
                    {/* Days left badge */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className={`w-3.5 h-3.5 ${isDanger ? 'text-[var(--status-error)]' : 'text-[var(--text-muted)]'}`} />
                      <span className={`font-semibold ${isDanger ? 'text-[var(--status-error)]' : isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                        {language === 'vi' ? `Còn ${note.archiveDaysLeft || 30} ngày` : `${note.archiveDaysLeft || 30} days left`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-restore-${note.id}`}
                        onClick={() => restoreNote(note.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] text-xs font-semibold border border-[var(--accent-primary)]/30 transition-colors cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('restore')}</span>
                      </button>

                      <button
                        id={`btn-delete-perm-${note.id}`}
                        onClick={() => setConfirmDeleteNote(note)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--status-error)]/15 hover:bg-[var(--status-error)]/25 text-[var(--status-error)] text-xs font-semibold border border-[var(--status-error)]/30 transition-colors cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('deletePermanently')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal - Single Note Delete */}
      {confirmDeleteNote && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmDeleteNote(null)}
          title={t('deletePermanently')}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[var(--status-error)]/30 border-[var(--status-error)]/40 text-[var(--status-error)]' : 'bg-[var(--status-error)] border-[var(--status-error)] text-[var(--status-error)]'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 text-[var(--status-error)]" />
              <span>
                {language === 'vi'
                  ? 'Hành động này không thể hoàn tác. Ghi chú sẽ bị gỡ bỏ vĩnh viễn khỏi database.'
                  : 'This cannot be undone. Note will be permanently removed from database.'}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Bạn có chắc chắn muốn xoá vĩnh viễn ghi chú ' : 'Are you sure you want to permanently delete '}
              <strong className="text-[var(--text-primary)]">"{confirmDeleteNote.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNotePermanently(confirmDeleteNote.id);
                  setConfirmDeleteNote(null);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--status-error)] hover:bg-[var(--status-error)] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[var(--status-error)]/20 active:scale-95"
              >
                {t('deletePermanently')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal - Empty Trash (All Notes) */}
      {isConfirmEmptyTrashOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsConfirmEmptyTrashOpen(false)}
          title={language === 'vi' ? 'Xác nhận dọn sạch thùng rác' : 'Confirm Empty Trash'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-xs ${
              isDark ? 'bg-[var(--status-error)]/30 border-[var(--status-error)]/40 text-[var(--status-error)]' : 'bg-[var(--status-error)] border-[var(--status-error)] text-[var(--status-error)]'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 text-[var(--status-error)]" />
              <span>
                {language === 'vi'
                  ? `Toàn bộ ${archivedNotes.length} ghi chú trong mục lưu trữ sẽ bị xóa vĩnh viễn khỏi database để giải phóng dung lượng và không thể khôi phục lại.`
                  : `All ${archivedNotes.length} archived notes will be permanently erased from the database to save storage.`}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' 
                ? 'Bạn có chắc chắn muốn dọn sạch toàn bộ thùng rác ngay bây giờ?' 
                : 'Are you sure you want to permanently empty all notes in the trash bin right now?'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await emptyTrash();
                  setIsConfirmEmptyTrashOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--status-error)] hover:bg-[var(--status-error)] text-white text-xs font-semibold cursor-pointer shadow-md shadow-[var(--status-error)]/20 active:scale-95"
              >
                {language === 'vi' ? 'Dọn sạch tất cả' : 'Empty All'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
