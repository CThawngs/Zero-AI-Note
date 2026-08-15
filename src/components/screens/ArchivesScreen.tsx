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
      isDark ? 'bg-[#1F1B18] text-[#F7F4EE]' : 'bg-[#FAF7F2] text-[#26221D]'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors ${
        isDark ? 'border-[#38322B] bg-[#24201C]/80' : 'border-[#E6E0D6] bg-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
              {t('archivesTitle')}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
              {language === 'vi' 
                ? 'Danh sách ghi chú tạm thời bị loại bỏ hoặc hoàn thành' 
                : 'Archived notes and trash bin pending deletion'}
            </p>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#8C857B]' : 'text-[#9E958A]'
            }`} />
            <input
              id="input-search-archives"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm trong mục lưu trữ...' : 'Search archived notes...'}
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-amber-500 ${
                isDark ? 'bg-[#26211C] border-[#38322B] text-white placeholder-[#8A8177]' : 'bg-[#FAF7F2] border-[#E2DBD0] text-[#26221D] placeholder-[#9E958A]'
              }`}
            />
          </div>
        </div>

        {/* Warning Banner */}
        <div className={`p-4 rounded-xl border flex items-start sm:items-center gap-3 ${
          isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200/90' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
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
            isDark ? 'border-[#38322B] bg-[#26211C]' : 'border-[#DDD5C8] bg-white'
          }`}>
            <Archive className={`w-10 h-10 mb-3 ${isDark ? 'text-[#8C857B]' : 'text-[#DDD5C8]'}`} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
              {language === 'vi' ? 'Mục lưu trữ trống' : 'Archive is empty'}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8C857B]' : 'text-[#6E665D]'}`}>
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
                    isDark ? 'bg-[#26211C] border-[#38322B] hover:border-[#4E4437]' : 'bg-white border-[#E6E0D6] hover:border-[#CCC2B2] shadow-xs'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isDark ? 'bg-[#322B24] text-[#A8A199]' : 'bg-[#F2ECE3] text-[#6E665D]'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#26221D]'}`}>
                          {note.title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${
                          isDark ? 'bg-[#322B24] text-[#A8A199]' : 'bg-[#F2ECE3] text-[#6E665D]'
                        }`}>
                          {note.category}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 line-clamp-1 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                        {note.summary}
                      </p>
                    </div>
                  </div>

                  {/* Right: Days left & Actions */}
                  <div className={`flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                    isDark ? 'border-[#38322B]' : 'border-[#EAE4D9]'
                  }`}>
                    {/* Days left badge */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className={`w-3.5 h-3.5 ${isDanger ? 'text-rose-500' : 'text-[#8C857B]'}`} />
                      <span className={`font-semibold ${isDanger ? 'text-rose-500' : isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                        {language === 'vi' ? `Còn ${note.archiveDaysLeft || 30} ngày` : `${note.archiveDaysLeft || 30} days left`}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-restore-${note.id}`}
                        onClick={() => restoreNote(note.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-600 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('restore')}</span>
                      </button>

                      <button
                        id={`btn-delete-perm-${note.id}`}
                        onClick={() => setConfirmDeleteNote(note)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-600 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer active:scale-95"
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
              isDark ? 'bg-rose-950/30 border-rose-800/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
              <span>
                {language === 'vi'
                  ? 'Hành động này không thể hoàn tác. Ghi chú sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống lưu trữ đám mây.'
                  : 'This cannot be undone. All extracted insights and raw notes will be permanently erased.'}
              </span>
            </div>

            <p className={`text-xs ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
              {language === 'vi' ? 'Bạn có chắc chắn muốn xoá ghi chú ' : 'Are you sure you want to delete '}
              <strong className={isDark ? 'text-white' : 'text-[#26221D]'}>"{confirmDeleteNote.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteNote(null)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-95 ${
                  isDark ? 'bg-[#322B24] text-[#D8D2C9] hover:bg-[#3D352D]' : 'bg-[#EAE4D9] text-[#4A4239] hover:bg-[#DDD5C8]'
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
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
