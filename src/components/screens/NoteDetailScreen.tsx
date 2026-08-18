import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Share2, 
  MoreVertical, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Youtube, 
  Headphones, 
  Eye, 
  Code, 
  Send, 
  Sparkles, 
  HelpCircle, 
  ChevronRight,
  ExternalLink,
  Bot,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';

export const NoteDetailScreen: React.FC = () => {
  const { 
    activeNote, 
    setCurrentScreen, 
    addToast, 
    archiveNote, 
    startNewChatNote,
    theme,
    language,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [mobileTab, setMobileTab] = useState<'content' | 'ask' | 'summary'>('content');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(25);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [askHistory, setAskHistory] = useState<{ q: string; a: string; time: string }[]>([
    {
      q: 'Giải thích thêm về chỉ số CPI? Nó khác gì so với chỉ số giảm phát GDP?',
      a: 'Chỉ số CPI đo lường sự thay đổi giá của một "rổ hàng hóa cố định" được mua bởi người tiêu dùng điển hình (bao gồm cả hàng nhập khẩu như xăng dầu). Trong khi đó, GDP Deflator tính toán giá của "tất cả hàng hóa & dịch vụ sản xuất trong nước", rổ hàng tự động thay đổi theo lượng tiêu thụ thực tế hàng năm.',
      time: '14:32'
    }
  ]);
  const [isAsking, setIsAsking] = useState(false);

  // Audio player timer
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const isDark = theme === 'dark';

  if (!activeNote) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-250 ${
        isDark ? 'bg-[var(--bg-app)] text-[var(--text-secondary)]' : 'bg-[var(--bg-app)] text-[var(--text-secondary)]'
      }`}>
        <p className="text-sm">{language === 'vi' ? 'Không tìm thấy ghi chú' : 'Note not found'}</p>
        <button
          onClick={() => setCurrentScreen('library')}
          className="mt-4 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] active:scale-95 text-[var(--accent-text)] text-xs font-semibold rounded-xl cursor-pointer transition-all"
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

  const triggerDownloadFile = async (format: 'docx' | 'md' | 'html' | 'pdf') => {
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
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (activeNote.title || 'zero-ai-note')
        .replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
        .substring(0, 50);
      a.download = `${safeTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast(
        language === 'vi' ? 'Xuất tệp thành công' : 'Export Succeeded',
        language === 'vi' ? `Đã tải xuống ${format.toUpperCase()}` : `Downloaded ${format.toUpperCase()}`
      );
    } catch (e: any) {
      addToast(
        language === 'vi' ? 'Lỗi xuất tệp' : 'Export Failed',
        e?.message || 'Có lỗi xảy ra khi tải tệp.',
        'error'
      );
    } finally {
      setIsExporting(false);
      setIsDownloadOpen(false);
    }
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim() || isAsking) return;

    const question = askInput;
    setAskInput('');
    setIsAsking(true);

    setTimeout(() => {
      setIsAsking(false);
      setAskHistory(prev => [
        ...prev,
        {
          q: question,
          a: language === 'vi'
            ? `Dựa trên dữ liệu ghi chú "${activeNote.title}", câu hỏi của bạn được giải thích như sau: Đây là một khía cạnh trọng tâm gắn liền với cơ chế cân bằng thị trường và các mô hình dự báo kinh tế vĩ mô.`
            : `Based on the note context "${activeNote.title}", here is the explanation: This core aspect aligns with the market equilibrium mechanism and macro-economic forecasting models.`,
          time: language === 'vi' ? 'Vừa xong' : 'Just now'
        }
      ]);
      addToast(
        language === 'vi' ? 'AI đã phản hồi' : 'AI Copilot Replied',
        language === 'vi' ? 'Câu trả lời đã được thêm vào hội thoại hỏi đáp.' : 'Response added to your Q&A stream.'
      );
    }, 1000);
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors duration-250 ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Top Breadcrumb & Controls Bar */}
      <div className={`h-14 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors duration-250 ${
        isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-[var(--bg-surface)] border-[var(--border-color)] shadow-2xs'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            id="btn-back-to-library"
            onClick={() => setCurrentScreen('library')}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer py-1.5 px-2.5 rounded-xl active:scale-95 ${
              isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('backToLibrary')}</span>
          </button>
          <span className={isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}>/</span>
          <h2 className={`text-xs sm:text-sm font-bold truncate max-w-[180px] sm:max-w-md ${
            isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
          }`}>
            {activeNote.title}
          </h2>
        </div>

        {/* Audio TTS Player & Actions */}
        <div className="flex items-center gap-2">
          {/* Audio TTS Pill */}
          <div className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 border rounded-xl transition-colors ${
            isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)] shadow-2xs'
          }`}>
            <button
              id="btn-toggle-audio"
              onClick={() => {
                setIsPlayingAudio(!isPlayingAudio);
                if (!isPlayingAudio) {
                  addToast(t('audioSummary'), language === 'vi' ? 'Giọng đọc AI tự nhiên đang đọc tóm tắt ghi chú.' : 'AI natural voice is reading the note summary.');
                }
              }}
              className="p-1 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] transition-all cursor-pointer active:scale-90"
            >
              {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <div className="flex flex-col">
              <span className={`text-xs font-semibold ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                {t('audioSummary')}
              </span>
              <div className={`w-20 lg:w-24 h-1.5 rounded-full overflow-hidden mt-0.5 ${
                isDark ? 'bg-[var(--bg-hover)]' : 'bg-[var(--border-color)]'
              }`}>
                <div 
                  className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Copy Button */}
          <button
            id="btn-copy-note-detail"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              isDark 
                ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]' 
                : 'bg-white hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs'
            }`}
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-[var(--status-success)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
            <span>{isCopied ? t('copied') : t('copyMarkdown')}</span>
          </button>

          {/* Download Multi-format Dropdown */}
          <div className="relative">
            <button
              id="btn-download-note-detail"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                isDark 
                  ? 'bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)]' 
                  : 'bg-white hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>{isExporting ? (language === 'vi' ? 'Đang xuất...' : 'Exporting...') : (language === 'vi' ? 'Tải file' : 'Export')}</span>
            </button>

            <AnimatePresence>
              {isDownloadOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsDownloadOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className={`absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs border ${
                      isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
                    }`}
                  >
                    {[
                      { id: 'pdf', label: 'PDF Document (.pdf)', desc: 'Fixed Layout' },
                      { id: 'docx', label: 'Word Document (.docx)', desc: 'Standard Tables' },
                      { id: 'md', label: 'Markdown (.md)', desc: 'Plain Text' },
                      { id: 'html', label: 'Interactive HTML (.html)', desc: 'Standalone' }
                    ].map(fmt => (
                      <button
                        key={fmt.id}
                        onClick={() => triggerDownloadFile(fmt.id as any)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer flex flex-col ${
                          isDark ? 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'hover:bg-[var(--bg-app)] text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="font-semibold">{fmt.label}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{fmt.desc}</span>
                      </button>
                    ))}
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
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
              isDark ? 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
            title={t('share')}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation for switching Note view / AI Q&A */}
      <div className={`lg:hidden flex border-b px-4 py-1.5 gap-2 ${
        isDark ? 'bg-[var(--bg-sidebar)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
      }`}>
        <button
          onClick={() => setMobileTab('content')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            mobileTab === 'content'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
              : isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Nội dung Note' : 'Note Body'}</span>
        </button>
        <button
          onClick={() => setMobileTab('ask')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            mobileTab === 'ask'
              ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs'
              : isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{language === 'vi' ? 'Hỏi đáp AI' : 'AI Copilot'}</span>
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Key Questions & Terms */}
        <div className={`hidden xl:flex w-64 border-r flex-col p-5 overflow-y-auto custom-scrollbar shrink-0 transition-colors duration-250 ${
          isDark ? 'border-[var(--border-color)] bg-[var(--bg-sidebar)]' : 'border-[var(--border-color)] bg-[var(--bg-app)]'
        }`}>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-3">
                {t('keyConcepts')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeNote.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                      isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-2xs'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              }`}>
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
                    className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer group active:scale-97 ${
                      isDark 
                        ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]' 
                        : 'bg-white border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] shadow-2xs'
                    }`}
                  >
                    <p className="leading-relaxed font-medium">? {q}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              }`}>
                {language === 'vi' ? 'Nguồn liên kết' : 'Connected Sources'}
              </h4>
              <div className="space-y-2">
                {activeNote.sources.map((src, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                      isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-secondary)] shadow-2xs'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">{src.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Detailed Note Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar space-y-6 ${
          mobileTab !== 'content' ? 'hidden lg:block' : 'block'
        }`}>
          {/* Note Title & Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
                {activeNote.category} • {activeNote.method.toUpperCase()} NOTE
              </span>
              <span className={`text-xs ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>
                {language === 'vi' ? 'Cập nhật: ' : 'Updated: '}{activeNote.updatedAt}
              </span>
            </div>
            <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${
              isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
            }`}>
              {activeNote.title}
            </h1>
          </div>

          {/* Overview text */}
          <div className={`p-4 sm:p-5 rounded-2xl border text-sm leading-relaxed ${
            isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-xs'
          }`}>
            <p>{activeNote.content.overview}</p>
          </div>

          {/* Sections Breakdown */}
          {activeNote.content.sections.map((sec, idx) => (
            <div key={idx} className="space-y-4 pt-2">
              <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
                isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              }`}>
                <span className="w-1.5 h-5 bg-[var(--accent-primary)] rounded-full" />
                <span>{sec.title}</span>
              </h3>

              {sec.definition && (
                <div className={`p-4 rounded-xl border-l-4 border-[var(--accent-primary)] text-xs ${
                  isDark ? 'bg-[var(--accent-subtle)]/20 text-[var(--text-primary)]' : 'bg-[var(--accent-subtle)]/70 text-[var(--text-primary)]'
                }`}>
                  <p className="font-bold text-[var(--accent-primary)] mb-1">
                    {language === 'vi' ? 'Định nghĩa cốt lõi:' : 'Core Definition:'}
                  </p>
                  <p className="italic leading-relaxed">{sec.definition}</p>
                </div>
              )}

              {sec.text && (
                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {sec.text}
                </p>
              )}

              {/* Table Data */}
              {sec.tableData && (
                <div className={`overflow-x-auto rounded-xl border my-3 ${
                  isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-white shadow-2xs'
                }`}>
                  <table className="w-full text-xs text-left">
                    <thead className={`font-semibold border-b ${
                      isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border-[var(--border-color)]'
                    }`}>
                      <tr>
                        {sec.tableData.headers.map((h, i) => (
                          <th key={i} className="px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isDark ? 'divide-[var(--border-color)] text-[var(--text-primary)]' : 'divide-[var(--border-color)] text-[var(--text-primary)]'
                    }`}>
                      {sec.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={isDark ? 'hover:bg-[var(--bg-hover)]/40' : 'hover:bg-[var(--bg-hover)]/40'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sec.bulletPoints && (
                <div className="space-y-2 pl-2">
                  {sec.bulletPoints.map((bp, bIdx) => (
                    <div key={bIdx} className={`text-xs sm:text-sm flex items-start gap-2.5 ${
                      isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
                      <span>{bp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Bottom Summary Callout */}
          <div className={`p-5 rounded-2xl border ${
            isDark 
              ? 'bg-gradient-to-r from-[var(--accent-primary)]/30 via-[var(--accent-subtle)]/20 to-[var(--bg-card)] border-[var(--accent-primary)]/30' 
              : 'bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-subtle)]/50 to-white border-[var(--accent-primary)]'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              }`}>
                {language === 'vi' ? 'Tóm tắt cốt lõi (Cornell Summary)' : 'Executive Summary (Cornell Method)'}
              </h4>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
            }`}>
              {activeNote.content.summaryText}
            </p>
          </div>
        </div>

        {/* Right Column: Interactive AI Assistant Q&A */}
        <div className={`w-full lg:w-80 xl:w-96 border-l flex flex-col shrink-0 h-full transition-colors duration-250 ${
          mobileTab !== 'ask' ? 'hidden lg:flex' : 'flex'
        } ${
          isDark ? 'border-[var(--border-color)] bg-[var(--bg-sidebar)]' : 'border-[var(--border-color)] bg-[var(--bg-surface)]'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between transition-colors ${
            isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-hover)]'
          }`}>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
              }`}>
                {t('askNoteTitle')}
              </h4>
            </div>
            <span className="text-xs bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded font-mono font-bold">
              AI Copilot
            </span>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {askHistory.map((item, idx) => (
              <div key={idx} className="space-y-2">
                {/* User Q */}
                <div className="flex justify-end">
                  <div className="p-3 rounded-xl bg-[var(--accent-primary)] text-[var(--accent-text)] text-xs max-w-[90%] rounded-br-sm shadow-xs">
                    {item.q}
                  </div>
                </div>

                {/* AI Answer */}
                <div className="flex justify-start">
                  <div className={`p-3.5 rounded-xl border text-xs max-w-[95%] rounded-tl-sm space-y-2 ${
                    isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}>
                    <p className="leading-relaxed">{item.a}</p>
                    <div className="flex items-center justify-between pt-1 text-xs text-[var(--text-muted)]">
                      <span>{item.time}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(item.a);
                          addToast(t('copied'), t('toastCopied'));
                        }}
                        className="text-[var(--accent-primary)] hover:underline cursor-pointer"
                      >
                        {t('copyMarkdown')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs animate-pulse ${
                isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
                <span>{language === 'vi' ? 'AI đang phân tích ngữ cảnh ghi chú...' : 'AI is parsing note context...'}</span>
              </div>
            )}
          </div>

          {/* Input form */}
          <div className={`p-3 border-t transition-colors ${
            isDark ? 'border-[var(--border-color)] bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-hover)]'
          }`}>
            <form onSubmit={handleAskSubmit} className="relative">
              <input
                id="input-ask-note"
                type="text"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                placeholder={t('askNotePlaceholder')}
                className={`w-full rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-[var(--accent-primary)] border transition-colors ${
                  isDark ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)]' : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] shadow-2xs'
                }`}
              />
              <button
                type="submit"
                id="btn-submit-ask-note"
                disabled={!askInput.trim() || isAsking}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] disabled:opacity-40 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
