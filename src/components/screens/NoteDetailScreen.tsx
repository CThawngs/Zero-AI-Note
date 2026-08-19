import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Eye, 
  Code, 
  Send, 
  Sparkles, 
  HelpCircle, 
  ChevronRight,
  ExternalLink,
  Bot,
  MessageSquare,
  BookOpen,
  Lock,
  Archive,
  ChevronDown,
  Layers,
  FileArchive,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { generateHtmlExport, generateInteractiveHtmlExport } from '../../../lib/export/html';
import { ShareNoteModal } from '../modals/ShareNoteModal';

export const NoteDetailScreen: React.FC = () => {
  const { 
    activeNote, 
    setCurrentScreen, 
    addToast, 
    archiveNote, 
    user,
    theme,
    language,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'markdown' | 'static-html' | 'interactive-html' | 'code'>('markdown');
  const [mobileTab, setMobileTab] = useState<'content' | 'ask' | 'summary'>('content');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMultiExportModalOpen, setIsMultiExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMultiFormats, setSelectedMultiFormats] = useState<{ [key: string]: boolean }>({
    docx: true,
    pdf: true,
    md: true,
    html: true,
  });

  const [askInput, setAskInput] = useState('');
  const [askHistory, setAskHistory] = useState<{ q: string; a: string; time: string }[]>([
    {
      q: 'Giải thích thêm về chỉ số CPI? Nó khác gì so với chỉ số giảm phát GDP?',
      a: 'Chỉ số CPI đo lường sự thay đổi giá của một "rổ hàng hóa cố định" được mua bởi người tiêu dùng điển hình (bao gồm cả hàng nhập khẩu như xăng dầu). Trong khi đó, GDP Deflator tính toán giá của "tất cả hàng hóa & dịch vụ sản xuất trong nước", rổ hàng tự động thay đổi theo lượng tiêu thụ thực tế hàng năm.',
      time: '14:32'
    }
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const isDark = theme === 'dark';
  const userPlan = (user.plan || 'free').toLowerCase();
  const isProOrUltra = userPlan === 'pro' || userPlan === 'ultra' || user.role === 'admin';
  const isUltra = userPlan === 'ultra' || user.role === 'admin';

  if (!activeNote) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors bg-[var(--bg-app)] text-[var(--text-secondary)]`}>
        <p className="text-sm">{language === 'vi' ? 'Không tìm thấy ghi chú' : 'Note not found'}</p>
        <button
          onClick={() => setCurrentScreen('library')}
          className="mt-4 px-4 py-2 bg-[var(--accent-primary)] hover:opacity-90 active:scale-95 text-[var(--accent-text)] text-xs font-semibold rounded-xl cursor-pointer transition-all"
        >
          {t('backToLibrary')}
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeNote.rawMarkdown);
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
            title: activeNote.title,
            method: activeNote.method,
            summary: activeNote.summary,
            category: activeNote.category,
            keywords: activeNote.keywords,
            coreQuestions: activeNote.coreQuestions,
            content: activeNote.content,
            rawMarkdown: activeNote.rawMarkdown,
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
      const safeTitle = (activeNote.title || 'zero-ai-note')
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
        language === 'vi' ? 'Tải xuống hoàn tất' : 'Export Complete',
        `${activeNote.title} (.${ext})`,
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
              title: activeNote.title,
              method: activeNote.method,
              summary: activeNote.summary,
              category: activeNote.category,
              keywords: activeNote.keywords,
              coreQuestions: activeNote.coreQuestions,
              content: activeNote.content,
              rawMarkdown: activeNote.rawMarkdown,
            },
          }),
        });

        if (!response.ok) throw new Error('ZIP bundling failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = (activeNote.title || 'zero-ai-note')
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
        // Parallel individual downloads
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

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim() || isAsking) return;

    const question = askInput.trim();
    setAskInput('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Dựa trên ghi chú "${activeNote.title}" và nội dung sau đây:\n\n${activeNote.rawMarkdown}\n\nHãy trả lời câu hỏi của tôi một cách súc tích, logic và học thuật: ${question}`
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.text || data.message || 'Đã ghi nhận câu trả lời.';
        setAskHistory(prev => [
          ...prev,
          {
            q: question,
            a: answer,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Chat response failed');
      }
    } catch (err) {
      setAskHistory(prev => [
        ...prev,
        {
          q: question,
          a: language === 'vi' ? 'Xin lỗi, không thể kết nối tới mô hình AI lúc này. Vui lòng thử lại.' : 'AI response unavailable.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors duration-250 bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Top Header Bar */}
      <div className="h-14 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
        {/* Left: Back to Library */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('library')}
            className="p-1.5 rounded-xl border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)]"
            title={t('backToLibrary')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-[var(--text-secondary)] truncate max-w-[120px] sm:max-w-[200px]">
              {activeNote.category}
            </span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-[280px]">
              {activeNote.title}
            </span>
          </div>
        </div>

        {/* Center: Preview Mode Selector */}
        <div className="hidden md:flex items-center p-0.5 rounded-xl border bg-[var(--bg-app)] border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Markdown
          </button>

          <button
            onClick={() => setActiveTab('static-html')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Raw Code
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Share Note Button */}
          <button
            id="btn-share-note-detail"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] shadow-2xs"
            title={language === 'vi' ? 'Chia sẻ bài ghi chú này' : 'Share this note'}
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">{language === 'vi' ? 'Chia sẻ' : 'Share'}</span>
          </button>

          {/* Copy Button */}
          <button
            id="btn-copy-note-detail"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? t('copied') : t('copyMarkdown')}</span>
          </button>

          {/* Download Dropdown */}
          <div className="relative">
            <button
              id="btn-download-note-detail"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] hover:opacity-90 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isExporting ? (language === 'vi' ? 'Đang xuất...' : 'Exporting...') : (language === 'vi' ? 'Tải file' : 'Export')}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDownloadOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsDownloadOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className="absolute right-0 mt-1.5 w-56 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs border bg-[var(--bg-card)] border-[var(--border-color)]"
                  >
                    {/* Multi-export for Ultra */}
                    {isUltra ? (
                      <button
                        onClick={() => {
                          setIsDownloadOpen(false);
                          setIsMultiExportModalOpen(true);
                        }}
                        className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold mb-1 border border-[var(--accent-primary)]/30"
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
                        className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] mb-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Multi-Export & ZIP</span>
                        </span>
                        <span className="text-[10px] text-amber-500 font-bold">Ultra</span>
                      </button>
                    )}

                    {/* Standard Formats */}
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
                          className="w-full text-left p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-between hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
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

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              addToast(t('copied'), t('toastCopied'));
            }}
            className="p-2 rounded-xl border transition-all cursor-pointer active:scale-95 bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title={t('share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Key Questions & Terms */}
        <div className="hidden xl:flex w-64 border-r flex-col p-5 overflow-y-auto custom-scrollbar shrink-0 transition-colors border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-3">
                {t('keyConcepts')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeNote.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg border text-xs font-medium bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-primary)]">
                {t('coreQuestions')}
              </h4>
              <div className="space-y-2.5">
                {activeNote.coreQuestions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setAskInput(q);
                      setMobileTab('ask');
                    }}
                    className="p-2.5 rounded-xl border text-xs transition-all cursor-pointer active:scale-97 bg-[var(--bg-app)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs"
                  >
                    <p className="leading-relaxed font-medium">? {q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-[var(--text-primary)]">
                {language === 'vi' ? 'Nguồn liên kết' : 'Connected Sources'}
              </h4>
              <div className="space-y-2">
                {activeNote.sources.map((src, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg border text-xs bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">{src.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Note Render Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar space-y-6 ${
          mobileTab !== 'content' ? 'hidden lg:block' : 'block'
        }`}>
          {/* Active Tab View */}
          {activeTab === 'markdown' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                    {activeNote.category} • {activeNote.method.toUpperCase()} NOTE
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {language === 'vi' ? 'Cập nhật: ' : 'Updated: '}{activeNote.updatedAt}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {activeNote.title}
                </h1>
              </div>

              {/* Overview text */}
              <div className="p-5 rounded-2xl border text-sm leading-relaxed bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xs">
                <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                  📌 {language === 'vi' ? 'Tóm Tắt Cốt Lõi' : 'Executive Overview'}
                </h4>
                <p>{activeNote.content.overview}</p>
              </div>

              {/* Sections Breakdown */}
              {activeNote.content.sections.map((sec, idx) => (
                <div key={idx} className="p-5 rounded-2xl border space-y-3 bg-[var(--bg-card)] border-[var(--border-color)]">
                  <h3 className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
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
                    <ul className="space-y-1.5 pl-4 text-xs sm:text-sm text-[var(--text-secondary)] list-disc">
                      {sec.bulletPoints.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Summary Conclusion */}
              {activeNote.content.summaryText && (
                <div className="p-5 rounded-2xl border bg-[var(--bg-card)] border-[var(--border-color)]">
                  <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                    🎯 {language === 'vi' ? 'Kết Luận & Hành Động' : 'Takeaway & Action Items'}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
                    {activeNote.content.summaryText}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'static-html' && (
            <div className="max-w-4xl mx-auto h-full">
              {!isProOrUltra ? (
                <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-card)] border-[var(--border-color)]">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Xem Trước HTML Tĩnh Bị Khóa' : 'Static HTML Preview Locked'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    {language === 'vi' 
                      ? 'Nâng cấp lên gói Pro (99.000đ/tháng) để mở khóa giao diện xem trước HTML layout chuẩn CSS và tải trang web tĩnh.' 
                      : 'Upgrade to Pro to unlock standard CSS styled HTML preview and standalone webpage exports.'}
                  </p>
                  <button
                    onClick={() => setCurrentScreen('pricing')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  >
                    {language === 'vi' ? 'Nâng cấp lên Pro' : 'Upgrade to Pro'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden bg-white text-black shadow-md">
                  <div className="p-4 bg-gray-100 border-b flex items-center justify-between text-xs text-gray-600">
                    <span>Static HTML Render Engine (Pro Tier)</span>
                    <button
                      onClick={() => triggerDownloadFile('html')}
                      className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600"
                    >
                      Tải file .HTML
                    </button>
                  </div>
                  <iframe
                    srcDoc={generateHtmlExport({
                      title: activeNote.title,
                      method: activeNote.method,
                      summary: activeNote.summary,
                      category: activeNote.category,
                      keywords: activeNote.keywords,
                      coreQuestions: activeNote.coreQuestions,
                      content: activeNote.content,
                      rawMarkdown: activeNote.rawMarkdown,
                    })}
                    title="Static HTML Preview"
                    className="w-full h-[600px] border-none"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'interactive-html' && (
            <div className="max-w-4xl mx-auto h-full">
              {!isUltra ? (
                <div className="p-8 rounded-3xl border border-dashed text-center space-y-4 bg-[var(--bg-card)] border-[var(--border-color)]">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Xem Trước HTML Tương Tác Động Bị Khóa' : 'Interactive HTML Preview Locked'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    {language === 'vi' 
                      ? 'Đặc quyền Ultra: Chạy JavaScript tương tác, đóng/mở nhánh thẻ, lật Flashcard Active Recall và xuất file offline 100%.' 
                      : 'Exclusive to Ultra: Interactive JS widgets, collapsible sections, Active Recall flashcards, and 100% offline standalone files.'}
                  </p>
                  <button
                    onClick={() => setCurrentScreen('pricing')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs font-bold shadow-md cursor-pointer hover:opacity-90 active:scale-95"
                  >
                    {language === 'vi' ? 'Nâng cấp lên Ultra (199.000đ)' : 'Upgrade to Ultra'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden shadow-lg bg-[var(--bg-card)] border-[var(--border-color)]">
                  <div className="p-3 border-b flex items-center justify-between text-xs bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border-color)]">
                    <span className="font-bold flex items-center gap-1.5 text-[var(--accent-primary)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ultra Dynamic Interactive HTML View</span>
                    </span>
                    <button
                      onClick={() => triggerDownloadFile('interactive-html')}
                      className="px-3 py-1 bg-[var(--accent-primary)] text-[var(--accent-text)] rounded-lg font-bold hover:opacity-90"
                    >
                      Tải Interactive .HTML
                    </button>
                  </div>
                  <iframe
                    srcDoc={generateInteractiveHtmlExport({
                      title: activeNote.title,
                      method: activeNote.method,
                      summary: activeNote.summary,
                      category: activeNote.category,
                      keywords: activeNote.keywords,
                      coreQuestions: activeNote.coreQuestions,
                      content: activeNote.content,
                      rawMarkdown: activeNote.rawMarkdown,
                    })}
                    title="Interactive HTML Preview"
                    className="w-full h-[650px] border-none"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="max-w-4xl mx-auto p-4 rounded-2xl border font-mono text-xs overflow-x-auto bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]">
              <pre className="whitespace-pre-wrap">{activeNote.rawMarkdown}</pre>
            </div>
          )}
        </div>

        {/* Right Column: AI Q&A Sidebar */}
        <div className={`w-full lg:w-80 xl:w-96 border-l flex flex-col transition-colors border-[var(--border-color)] bg-[var(--bg-card)] ${
          mobileTab !== 'ask' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="p-4 border-b flex items-center gap-2 border-[var(--border-color)]">
            <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              {language === 'vi' ? 'Hỏi Đáp AI Về Note Này' : 'AI Copilot Chat'}
            </h3>
          </div>

          {/* Q&A Messages History */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
            {askHistory.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="p-3 rounded-2xl text-xs bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)]">
                  <p className="font-semibold text-[var(--accent-primary)] mb-1">Q: {item.q}</p>
                  <span className="text-[10px] text-[var(--text-muted)] block text-right">{item.time}</span>
                </div>

                <div className="p-3 rounded-2xl text-xs bg-[var(--accent-subtle)]/40 border border-[var(--accent-primary)]/20 text-[var(--text-primary)]">
                  <p className="leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Q&A Input Box */}
          <form onSubmit={handleSendQuestion} className="p-3 border-t flex gap-2 border-[var(--border-color)] bg-[var(--bg-app)]">
            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder={language === 'vi' ? 'Đặt câu hỏi đào sâu về note...' : 'Ask question about this note...'}
              className="flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[var(--accent-primary)] bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            <button
              type="submit"
              disabled={isAsking || !askInput.trim()}
              className="p-2 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--accent-text)] rounded-xl cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
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

      {/* Share Note Modal */}
      <ShareNoteModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        note={activeNote}
      />
    </div>
  );
};
