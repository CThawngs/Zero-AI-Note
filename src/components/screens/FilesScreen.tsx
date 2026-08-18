import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowUpDown,
  Upload, 
  FileText, 
  Video, 
  Headphones, 
  Image as ImageIcon, 
  ExternalLink, 
  Trash2, 
  Download, 
  HardDrive,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttachSourceModal } from '../modals/AttachSourceModal';

export const FilesScreen: React.FC = () => {
  const { files, user, upgradeToPro, deleteSourceFile, openNoteDetail, notes, addToast, theme, language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'name' | 'size'>('recent');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isDark = theme === 'dark';

  // Accurate Real-time Cloud Storage calculations
  const totalBytesUsed = files.reduce((acc, file) => {
    if (typeof file.sizeBytes === 'number' && file.sizeBytes > 0) return acc + file.sizeBytes;
    const match = file.size?.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'GB') return acc + val * 1024 * 1024 * 1024;
      if (unit === 'MB') return acc + val * 1024 * 1024;
      if (unit === 'KB') return acc + val * 1024;
      return acc + val;
    }
    return acc;
  }, 0);

  // Storage Quota by Plan: Free (1 GB), Pro (10 GB), Ultra (50 GB)
  const quotaBytes = user.plan === 'ultra'
    ? 50 * 1024 * 1024 * 1024
    : user.plan === 'pro'
    ? 10 * 1024 * 1024 * 1024
    : 1 * 1024 * 1024 * 1024;

  const usedPercentage = Math.min(100, Math.max(0, (totalBytesUsed / quotaBytes) * 100));

  const formatStorage = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    if (bytes > 0) {
      return `${bytes} B`;
    }
    return '0 MB';
  };

  const formatQuota = (bytes: number) => {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  let filteredFiles = files.filter(f => {
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.linkedNoteTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredFiles = [...filteredFiles].sort((a, b) => {
    if (sortOption === 'name') return a.name.localeCompare(b.name);
    if (sortOption === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    if (sortOption === 'oldest') {
      const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return timeA - timeB;
    }
    // Default 'recent'
    const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return timeB - timeA;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'audio': return <Headphones className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-[var(--accent-primary)]" />;
      default: return <FileText className="w-4 h-4 text-[var(--accent-primary)]" />;
    }
  };

  const getStatusBadge = (status: string, text: string) => {
    if (status === 'processed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>{text}</span>
        </span>
      );
    }
    if (status === 'auto-delete') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--status-warning)]/15 text-[var(--status-warning)] border border-[var(--status-warning)]/20">
          <Clock className="w-3 h-3" />
          <span>{text}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--status-error)]/15 text-[var(--status-error)] border border-[var(--status-error)]/20">
        <AlertCircle className="w-3 h-3" />
        <span>{text}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header */}
      <div className="p-4 sm:p-6 pb-4 border-b space-y-4 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
              {t('filesTitle')}
            </h2>
            <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
              {language === 'vi' 
                ? 'Toàn bộ tài liệu PDF, ghi âm và video được dùng để AI trích xuất ghi chú' 
                : 'All raw PDFs, audio recordings, and videos used for note extraction'}
            </p>
          </div>

          <button
            id="btn-upload-new-file"
            onClick={() => setIsUploadModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] rounded-xl text-xs font-semibold shadow-md shadow-[var(--accent-primary)]/25 transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{t('uploadNewFile')}</span>
          </button>
        </div>

        {/* Storage usage bar */}
        <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-app)] border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-[var(--text-primary)]">{t('cloudStorageUsage')}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                  {user.plan === 'ultra' ? 'Gói Ultra (50 GB)' : user.plan === 'pro' ? 'Gói Pro (10 GB)' : 'Gói Miễn phí (1 GB)'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {language === 'vi' 
                  ? `Đã dùng ${formatStorage(totalBytesUsed)} trên tổng số ${formatQuota(quotaBytes)} (${usedPercentage < 0.1 && totalBytesUsed > 0 ? '< 0.1' : usedPercentage.toFixed(1)}%) • ${files.length} tệp` 
                  : `Used ${formatStorage(totalBytesUsed)} of ${formatQuota(quotaBytes)} (${usedPercentage < 0.1 && totalBytesUsed > 0 ? '< 0.1' : usedPercentage.toFixed(1)}%) • ${files.length} files`}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="w-full h-2.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
              <div 
                className="h-full bg-[var(--accent-primary)] transition-all duration-500 rounded-full" 
                style={{ width: `${totalBytesUsed > 0 ? Math.max(2, usedPercentage) : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>0 GB</span>
              <span className="font-semibold text-[var(--text-secondary)]">{usedPercentage.toFixed(1)}%</span>
              <span>{formatQuota(quotaBytes)}</span>
            </div>
          </div>
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="input-search-files"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm tệp nguồn...' : 'Search files...'}
              className="w-full rounded-xl pl-10 pr-4 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: t('all') },
                { id: 'pdf', label: 'PDF' },
                { id: 'video', label: 'Video' },
                { id: 'audio', label: 'Audio' },
                { id: 'image', label: language === 'vi' ? 'Ảnh' : 'Image' }
              ].map((f) => (
                <button
                  key={f.id}
                  id={`filter-file-${f.id}`}
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap border active:scale-95 ${
                    typeFilter === f.id
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
                id="files-sort-btn"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {sortOption === 'recent' 
                    ? (language === 'vi' ? 'Mới nhất' : 'Recent') 
                    : sortOption === 'oldest' 
                    ? (language === 'vi' ? 'Cũ nhất' : 'Oldest')
                    : sortOption === 'name' 
                    ? (language === 'vi' ? 'Tên A → Z' : 'Name A → Z')
                    : (language === 'vi' ? 'Dung lượng lớn' : 'Size (Largest)')}
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
                        { id: 'recent', label: language === 'vi' ? 'Mới nhất' : 'Recent' },
                        { id: 'oldest', label: language === 'vi' ? 'Cũ nhất' : 'Oldest' },
                        { id: 'name', label: language === 'vi' ? 'Tên A → Z' : 'Name A → Z' },
                        { id: 'size', label: language === 'vi' ? 'Dung lượng lớn' : 'Size (Largest)' }
                      ].map(s => (
                        <button
                          key={s.id}
                          id={`sort-file-${s.id}`}
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
      </div>

      {/* Files Display: Responsive (Card list on mobile, Table on desktop) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {filteredFiles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl border-[var(--border-color)] bg-[var(--bg-card)]">
            <FileText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Không tìm thấy tệp nguồn nào' : 'No source files found'}
            </h3>
            <p className="text-xs mt-1 text-[var(--text-muted)]">
              {language === 'vi' ? 'Thử tải lên tài liệu mới hoặc chọn bộ lọc loại tệp khác.' : 'Try uploading a new document or changing file type filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl border flex flex-col gap-3 transition-colors bg-[var(--bg-card)] border-[var(--border-color)] shadow-xs"
                >
                  {/* Card Header: Icon, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl border shrink-0 bg-[var(--bg-app)] border-[var(--border-color)]">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate text-[var(--text-primary)]">
                          {file.name}
                        </h4>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {file.size} • {file.uploadDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Labeled rows */}
                  <div className="space-y-1.5 pt-2 border-t text-xs border-[var(--border-color)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">
                        {language === 'vi' ? 'Trạng thái:' : 'Status:'}
                      </span>
                      <div>{getStatusBadge(file.status, file.statusText)}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">
                        {language === 'vi' ? 'Ghi chú liên kết:' : 'Linked note:'}
                      </span>
                      <div>
                        {file.linkedNoteId ? (
                          <button
                            onClick={() => {
                              const target = notes.find(n => n.id === file.linkedNoteId);
                              if (target) openNoteDetail(target);
                            }}
                            className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 max-w-[180px] truncate cursor-pointer font-medium"
                          >
                            <span className="truncate">{file.linkedNoteTitle}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                        ) : (
                          <span className="italic text-xs text-[var(--text-muted)]">
                            {language === 'vi' ? 'Chưa liên kết' : 'Unlinked'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => {
                        addToast(language === 'vi' ? 'Đang tải file' : 'Downloading file', `"${file.name}"...`);
                      }}
                      className="min-h-[38px] px-3 flex items-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer active:scale-95 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Tải xuống' : 'Download'}</span>
                    </button>
                    <button
                      onClick={() => deleteSourceFile(file.id)}
                      className="min-h-[38px] px-3 flex items-center gap-1.5 rounded-xl bg-[var(--status-error)]/15 text-[var(--status-error)] border border-[var(--status-error)]/30 hover:bg-[var(--status-error)]/25 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('delete')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (md+) */}
            <div className="hidden md:block rounded-2xl border overflow-x-auto border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="border-b font-semibold uppercase text-xs tracking-wider bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-5 py-3.5">{language === 'vi' ? 'Tên Tệp' : 'File Name'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Kích Thước' : 'Size'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Ngày Tải Lên' : 'Uploaded'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Ghi Chú Liên Kết' : 'Linked Note'}</th>
                    <th className="px-4 py-3.5">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                    <th className="px-4 py-3.5 text-right">{language === 'vi' ? 'Thao Tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-secondary)]">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      {/* File Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
                            {getFileIcon(file.type)}
                          </div>
                          <span className="font-semibold max-w-[220px] truncate text-[var(--text-primary)]">
                            {file.name}
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5 font-mono text-xs text-[var(--text-muted)]">
                        {file.size}
                      </td>

                      {/* Upload date */}
                      <td className="px-4 py-3.5 text-[var(--text-muted)]">
                        {file.uploadDate}
                      </td>

                      {/* Linked Note */}
                      <td className="px-4 py-3.5">
                        {file.linkedNoteId ? (
                          <button
                            onClick={() => {
                              const target = notes.find(n => n.id === file.linkedNoteId);
                              if (target) openNoteDetail(target);
                            }}
                            className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 max-w-[180px] truncate cursor-pointer font-medium"
                          >
                            <span className="truncate">{file.linkedNoteTitle}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                        ) : (
                          <span className="italic text-xs text-[var(--text-muted)]">
                            {language === 'vi' ? 'Chưa liên kết' : 'Unlinked'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {getStatusBadge(file.status, file.statusText)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              addToast(language === 'vi' ? 'Đang tải file' : 'Downloading file', `"${file.name}"...`);
                            }}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                            title={language === 'vi' ? 'Tải xuống tệp gốc' : 'Download file'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSourceFile(file.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AttachSourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAttach={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
