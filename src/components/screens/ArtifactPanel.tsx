import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Download, 
  Code, 
  Eye, 
  FileText, 
  HelpCircle, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';

interface ArtifactPanelProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ note, isOpen, onClose }) => {
  const { isArtifactFullscreen, setIsArtifactFullscreen, addToast, theme, language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<{ [key: string]: boolean }>({
    docx: true,
    pdf: true,
    md: true,
    html: false
  });
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  if (!note || !isOpen) return null;

  const isDark = theme === 'dark';

  const handleCopy = () => {
    const textToCopy = activeTab === 'code' 
      ? note.rawMarkdown 
      : `${note.title}\n\n${note.summary}\n\n${note.rawMarkdown}`;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    addToast(t('copied'), t('toastCopied'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const triggerDownloadFile = async (format: 'docx' | 'md' | 'html' | 'pdf') => {
    try {
      const response = await fetch('/api/notes/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          note: {
            title: note.title,
            method: note.method,
            summary: note.summary,
            category: note.category,
            keywords: note.keywords,
            coreQuestions: note.coreQuestions,
            content: note.content,
            rawMarkdown: note.rawMarkdown,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Export ${format.toUpperCase()} failed`);
      }

      if (format === 'pdf') {
        // Open printable window for instant browser PDF print/save
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 300);
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (note.title || 'zero-ai-note')
        .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
        .substring(0, 50);
      a.download = `${safeTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export download error:', err);
      addToast(
        language === 'vi' ? 'Lỗi xuất file' : 'Export Failed',
        `${language === 'vi' ? 'Không thể tải định dạng' : 'Failed to export'}: ${format.toUpperCase()}`,
        'error'
      );
    }
  };

  const handleDownload = async () => {
    setIsDownloadOpen(false);
    const activeFormats = Object.entries(selectedFormats)
      .filter(([_, val]) => val)
      .map(([k]) => k as 'docx' | 'md' | 'html' | 'pdf');
    
    if (activeFormats.length === 0) {
      addToast(
        language === 'vi' ? 'Chưa chọn định dạng' : 'No format chosen', 
        language === 'vi' ? 'Vui lòng tích chọn ít nhất một định dạng tải về.' : 'Please select at least one format.', 
        'warning'
      );
      return;
    }

    setIsExporting(true);
    addToast(
      language === 'vi' ? 'Đang tạo tệp tải xuống' : 'Preparing download file', 
      `${language === 'vi' ? 'Đang kết xuất:' : 'Rendering:'} ${activeFormats.map(f => f.toUpperCase()).join(', ')}...`, 
      'info'
    );

    for (const fmt of activeFormats) {
      await triggerDownloadFile(fmt);
    }

    setIsExporting(false);
    addToast(
      language === 'vi' ? 'Tải xuống thành công' : 'Download Complete', 
      `"${note.title}" ${language === 'vi' ? 'đã được lưu về máy.' : 'saved successfully.'}`, 
      'success'
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`flex flex-col transition-colors ${
          isArtifactFullscreen 
            ? 'fixed inset-0 z-50 border-none' 
            : 'fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-30 w-full lg:w-[480px] xl:w-[540px] shrink-0 h-full border-l'
        } ${
          isDark 
            ? 'bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]' 
            : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-xl'
        }`}
      >
        {/* Panel Header */}
        <div className={`h-14 px-3 sm:px-4 flex items-center justify-between border-b shrink-0 transition-colors ${
          isDark ? 'bg-[var(--bg-hover)] border-[var(--border-color)]' : 'bg-[var(--bg-app)] border-[var(--border-color)]'
        }`}>
          {/* Tabs: Preview / Code */}
          <div className={`flex p-0.5 rounded-xl border ${
            isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
          }`}>
            <button
              id="artifact-tab-preview"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                activeTab === 'preview'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PREVIEW</span>
            </button>
            <button
              id="artifact-tab-code"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                activeTab === 'code'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>CODE (MD)</span>
            </button>
          </div>

          {/* Action Tools: Copy, Multi-Format Download Dropdown, Fullscreen, Close */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Main Action 1: Copy to Clipboard */}
            <button
              id="btn-artifact-copy"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                isCopied
                  ? 'bg-[var(--status-success)]/15 border-[var(--status-success)]/40 text-[var(--status-success)]'
                  : isDark 
                    ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]' 
                    : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-2xs'
              }`}
              title={language === 'vi' ? 'Sao chép ghi chú' : 'Copy note'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isCopied ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
              </span>
            </button>

            {/* Main Action 2: Multi-format Download Dropdown */}
            <div className="relative">
              <button
                id="btn-artifact-download-dropdown"
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                disabled={isExporting}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer active:scale-95 shadow-xs`}
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{language === 'vi' ? 'Tải file' : 'Export'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDownloadOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsDownloadOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className={`absolute right-0 mt-1.5 w-60 rounded-2xl border p-2.5 z-40 space-y-2 shadow-2xl ${
                        isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        {language === 'vi' ? 'Chọn định dạng tải về' : 'Select formats to export'}
                      </div>
                      
                      <div className="space-y-1">
                        {[
                          { id: 'pdf', label: 'PDF Document (.pdf)', desc: 'Chuẩn in ấn giữ nguyên bố cục' },
                          { id: 'docx', label: 'Microsoft Word (.docx)', desc: 'Bố cục Cornell & Outline thật' },
                          { id: 'md', label: 'Markdown (.md)', desc: 'Thuần văn bản GFM tương thích cao' },
                          { id: 'html', label: 'Web Page (.html)', desc: 'Độc lập kèm CSS styling' },
                        ].map((fmt) => (
                          <label
                            key={fmt.id}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                              selectedFormats[fmt.id]
                                ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)]/40 text-[var(--text-primary)]'
                                : isDark ? 'border-transparent hover:bg-[var(--bg-hover)]' : 'border-transparent hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedFormats[fmt.id]}
                              onChange={(e) => setSelectedFormats(prev => ({ ...prev, [fmt.id]: e.target.checked }))}
                              className="mt-0.5 rounded border-gray-400 text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">{fmt.label}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{fmt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <button
                        onClick={handleDownload}
                        className="w-full py-2 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        {language === 'vi' ? 'Tải ngay các file đã chọn' : 'Download Selected Files'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle Fullscreen button */}
            <button
              onClick={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title={isArtifactFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isArtifactFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Panel button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              title="Đóng panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          {activeTab === 'code' ? (
            /* Code / Markdown View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-muted)]">content_structured.rawMarkdown</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold">
                  {note.method.toUpperCase()}
                </span>
              </div>
              <pre className={`p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border select-text ${
                isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)] text-gray-300' : 'bg-gray-50 border-[var(--border-color)] text-gray-800'
              }`}>
                {note.rawMarkdown || note.summary}
              </pre>
            </div>
          ) : (
            /* Rich Preview View */
            <div className="space-y-6 select-text">
              {/* Note Header & Metadata Badge */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 uppercase tracking-wide">
                    {note.method.toUpperCase()} METHOD
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}>
                    {note.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {note.date}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] leading-snug">
                  {note.title}
                </h1>
              </div>

              {/* Executive Summary Callout */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-blue-50/50 border-blue-100'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Tóm tắt tổng quan' : 'Executive Summary'}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {note.summary}
                </p>
              </div>

              {/* Keywords Tag Cloud */}
              {note.keywords && note.keywords.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {language === 'vi' ? 'Từ khóa cốt lõi' : 'Core Keywords'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {note.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                          isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)] text-gray-300' : 'bg-white border-gray-200 text-gray-700 shadow-2xs'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Recall Questions */}
              {note.coreQuestions && note.coreQuestions.length > 0 && (
                <div className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-amber-50/40 border-amber-100'
                }`}>
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{language === 'vi' ? 'Câu hỏi ôn tập chủ động' : 'Active Recall Questions'}</span>
                  </span>
                  <ul className="space-y-1.5">
                    {note.coreQuestions.map((q, idx) => (
                      <li key={idx} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="font-bold text-[var(--accent-primary)] shrink-0">{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured Method View: Cornell 2-Column or Outline */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  {language === 'vi' ? 'Nội dung phân tích chi tiết' : 'Structured Content'}
                </h3>

                {note.method === 'cornell' ? (
                  /* Cornell 2-Column Table */
                  <div className="space-y-3">
                    {note.content.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl border overflow-hidden flex flex-col sm:flex-row ${
                          isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-2xs'
                        }`}
                      >
                        {/* Left Column: Cue / Keyword */}
                        <div className={`p-3.5 sm:w-1/3 border-b sm:border-b-0 sm:border-r shrink-0 ${
                          isDark ? 'bg-white/3 border-[var(--border-color)]' : 'bg-gray-50/80 border-[var(--border-color)]'
                        }`}>
                          <span className="text-xs font-bold text-[var(--accent-primary)]">
                            {sec.cue || sec.title}
                          </span>
                        </div>

                        {/* Right Column: Detailed Note */}
                        <div className="p-3.5 flex-1 space-y-2">
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">
                            {sec.title}
                          </h4>
                          {sec.definition && (
                            <p className="text-xs italic text-[var(--text-muted)]">
                              {sec.definition}
                            </p>
                          )}
                          {sec.text && (
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                              {sec.text}
                            </p>
                          )}
                          {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                            <ul className="space-y-1 pt-1">
                              {sec.bulletPoints.map((bp, bi) => (
                                <li key={bi} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                                  <span className="text-[var(--accent-primary)] font-bold">•</span>
                                  <span>{bp}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Standard Outline / Hierarchical Sections */
                  <div className="space-y-4">
                    {note.content.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)] shadow-2xs'
                        }`}
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{sec.title}</span>
                        </h4>

                        {sec.definition && (
                          <p className="text-xs italic text-[var(--text-muted)] pl-7">
                            {sec.definition}
                          </p>
                        )}

                        {sec.text && (
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                            {sec.text}
                          </p>
                        )}

                        {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                          <ul className="space-y-1.5 pl-7 pt-1">
                            {sec.bulletPoints.map((bp, bi) => (
                              <li key={bi} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                                <span className="text-[var(--accent-primary)] font-bold">•</span>
                                <span>{bp}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Summary Section */}
              {note.content.summaryText && (
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-1.5">
                    {language === 'vi' ? '🎯 Kết luận & Tóm tắt cốt lõi' : '🎯 Final Key Takeaways'}
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {note.content.summaryText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
