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
  Loader2,
  Lock,
  FileArchive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { generateHtmlExport, generateInteractiveHtmlExport } from '../../../lib/export/html';

interface ArtifactPanelProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ note, isOpen, onClose }) => {
  const { isArtifactFullscreen, setIsArtifactFullscreen, addToast, user, setCurrentScreen, theme, language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'markdown' | 'static-html' | 'interactive-html' | 'code'>('markdown');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMultiExportModalOpen, setIsMultiExportModalOpen] = useState(false);
  const [selectedMultiFormats, setSelectedMultiFormats] = useState<{ [key: string]: boolean }>({
    docx: true,
    pdf: true,
    md: true,
    html: true,
  });

  if (!note || !isOpen) return null;

  const isDark = theme === 'dark';
  const userPlan = (user.plan || 'free').toLowerCase();
  const isProOrUltra = userPlan === 'pro' || userPlan === 'ultra' || user.role === 'admin';
  const isUltra = userPlan === 'ultra' || user.role === 'admin';

  const handleCopy = () => {
    const textToCopy = activeTab === 'code' 
      ? note.rawMarkdown 
      : `${note.title}\n\n${note.summary}\n\n${note.rawMarkdown}`;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    addToast(t('copied'), t('toastCopied'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const triggerDownloadFile = async (format: 'docx' | 'md' | 'html' | 'interactive-html' | 'pdf') => {
    try {
      setIsExporting(true);
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
        setIsExporting(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (note.title || 'zero-ai-note')
        .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
        .substring(0, 50);
      const ext = format === 'interactive-html' ? 'interactive.html' : format;
      a.download = `${safeTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsExporting(false);

      addToast(
        language === 'vi' ? 'Tải xuống thành công' : 'Export Complete',
        `${note.title} (.${ext})`,
        'success'
      );
    } catch (err) {
      console.error('Export download error:', err);
      setIsExporting(false);
      addToast(
        language === 'vi' ? 'Lỗi xuất file' : 'Export Failed',
        err instanceof Error ? err.message : 'Error exporting file',
        'error'
      );
    }
  };

  const handleMultiExport = async (packageZip: boolean) => {
    const activeFormats = Object.entries(selectedMultiFormats)
      .filter(([_, val]) => val)
      .map(([k]) => k);

    if (activeFormats.length === 0) {
      addToast(
        language === 'vi' ? 'Chưa chọn định dạng' : 'No format selected',
        language === 'vi' ? 'Vui lòng chọn ít nhất một định dạng tải về.' : 'Please select at least one format.',
        'warning'
      );
      return;
    }

    try {
      setIsExporting(true);
      setIsMultiExportModalOpen(false);

      if (packageZip) {
        const response = await fetch('/api/notes/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: 'zip',
            formats: activeFormats,
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

        if (!response.ok) throw new Error('ZIP bundling failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = (note.title || 'zero-ai-note')
          .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
          .substring(0, 50);
        a.download = `${safeTitle}_bundle.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast(
          language === 'vi' ? 'Đóng gói ZIP thành công' : 'ZIP Bundle Created',
          `${safeTitle}_bundle.zip`,
          'success'
        );
      } else {
        for (const fmt of activeFormats) {
          await triggerDownloadFile(fmt as any);
        }
      }
    } catch (err) {
      console.error('Multi export error:', err);
      addToast(
        language === 'vi' ? 'Lỗi xuất file đa định dạng' : 'Multi-export error',
        err instanceof Error ? err.message : 'Failed to export',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
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
            : 'fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-30 w-full lg:w-[500px] xl:w-[580px] shrink-0 h-full border-l'
        } ${
          isDark 
            ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' 
            : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-xl'
        }`}
      >
        {/* Panel Header */}
        <div className={`h-14 px-3 sm:px-4 flex items-center justify-between border-b shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-app)]`}>
          {/* Tabs: Markdown / HTML Tĩnh / HTML Tương tác / Code */}
          <div className="flex p-0.5 rounded-xl border bg-[var(--bg-card)] border-[var(--border-color)] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'markdown'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Markdown
            </button>

            <button
              onClick={() => setActiveTab('static-html')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'static-html'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>HTML Tĩnh</span>
              {!isProOrUltra && <Lock className="w-3 h-3 text-amber-500" />}
            </button>

            <button
              onClick={() => setActiveTab('interactive-html')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'interactive-html'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>HTML Tương Tác</span>
              {!isUltra && <Lock className="w-3 h-3 text-amber-500" />}
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Raw
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Copy */}
            <button
              id="btn-artifact-copy"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
              title={language === 'vi' ? 'Sao chép ghi chú' : 'Copy note'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isCopied ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
              </span>
            </button>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                id="btn-artifact-download-dropdown"
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer active:scale-95 shadow-xs"
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
                      className="absolute right-0 mt-1.5 w-60 rounded-2xl border p-2 z-40 space-y-1 shadow-2xl bg-[var(--bg-card)] border-[var(--border-color)]"
                    >
                      {/* Multi-Export for Ultra */}
                      {isUltra ? (
                        <button
                          onClick={() => {
                            setIsDownloadOpen(false);
                            setIsMultiExportModalOpen(true);
                          }}
                          className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold mb-1 border border-[var(--accent-primary)]/30 text-xs"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileArchive className="w-4 h-4" />
                            <span>Multi-Export & ZIP</span>
                          </span>
                          <span className="text-[10px] uppercase bg-[var(--accent-primary)] text-[var(--accent-text)] px-1.5 py-0.5 rounded font-extrabold">Ultra</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsDownloadOpen(false);
                            setCurrentScreen('pricing');
                          }}
                          className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] mb-1 text-xs"
                        >
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Multi-Export & ZIP</span>
                          </span>
                          <span className="text-[10px] text-amber-500 font-bold">Ultra</span>
                        </button>
                      )}

                      {[
                        { id: 'pdf', label: 'PDF Document (.pdf)', desc: 'Chuẩn in ấn giữ nguyên bố cục', planReq: 'free' },
                        { id: 'docx', label: 'Word Document (.docx)', desc: 'Bố cục Cornell & Outline', planReq: 'free' },
                        { id: 'md', label: 'Markdown (.md)', desc: 'Thuần văn bản GFM', planReq: 'free' },
                        { id: 'html', label: 'Trang Web HTML (.html)', desc: 'Độc lập kèm CSS styling', planReq: 'pro' },
                      ].map(fmt => {
                        const isLocked = fmt.planReq === 'pro' && !isProOrUltra;

                        return (
                          <button
                            key={fmt.id}
                            onClick={() => {
                              setIsDownloadOpen(false);
                              if (isLocked) {
                                setCurrentScreen('pricing');
                                addToast(
                                  language === 'vi' ? 'Yêu cầu gói Pro' : 'Pro Plan Required',
                                  language === 'vi' ? 'Định dạng HTML Webpage dành cho người dùng gói Pro trở lên.' : 'HTML export is exclusive to Pro and Ultra.',
                                  'warning'
                                );
                              } else {
                                triggerDownloadFile(fmt.id as any);
                              }
                            }}
                            className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold">{fmt.label}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{fmt.desc}</span>
                            </div>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              className="p-1.5 rounded-xl border transition-colors cursor-pointer border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title={isArtifactFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isArtifactFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border transition-colors cursor-pointer border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'markdown' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="border-b pb-4 border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    {note.category} • {note.method.toUpperCase()} NOTE
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {note.title}
                </h2>
              </div>

              {/* Overview */}
              <div className="p-4 rounded-2xl border bg-[var(--bg-app)] border-[var(--border-color)] text-xs sm:text-sm leading-relaxed">
                <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                  📌 {language === 'vi' ? 'Tóm Tắt Tổng Quan' : 'Executive Overview'}
                </h4>
                <p className="text-[var(--text-primary)]">{note.summary}</p>
              </div>

              {/* Keywords */}
              {note.keywords && note.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {note.keywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg border text-xs font-medium bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Sections Breakdown */}
              {note.content?.sections?.map((sec, idx) => (
                <div key={idx} className="p-4 rounded-2xl border space-y-2.5 bg-[var(--bg-app)] border-[var(--border-color)]">
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
                    <span className="w-1.5 h-4 bg-[var(--accent-primary)] rounded-full" />
                    <span>{idx + 1}. {sec.title}</span>
                  </h3>

                  {sec.definition && (
                    <div className="p-3 rounded-xl border-l-4 border-[var(--accent-primary)] text-xs bg-[var(--accent-subtle)]/40 text-[var(--text-primary)] italic">
                      {sec.definition}
                    </div>
                  )}

                  {sec.text && (
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
                      {sec.text}
                    </p>
                  )}

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-1 pl-4 text-xs sm:text-sm text-[var(--text-secondary)] list-disc">
                      {sec.bulletPoints.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'static-html' && (
            <div className="h-full">
              {!isProOrUltra ? (
                <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-app)] border-[var(--border-color)]">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Xem Trước HTML Tĩnh Bị Khóa' : 'Static HTML Preview Locked'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    {language === 'vi' 
                      ? 'Nâng cấp lên gói Pro để mở khóa giao diện xem trước HTML layout chuẩn CSS và xuất trang web tĩnh.' 
                      : 'Upgrade to Pro to unlock standard CSS styled HTML preview and exports.'}
                  </p>
                  <button
                    onClick={() => setCurrentScreen('pricing')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  >
                    {language === 'vi' ? 'Nâng cấp lên Pro' : 'Upgrade to Pro'}
                  </button>
                </div>
              ) : (
                <iframe
                  srcDoc={generateHtmlExport({
                    title: note.title,
                    method: note.method,
                    summary: note.summary,
                    category: note.category,
                    keywords: note.keywords,
                    coreQuestions: note.coreQuestions,
                    content: note.content,
                    rawMarkdown: note.rawMarkdown,
                  })}
                  title="Static HTML Preview"
                  className="w-full h-[550px] rounded-xl border border-[var(--border-color)] bg-white"
                />
              )}
            </div>
          )}

          {activeTab === 'interactive-html' && (
            <div className="h-full">
              {!isUltra ? (
                <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-app)] border-[var(--border-color)]">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Xem Trước HTML Tương Tác Động Bị Khóa' : 'Interactive HTML Preview Locked'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    {language === 'vi' 
                      ? 'Đặc quyền Ultra: Chạy JavaScript tương tác, đóng/mở thẻ, Flashcard Active Recall và xuất file offline 100%.' 
                      : 'Exclusive to Ultra: Interactive JS widgets, collapsible sections, Active Recall flashcards, and 100% offline standalone files.'}
                  </p>
                  <button
                    onClick={() => setCurrentScreen('pricing')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  >
                    {language === 'vi' ? 'Nâng cấp lên Ultra' : 'Upgrade to Ultra'}
                  </button>
                </div>
              ) : (
                <iframe
                  srcDoc={generateInteractiveHtmlExport({
                    title: note.title,
                    method: note.method,
                    summary: note.summary,
                    category: note.category,
                    keywords: note.keywords,
                    coreQuestions: note.coreQuestions,
                    content: note.content,
                    rawMarkdown: note.rawMarkdown,
                  })}
                  title="Interactive HTML Preview"
                  className="w-full h-[550px] rounded-xl border border-[var(--border-color)]"
                />
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="p-4 rounded-2xl border font-mono text-xs overflow-x-auto bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
              <pre className="whitespace-pre-wrap">{note.rawMarkdown}</pre>
            </div>
          )}
        </div>

        {/* Multi-Export Modal (Ultra exclusive) */}
        {isMultiExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <div className="flex items-center justify-between border-b pb-3 border-[var(--border-color)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? '📦 Checkbox Multi-Export (Độc Quyền Ultra)' : '📦 Checkbox Multi-Export (Ultra)'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {language === 'vi' ? 'Chọn các định dạng muốn kết xuất cùng lúc' : 'Select formats to export simultaneously'}
                  </p>
                </div>
                <button
                  onClick={() => setIsMultiExportModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'pdf', label: 'PDF Document (.pdf)', desc: 'Chuẩn in ấn giữ nguyên bố cục bảng Cornell' },
                  { id: 'docx', label: 'Word Document (.docx)', desc: 'Bố cục Microsoft Word có thể biên tập lại' },
                  { id: 'md', label: 'Markdown (.md)', desc: 'Văn bản thuần tương thích Obsidian / Notion' },
                  { id: 'html', label: 'Single-file Interactive HTML (.html)', desc: 'Nhúng trọn bộ JS/CSS hoạt động offline 100%' },
                ].map(fmt => (
                  <label
                    key={fmt.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-colors ${
                      selectedMultiFormats[fmt.id]
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--text-primary)] font-semibold'
                        : 'border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedMultiFormats[fmt.id]}
                      onChange={(e) => setSelectedMultiFormats(prev => ({ ...prev, [fmt.id]: e.target.checked }))}
                      className="mt-0.5 rounded border-gray-400 text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{fmt.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{fmt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleMultiExport(false)}
                  className="py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-primary)]"
                >
                  {language === 'vi' ? 'Tải các file rời' : 'Download Files'}
                </button>
                <button
                  onClick={() => handleMultiExport(true)}
                  className="py-2.5 px-3 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 hover:opacity-90"
                >
                  {language === 'vi' ? 'Đóng gói 1 file .ZIP' : 'Package into .ZIP'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
