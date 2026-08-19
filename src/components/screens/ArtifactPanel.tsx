import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Download, 
  Share2,
  Code, 
  Eye, 
  FileText, 
  HelpCircle, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Lock,
  FileArchive,
  BookOpen,
  ListOrdered,
  Type,
  Palette,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Layers,
  ArrowUp,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { generateHtmlExport, generateInteractiveHtmlExport } from '../../../lib/export/html';
import { ShareNoteModal } from '../modals/ShareNoteModal';

interface ArtifactPanelProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaperTheme = 'system' | 'academic-paper' | 'midnight-slate' | 'emerald-focus';
type TextSize = 'sm' | 'base' | 'lg' | 'xl';

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ note, isOpen, onClose }) => {
  const { isArtifactFullscreen, setIsArtifactFullscreen, addToast, user, setCurrentScreen, theme, language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'markdown' | 'static-html' | 'interactive-html' | 'code'>('markdown');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMultiExportModalOpen, setIsMultiExportModalOpen] = useState(false);

  // Fullscreen & Reading Customizations
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('system');
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');
  const [isToCOpen, setIsToCOpen] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: number]: boolean }>({});
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeToCId, setActiveToCId] = useState<string>('sec-overview');
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  const contentRef = useRef<HTMLDivElement>(null);

  const [selectedMultiFormats, setSelectedMultiFormats] = useState<{ [key: string]: boolean }>({
    docx: true,
    pdf: true,
    md: true,
    html: true,
  });

  // Track reading scroll progress
  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight - clientHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
      setReadingProgress(progress);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isArtifactFullscreen) {
        setIsArtifactFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArtifactFullscreen, setIsArtifactFullscreen]);

  if (!note || !isOpen) return null;

  const isDark = theme === 'dark';
  const userPlan = (user.plan || 'free').toLowerCase();
  const isProOrUltra = userPlan === 'pro' || userPlan === 'ultra' || user.role === 'admin';
  const isUltra = userPlan === 'ultra' || user.role === 'admin';

  // Calculate estimated reading time
  const wordCount = (note.rawMarkdown || note.summary || '').split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const toggleSectionCollapse = (idx: number) => {
    setCollapsedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleCardFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopy = () => {
    const textToCopy = activeTab === 'code' 
      ? note.rawMarkdown 
      : `${note.title}\n\n${note.summary}\n\n${note.rawMarkdown}`;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    addToast(t('copied'), t('toastCopied'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySection = (secTitle: string, secText?: string, bullets?: string[]) => {
    const text = `## ${secTitle}\n\n${secText || ''}\n\n${(bullets || []).map(b => `- ${b}`).join('\n')}`;
    navigator.clipboard?.writeText(text);
    addToast(
      language === 'vi' ? 'Đã sao chép phân mục' : 'Section Copied',
      secTitle,
      'success'
    );
  };

  const scrollToSection = (id: string) => {
    setActiveToCId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        for (const fmt of activeFormats) {
          const res = await fetch('/api/notes/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              format: fmt,
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
          if (res.ok) {
            const blob = await res.blob();
            const safeTitle = (note.title || 'zero-ai-note')
              .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
              .substring(0, 50);
            const ext = fmt === 'interactive-html' ? 'interactive.html' : fmt;
            zip.file(`${safeTitle}.${ext}`, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
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

  // Get paper style classes based on paperTheme
  const getPaperClasses = () => {
    switch (paperTheme) {
      case 'academic-paper':
        return 'bg-[#FAF8F5] text-[#2C2A29] border-[#E8E3DD]';
      case 'midnight-slate':
        return 'bg-[#0B0F19] text-[#E2E8F0] border-[#1E293B]';
      case 'emerald-focus':
        return 'bg-[#0C1B17] text-[#D1FAE5] border-[#134E48]';
      default:
        return isDark ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)]' : 'bg-white text-[var(--text-primary)] border-[var(--border-color)]';
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm': return 'text-xs sm:text-xs leading-relaxed';
      case 'lg': return 'text-sm sm:text-base leading-relaxed';
      case 'xl': return 'text-base sm:text-lg leading-relaxed';
      default: return 'text-xs sm:text-sm leading-relaxed';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col transition-all duration-200 ${
          isArtifactFullscreen 
            ? 'fixed inset-0 z-50 overflow-hidden bg-[var(--bg-app)]' 
            : 'relative z-10 w-full sm:w-[480px] md:w-[500px] lg:w-[540px] xl:w-[620px] 2xl:w-[700px] shrink-0 h-full border-l border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)]'
        }`}
      >
        {/* Top Reading Progress Line */}
        <div className="w-full h-0.5 bg-[var(--border-color)]/30 shrink-0 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent-primary)] via-emerald-400 to-[var(--accent-primary)] transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Panel Header Toolbar */}
        <div className={`h-14 px-3 sm:px-4 flex items-center justify-between border-b shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-md`}>
          {/* Left: Preview Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'markdown'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Markdown
            </button>

            <button
              onClick={() => setActiveTab('static-html')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
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
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
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
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'code'
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Raw
            </button>
          </div>

          {/* Right: Action Buttons (Share, Copy, Export, Fullscreen, Close) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Share Note Button */}
            <button
              id="btn-artifact-share-note"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shadow-2xs"
              title={language === 'vi' ? 'Chia sẻ bài ghi chú này' : 'Share this note'}
            >
              <Share2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">{language === 'vi' ? 'Chia sẻ' : 'Share'}</span>
            </button>

            {/* Copy Note Button */}
            <button
              id="btn-artifact-copy"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] shadow-2xs"
              title={language === 'vi' ? 'Sao chép ghi chú' : 'Copy note'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isCopied ? (language === 'vi' ? 'Đã chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
              </span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                id="btn-artifact-download-dropdown"
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:opacity-90 transition-all cursor-pointer active:scale-95 shadow-md shadow-[var(--accent-primary)]/20"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{language === 'vi' ? 'Xuất File' : 'Export'}</span>
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
                      className="absolute right-0 mt-1.5 w-64 rounded-2xl border p-2 z-40 space-y-1 shadow-2xl bg-[var(--bg-card)] border-[var(--border-color)]"
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

            {/* Toggle Fullscreen / Extend View */}
            <button
              onClick={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              className="p-1.5 rounded-xl border transition-colors cursor-pointer border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] active:scale-95 shadow-2xs"
              title={isArtifactFullscreen ? 'Thu nhỏ (Esc)' : 'Mở rộng toàn màn hình'}
            >
              {isArtifactFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border transition-colors cursor-pointer border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 active:scale-95 shadow-2xs"
              title="Đóng panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fullscreen Reading Floating Customizer Bar */}
        {isArtifactFullscreen && (
          <div className="h-10 px-4 sm:px-8 border-b flex items-center justify-between text-xs bg-[var(--bg-card)]/90 border-[var(--border-color)] shrink-0">
            <div className="flex items-center gap-4 text-[var(--text-secondary)]">
              {/* ToC Toggle */}
              <button
                onClick={() => setIsToCOpen(!isToCOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isToCOpen ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)]/40 font-bold' : 'border-transparent hover:bg-[var(--bg-hover)]'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Mục lục (ToC)' : 'Outline ToC'}</span>
              </button>

              {/* Reading Stats */}
              <span className="hidden sm:inline font-medium text-[var(--text-muted)]">
                ⏱ {readTimeMinutes} {language === 'vi' ? 'phút đọc' : 'min read'} • {wordCount} {language === 'vi' ? 'từ' : 'words'}
              </span>
            </div>

            {/* Reader Adjusters: Themes & Font Size */}
            <div className="flex items-center gap-2">
              {/* Theme Picker */}
              <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-[var(--bg-app)] border-[var(--border-color)]">
                {[
                  { id: 'system', label: 'Default', bg: 'bg-zinc-700' },
                  { id: 'academic-paper', label: 'Paper', bg: 'bg-[#FAF8F5] border border-amber-900/30' },
                  { id: 'midnight-slate', label: 'Slate', bg: 'bg-[#0B0F19] border border-blue-900/30' },
                  { id: 'emerald-focus', label: 'Emerald', bg: 'bg-[#0C1B17] border border-emerald-900/30' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPaperTheme(p.id as any)}
                    className={`w-5 h-5 rounded-md ${p.bg} transition-transform ${paperTheme === p.id ? 'ring-2 ring-[var(--accent-primary)] scale-110' : 'opacity-70 hover:opacity-100'}`}
                    title={p.label}
                  />
                ))}
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center border rounded-lg p-0.5 bg-[var(--bg-app)] border-[var(--border-color)] text-[10px] font-bold">
                {(['sm', 'base', 'lg'] as TextSize[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setTextSize(s)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${textSize === s ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {s === 'sm' ? 'A-' : s === 'base' ? 'A' : 'A+'}
                  </button>
                ))}
              </div>

              {/* Serif / Sans Toggle */}
              <button
                onClick={() => setFontFamily(fontFamily === 'sans' ? 'serif' : 'sans')}
                className="px-2 py-1 rounded-lg border border-[var(--border-color)] font-serif text-xs hover:border-[var(--accent-primary)] cursor-pointer"
                title="Đổi phông chữ Serif / Sans"
              >
                {fontFamily === 'sans' ? 'Serif' : 'Sans'}
              </button>
            </div>
          </div>
        )}

        {/* Panel Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Left Outline / ToC Sidebar (in Fullscreen or wide screens) */}
          {isArtifactFullscreen && isToCOpen && (
            <aside className="w-64 border-r p-4 overflow-y-auto hidden md:block shrink-0 custom-scrollbar border-[var(--border-color)] bg-[var(--bg-card)]">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{language === 'vi' ? 'Cấu Trúc Bài Viết' : 'Table of Contents'}</span>
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => scrollToSection('sec-overview')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                      activeToCId === 'sec-overview' ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span>📌</span>
                    <span className="truncate">{language === 'vi' ? 'Tóm tắt tổng quan' : 'Executive Overview'}</span>
                  </button>

                  {note.keywords && note.keywords.length > 0 && (
                    <button
                      onClick={() => scrollToSection('sec-keywords')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                        activeToCId === 'sec-keywords' ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <span>🏷️</span>
                      <span className="truncate">{language === 'vi' ? 'Từ khóa trọng tâm' : 'Key Concepts & Tags'}</span>
                    </button>
                  )}

                  {note.coreQuestions && note.coreQuestions.length > 0 && (
                    <button
                      onClick={() => scrollToSection('sec-qa')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                        activeToCId === 'sec-qa' ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <span>💡</span>
                      <span className="truncate">{language === 'vi' ? 'Câu hỏi & Thẻ nhớ Q&A' : 'Core Q&A Flashcards'}</span>
                    </button>
                  )}

                  {/* Sections List */}
                  {note.content?.sections?.map((sec, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSection(`sec-detail-${idx}`)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                        activeToCId === `sec-detail-${idx}` ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
                      <span className="truncate">{sec.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Reading Canvas Area */}
          <div 
            ref={contentRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
          >
            {/* MARKDOWN VIEW */}
            {activeTab === 'markdown' && (
              <div className={`space-y-6 mx-auto ${isArtifactFullscreen ? 'max-w-4xl' : 'max-w-3xl'}`}>
                {/* Academic Header Banner */}
                <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-4 ${getPaperClasses()}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4 border-[var(--border-color)]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs">
                        {note.method.toUpperCase()} FRAMEWORK
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {note.category || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>{readTimeMinutes} {language === 'vi' ? 'phút đọc' : 'min read'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>98% AI Precision</span>
                      </span>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                    {note.title}
                  </h1>
                </div>

                {/* Section 1: Executive Overview */}
                <div 
                  id="sec-overview"
                  className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-3 ${getPaperClasses()}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                        {language === 'vi' ? 'Tóm Tắt Tổng Quan Học Thuật' : 'Executive Academic Overview'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleCopySection('Executive Overview', note.summary)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
                      title="Sao chép phần này"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className={`${getTextSizeClass()} leading-relaxed`}>
                    {note.summary}
                  </p>
                </div>

                {/* Section 2: Keywords Tags */}
                {note.keywords && note.keywords.length > 0 && (
                  <div 
                    id="sec-keywords"
                    className={`p-5 rounded-3xl border shadow-xs space-y-2.5 ${getPaperClasses()}`}
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>{language === 'vi' ? 'Khái Niệm & Từ Khóa Trọng Tâm' : 'Core Concepts & Key Points'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {note.keywords.map((kw, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 rounded-xl border text-xs font-bold bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors shadow-2xs"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Interactive Q&A Flashcard Review (if available) */}
                {note.coreQuestions && note.coreQuestions.length > 0 && (
                  <div 
                    id="sec-qa"
                    className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-4 ${getPaperClasses()}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500">
                          <HelpCircle className="w-4 h-4" />
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {language === 'vi' ? 'Bộ Câu Hỏi Trọng Tâm & Active Recall' : 'High-Yield Q&A Flashcards'}
                        </h3>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                        {language === 'vi' ? 'Nhấn để lật thẻ đáp án' : 'Click to flip answer'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {note.coreQuestions.map((q, qIdx) => {
                        const isFlipped = !!flippedCards[qIdx];
                        return (
                          <div
                            key={qIdx}
                            onClick={() => toggleCardFlip(qIdx)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                              isFlipped 
                                ? 'bg-[var(--accent-subtle)]/50 border-[var(--accent-primary)]/50' 
                                : 'bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                                ❓ {q.question || `Câu hỏi ${qIdx + 1}`}
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0">
                                {isFlipped ? (language === 'vi' ? 'Ẩn' : 'Hide') : (language === 'vi' ? 'Xem lời giải' : 'Reveal')}
                              </span>
                            </div>

                            {isFlipped && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 pt-3 border-t border-[var(--accent-primary)]/20 text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed"
                              >
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Lời giải chi tiết: </span>
                                {q.answer || 'Đáp án đang được trích xuất từ tài liệu.'}
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 4: Detailed Hierarchical Sections */}
                <div className="space-y-4">
                  {note.content?.sections?.map((sec, idx) => {
                    const isCollapsed = !!collapsedSections[idx];
                    return (
                      <div 
                        key={idx}
                        id={`sec-detail-${idx}`}
                        className={`rounded-3xl border shadow-xs transition-all overflow-hidden ${getPaperClasses()}`}
                      >
                        {/* Section Header Accordion Bar */}
                        <div 
                          onClick={() => toggleSectionCollapse(idx)}
                          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                              {idx + 1}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold tracking-tight">
                              {sec.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySection(sec.title, sec.text, sec.bulletPoints);
                              }}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] cursor-pointer"
                              title="Sao chép phân mục"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <div className="p-1 text-[var(--text-muted)]">
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Section Body */}
                        {!isCollapsed && (
                          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-[var(--border-color)]/50">
                            {/* Definition Box */}
                            {sec.definition && (
                              <div className="p-4 rounded-2xl border-l-4 border-[var(--accent-primary)] bg-[var(--accent-subtle)]/40 text-xs sm:text-sm italic text-[var(--text-primary)]">
                                <span className="font-bold not-italic text-[var(--accent-primary)] block mb-1">
                                  💡 {language === 'vi' ? 'Khái niệm trọng tâm:' : 'Core Definition:'}
                                </span>
                                {sec.definition}
                              </div>
                            )}

                            {/* Section Paragraph Text */}
                            {sec.text && (
                              <p className={`${getTextSizeClass()} leading-relaxed text-[var(--text-primary)]`}>
                                {sec.text}
                              </p>
                            )}

                            {/* Section Bullet Points */}
                            {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                              <div className="space-y-2 pt-1">
                                {sec.bulletPoints.map((b, bi) => (
                                  <div key={bi} className="flex items-start gap-2.5 text-xs sm:text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
                                    <span className="leading-relaxed text-[var(--text-primary)]">{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STATIC HTML PREVIEW */}
            {activeTab === 'static-html' && (
              <div className="h-full">
                {!isProOrUltra ? (
                  <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-app)] border-[var(--border-color)] max-w-md mx-auto my-12">
                    <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {language === 'vi' ? 'Xem Trước HTML Tĩnh Bị Khóa' : 'Static HTML Preview Locked'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {language === 'vi' ? 'Tính năng hiển thị HTML độc lập với phong cách tạp chí học thuật dành riêng cho gói Pro và Ultra.' : 'Pro feature.'}
                    </p>
                    <button
                      onClick={() => setCurrentScreen('pricing')}
                      className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
                    >
                      {language === 'vi' ? 'Nâng cấp Pro ngay' : 'Upgrade to Pro'}
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
                    className="w-full h-full min-h-[600px] border-none rounded-2xl shadow-sm bg-white"
                    title="Static HTML Preview"
                  />
                )}
              </div>
            )}

            {/* INTERACTIVE HTML PREVIEW */}
            {activeTab === 'interactive-html' && (
              <div className="h-full">
                {!isUltra ? (
                  <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-app)] border-[var(--border-color)] max-w-md mx-auto my-12">
                    <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {language === 'vi' ? 'Xem Trước HTML Tương Tác Động (JS)' : 'Interactive HTML Preview Locked'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {language === 'vi' ? 'Trải nghiệm ghi chú học thuật có khả năng lọc, tìm kiếm thời gian thực, lật thẻ Flashcards tương tác dành cho gói Ultra.' : 'Ultra feature.'}
                    </p>
                    <button
                      onClick={() => setCurrentScreen('pricing')}
                      className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
                    >
                      {language === 'vi' ? 'Nâng cấp Ultra' : 'Upgrade to Ultra'}
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
                    className="w-full h-full min-h-[600px] border-none rounded-2xl shadow-sm bg-white"
                    title="Interactive HTML Preview"
                  />
                )}
              </div>
            )}

            {/* RAW CODE VIEW */}
            {activeTab === 'code' && (
              <div className="p-4 rounded-2xl border font-mono text-xs overflow-x-auto bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]">
                <pre className="whitespace-pre-wrap">{note.rawMarkdown || note.summary}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Share Note Modal */}
        <ShareNoteModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          note={note}
        />
      </motion.div>
    </AnimatePresence>
  );
};
