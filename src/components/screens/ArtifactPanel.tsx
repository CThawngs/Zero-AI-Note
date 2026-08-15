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
  Sparkles
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
  const [selectedFormats, setSelectedFormats] = useState<{ [key: string]: boolean }>({
    md: true,
    docx: false,
    pdf: true,
    html: false
  });
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  if (!note || !isOpen) return null;

  const isDark = theme === 'dark';

  const handleCopy = () => {
    const textToCopy = activeTab === 'code' ? note.rawMarkdown : note.content.overview + '\n\n' + note.rawMarkdown;
    navigator.clipboard?.writeText(textToCopy);
    setIsCopied(true);
    addToast(t('copied'), t('toastCopied'));
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    setIsDownloadOpen(false);
    const chosen = Object.entries(selectedFormats)
      .filter(([_, val]) => val)
      .map(([k]) => k.toUpperCase())
      .join(', ');
    
    if (!chosen) {
      addToast(
        language === 'vi' ? 'Chưa chọn định dạng' : 'No format chosen', 
        language === 'vi' ? 'Vui lòng tích chọn ít nhất một định dạng tải về.' : 'Please select at least one format.', 
        'warning'
      );
      return;
    }

    addToast(
      language === 'vi' ? 'Đang tạo tệp tải xuống' : 'Preparing download file', 
      `${language === 'vi' ? 'Đang kết xuất định dạng:' : 'Rendering formats:'} ${chosen}...`, 
      'info'
    );
    setTimeout(() => {
      addToast(
        language === 'vi' ? 'Tải xuống hoàn tất' : 'Download complete', 
        `"${note.title}" (${chosen}) ${language === 'vi' ? 'đã được lưu.' : 'saved successfully.'}`, 
        'success'
      );
    }, 1000);
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
            ? 'bg-[#211D19] border-[#38322B] text-[#F7F4EE]' 
            : 'bg-white border-[#E6E0D6] text-[#26221D] shadow-xl'
        }`}
      >
        {/* Panel Header */}
        <div className={`h-14 px-3 sm:px-4 flex items-center justify-between border-b shrink-0 transition-colors ${
          isDark ? 'bg-[#27221D] border-[#38322B]' : 'bg-[#FAF7F2] border-[#E6E0D6]'
        }`}>
          {/* Tabs: Preview / Code */}
          <div className={`flex p-0.5 rounded-xl border ${
            isDark ? 'bg-[#1C1815] border-[#38322B]' : 'bg-[#EAE4D9] border-[#DDD5C8]'
          }`}>
            <button
              id="artifact-tab-preview"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer active:scale-95 ${
                activeTab === 'preview'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isDark ? 'text-[#A8A199] hover:text-white' : 'text-[#6E665D] hover:text-[#26221D]'
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
                  ? 'bg-amber-600 text-white shadow-xs'
                  : isDark ? 'text-[#A8A199] hover:text-white' : 'text-[#6E665D] hover:text-[#26221D]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>RAW CODE</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Copy Button */}
            <button
              id="artifact-btn-copy"
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer active:scale-95 ${
                isDark 
                  ? 'bg-[#2E2822] hover:bg-[#38312A] border-[#443C32] text-[#EDE7DE]' 
                  : 'bg-white hover:bg-[#F5F0E6] border-[#E2DBD0] text-[#4A4239]'
              }`}
              title={t('copyMarkdown')}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8C857B]" />
                  <span>{t('save')}</span>
                </>
              )}
            </button>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                id="artifact-btn-download"
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/35 text-amber-500 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('export')}</span>
                <ChevronDown className="w-3 h-3 text-amber-500" />
              </button>

              <AnimatePresence>
                {isDownloadOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDownloadOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl p-3 z-50 space-y-2 border ${
                        isDark ? 'bg-[#26211C] border-[#38322B]' : 'bg-white border-[#E2DBD0]'
                      }`}
                    >
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'
                      }`}>
                        {language === 'vi' ? 'Chọn định dạng xuất' : 'Choose Export Format'}
                      </p>
                      <div className="space-y-1.5">
                        {[
                          { id: 'md', label: 'Markdown (.md)', desc: 'Obsidian / Notion ready' },
                          { id: 'docx', label: 'Word (.docx)', desc: 'Microsoft Word Document' },
                          { id: 'pdf', label: 'Adobe PDF (.pdf)', desc: 'High-res Vector Print' },
                          { id: 'html', label: 'HTML (.html)', desc: 'Standalone Web Page' }
                        ].map((fmt) => (
                          <label
                            key={fmt.id}
                            className={`flex items-start gap-2.5 p-1.5 rounded-xl cursor-pointer transition-colors ${
                              isDark ? 'hover:bg-[#322B24]' : 'hover:bg-[#F5F0E6]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFormats[fmt.id] || false}
                              onChange={(e) =>
                                setSelectedFormats(prev => ({ ...prev, [fmt.id]: e.target.checked }))
                              }
                              className="mt-0.5 rounded border-[#443C32] bg-[#2E2822] text-amber-600 focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className={`text-xs font-semibold ${isDark ? 'text-[#EDE7DE]' : 'text-[#26221D]'}`}>{fmt.label}</p>
                              <p className={`text-[10px] ${isDark ? 'text-[#A8A199]' : 'text-[#8C857B]'}`}>{fmt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        id="btn-confirm-download"
                        onClick={handleDownload}
                        className="w-full mt-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer active:scale-95"
                      >
                        {language === 'vi' ? 'Xác nhận tải về' : 'Confirm Export'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen Toggle (desktop only or optional) */}
            <button
              id="artifact-btn-fullscreen"
              onClick={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              className={`hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center p-2 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isDark ? 'text-[#A8A199] hover:text-white hover:bg-[#2E2822]' : 'text-[#6E665D] hover:text-[#26221D] hover:bg-[#EAE4D9]'
              }`}
              title={isArtifactFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isArtifactFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Panel / Back to chat */}
            <button
              id="artifact-btn-close"
              onClick={onClose}
              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isDark ? 'bg-[#2E2822] text-[#D8D2C9] hover:text-white hover:bg-[#3A322A]' : 'bg-[#EAE4D9] text-[#4A4239] hover:text-[#26221D] hover:bg-[#DDD5C8]'
              }`}
              title={t('close')}
              aria-label={t('close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'preview' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Note Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/35">
                    {note.method.toUpperCase()} NOTE
                  </span>
                  <span className={`text-xs ${isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`}>
                    {language === 'vi' ? 'Cập nhật: ' : 'Updated: '}{note.updatedAt}
                  </span>
                </div>
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#26221D]'
                }`}>
                  {note.title}
                </h2>
              </div>

              {/* Source badges */}
              {note.sources && note.sources.length > 0 && (
                <div className={`flex flex-wrap gap-2 p-2.5 rounded-2xl border ${
                  isDark ? 'bg-[#26211C] border-[#38322B]' : 'bg-[#FAF7F2] border-[#E6E0D6]'
                }`}>
                  <span className={`text-[11px] font-semibold self-center mr-1 ${
                    isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'
                  }`}>
                    {language === 'vi' ? 'Nguồn:' : 'Sources:'}
                  </span>
                  {note.sources.map((src, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border ${
                        isDark ? 'bg-[#302A24] text-[#EDE7DE] border-[#443C32]' : 'bg-white text-[#4A4239] border-[#E2DBD0] shadow-2xs'
                      }`}
                    >
                      <FileText className="w-3 h-3 text-amber-500" />
                      <span>{src.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Cornell Key Questions & Keywords */}
              {note.keywords && note.keywords.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/70 border-amber-200'
                }`}>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                    {t('keyConcepts')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${
                          isDark ? 'bg-[#2A241E] border-amber-500/30 text-amber-200' : 'bg-white border-amber-200 text-amber-800'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Overview */}
              {note.content?.overview && (
                <div className={`text-sm leading-relaxed ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                  <p>{note.content.overview}</p>
                </div>
              )}

              {/* Sections */}
              {note.content?.sections?.map((sec, idx) => (
                <div key={idx} className="space-y-3 pt-2">
                  <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-[#26221D]'
                  }`}>
                    <span className="w-1.5 h-4 bg-amber-600 rounded-full" />
                    <span>{sec.title}</span>
                  </h3>

                  {sec.definition && (
                    <div className={`p-3 rounded-xl border-l-2 border-amber-500 text-xs italic ${
                      isDark ? 'bg-[#28221D] text-[#D8D2C9]' : 'bg-[#FAF7F2] text-[#4A4239]'
                    }`}>
                      {sec.definition}
                    </div>
                  )}

                  {sec.text && (
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'}`}>
                      {sec.text}
                    </p>
                  )}

                  {/* Low Confidence warning */}
                  {sec.lowConfidenceSnippet && (
                    <div className={`relative group p-2.5 rounded-xl border ${
                      isDark ? 'bg-amber-950/25 border-amber-800/40' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-amber-200/90' : 'text-amber-900'}`}>
                        <span 
                          className="underline decoration-dotted decoration-amber-500 cursor-help font-medium"
                          onMouseEnter={() => setHoveredTooltip(sec.lowConfidenceReason || (language === 'vi' ? 'Cần kiểm chứng thêm' : 'Needs citation verification'))}
                          onMouseLeave={() => setHoveredTooltip(null)}
                        >
                          {sec.lowConfidenceSnippet}
                        </span>
                      </p>
                      {hoveredTooltip && (
                        <div className="mt-2 text-[10px] bg-amber-700 text-white p-2 rounded-lg shadow-lg flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-white shrink-0" />
                          <span>{sec.lowConfidenceReason || (language === 'vi' ? 'Dữ liệu cần xác minh thêm từ nguồn gốc' : 'Data requires source verification')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table Data */}
                  {sec.tableData && (
                    <div className={`overflow-x-auto rounded-2xl border ${
                      isDark ? 'border-[#38322B] bg-[#26211C]' : 'border-[#E6E0D6] bg-white'
                    }`}>
                      <table className="w-full text-xs text-left">
                        <thead className={`font-semibold border-b ${
                          isDark ? 'bg-[#2E2822] text-[#EDE7DE] border-[#38322B]' : 'bg-[#FAF7F2] text-[#26221D] border-[#E6E0D6]'
                        }`}>
                          <tr>
                            {sec.tableData.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${
                          isDark ? 'divide-[#38322B] text-[#D8D2C9]' : 'divide-[#EAE4D9] text-[#4A4239]'
                        }`}>
                          {sec.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={isDark ? 'hover:bg-[#2F2923]' : 'hover:bg-[#FAF7F2]'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-2">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Bullet points */}
                  {sec.bulletPoints && (
                    <ul className="space-y-1.5 pl-2">
                      {sec.bulletPoints.map((bp, bIdx) => (
                        <li key={bIdx} className={`text-xs sm:text-sm flex items-start gap-2 ${
                          isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'
                        }`}>
                          <span className="text-amber-500 mt-1 font-bold">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Summary Bottom Box */}
              {note.content?.summaryText && (
                <div className={`p-4 rounded-2xl border ${
                  isDark 
                    ? 'bg-gradient-to-br from-amber-900/20 via-orange-900/15 to-transparent border-amber-700/35' 
                    : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isDark ? 'text-white' : 'text-[#26221D]'
                    }`}>
                      {language === 'vi' ? 'Tóm tắt cốt lõi' : 'Executive Summary'}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-[#D8D2C9]' : 'text-[#4A4239]'
                  }`}>
                    {note.content.summaryText}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`font-mono text-xs p-4 rounded-2xl border overflow-x-auto whitespace-pre-wrap leading-relaxed select-text ${
                isDark ? 'bg-[#1C1815] border-[#38322B] text-[#D8D2C9]' : 'bg-[#FAF7F2] border-[#E6E0D6] text-[#26221D]'
              }`}
            >
              {note.rawMarkdown}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
