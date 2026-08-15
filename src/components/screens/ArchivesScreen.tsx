import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Search,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { Modal } from '../common/Modal';

export const ArchivesScreen: React.FC = () => {
  const { archivedNotes, restoreNote, deleteNotePermanently, theme, language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<NoteItem | null>(null);

  const isDark = theme === 'dark';

  const filteredArchived = archivedNotes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q);
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
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${'text-[var(--text-primary)]'}`}>
              {t('archivesTitle')}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' 
                ? 'Danh sách ghi chú tạm thời bị loại bỏ hoặc hoàn thành' 
                : 'Archived notes and trash bin pending deletion'}
            </p>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'
            }`} />
            <input
              id="input-search-archives"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm trong mục lưu trữ...' : 'Search archived notes...'}
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] ${
                isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]'
              }`}
            />
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

      {/* Confirmation Modal */}
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
                  ? 'Hành động này không thể hoàn tác. Ghi chú sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống lưu trữ đám mây.'
                  : 'This cannot be undone. All extracted insights and raw notes will be permanently erased.'}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Bạn có chắc chắn muốn xoá ghi chú ' : 'Are you sure you want to delete '}
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
    </div>
  );
};
