import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Paperclip, 
  Send, 
  Sparkles, 
  FileText, 
  Youtube, 
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteMethod } from '../../types';
import { ArtifactPanel } from './ArtifactPanel';
import { AttachSourceModal } from '../modals/AttachSourceModal';
import { CustomTemplateModal } from '../modals/CustomTemplateModal';
import { MethodPillRow } from '../chat/MethodPillRow';
import { ChatPipelineProgress } from '../chat/ChatPipelineProgress';
import { UploadArea } from '../common/UploadArea';

export const ChatScreen: React.FC = () => {
  const { 
    chatMessages, 
    isProcessingChat, 
    processingStep, 
    sendChatMessage, 
    selectedMethod, 
    setSelectedMethod,
    activeArtifactNote,
    isArtifactOpen,
    setIsArtifactOpen,
    openNoteDetail,
    notes,
    addToast,
    theme,
    language,
    t
  } = useApp();

  const [inputVal, setInputVal] = useState<string>('');
  const [attachedSources, setAttachedSources] = useState<{ type: 'pdf' | 'youtube' | 'doc'; name: string }[]>([]);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState<boolean>(false);
  const [isUploadAreaOpen, setIsUploadAreaOpen] = useState<boolean>(false);
  const [isCustomTemplateModalOpen, setIsCustomTemplateModalOpen] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const methods: { id: NoteMethod; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'cornell', label: t('methodCornell') },
    { id: 'outline', label: t('methodOutline') },
    { id: 'qa', label: t('methodQA') },
    { id: 'flashcard', label: t('methodFlashcard') },
    { id: 'quick-summary', label: t('methodSummary') }
  ];

  const suggestedPrompts = [
    {
      icon: GraduationCap,
      title: language === 'vi' ? 'Phương pháp Cornell' : 'Cornell Method',
      desc: language === 'vi' ? 'Trích xuất ý cốt lõi, cột gợi ý & tóm tắt học thuật' : 'Extract core cues, lecture notes & academic summary',
      method: 'cornell' as NoteMethod,
      prompt: language === 'vi' ? 'Hãy trích xuất và phân tích tài liệu này theo phương pháp Cornell chi tiết.' : 'Please analyze and summarize this material using the Cornell note-taking framework.'
    },
    {
      icon: BookOpen,
      title: language === 'vi' ? 'Cấu trúc Outline' : 'Outline Structure',
      desc: language === 'vi' ? 'Hệ thống hoá phân cấp ý chính, ý phụ mạch lạc' : 'Hierarchical headings, sub-points and key takeaways',
      method: 'outline' as NoteMethod,
      prompt: language === 'vi' ? 'Hãy lập dàn ý Outline phân cấp chi tiết cho tài liệu này.' : 'Create a structured hierarchical outline of this content.'
    },
    {
      icon: Layers,
      title: language === 'vi' ? 'Tạo Flashcards' : 'Generate Flashcards',
      desc: language === 'vi' ? 'Bộ câu hỏi thẻ nhớ ôn tập ngắt quãng (Spaced Repetition)' : 'Active recall question & answer flashcards',
      method: 'flashcard' as NoteMethod,
      prompt: language === 'vi' ? 'Hãy tạo một bộ Flashcards ôn tập kiến thức từ tài liệu.' : 'Generate a set of high-yield study flashcards from this material.'
    },
    {
      icon: HelpCircle,
      title: language === 'vi' ? 'Hỏi đáp Q&A' : 'Q&A Knowledge',
      desc: language === 'vi' ? 'Tổng hợp bộ câu hỏi trắc nghiệm & tự luận kèm giải thích' : 'Key questions and comprehensive answers',
      method: 'qa' as NoteMethod,
      prompt: language === 'vi' ? 'Hãy tổng hợp danh sách các câu hỏi và câu trả lời quan trọng nhất.' : 'Formulate a comprehensive list of core questions and detailed answers.'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isProcessingChat, processingStep]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isProcessingChat) return;

    sendChatMessage(inputVal, attachedSources);
    setInputVal('');
    setAttachedSources([]);
  };

  const handleAttachSource = (source: { type: 'pdf' | 'youtube' | 'doc'; name: string }) => {
    setAttachedSources((prev) => [...prev, source]);
    addToast(
      language === 'vi' ? 'Đã đính kèm' : 'Source Attached',
      `"${source.name}" ${language === 'vi' ? 'đã sẵn sàng để trích xuất.' : 'ready for extraction.'}`
    );
  };

  const handleUploaded = (fileKey: string, fileName: string) => {
    setAttachedSources((prev) => [...prev, { type: 'doc', name: fileName }]);
    setIsUploadAreaOpen(false);
    addToast(
      language === 'vi' ? 'Upload thành công' : 'Upload Successful',
      `"${fileName}" ${language === 'vi' ? 'đã tải lên và sẵn sàng xử lý.' : 'uploaded and ready to process.'}`,
      'success'
    );
  };

  const handlePromptClick = (p: typeof suggestedPrompts[0]) => {
    setSelectedMethod(p.method);
    sendChatMessage(p.prompt, attachedSources);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex-1 flex h-full overflow-hidden relative transition-colors duration-200 ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Left / Center: Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Chat Header */}
        <div className={`h-11 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[var(--bg-card)]/90 border-[var(--border-color)]' : 'bg-[var(--bg-surface)]/95 border-[var(--border-color)]'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Hội thoại & Trích xuất ghi chú AI' : 'AI Research & Note Synthesis'}
            </span>
          </div>

          {activeArtifactNote && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsArtifactOpen(!isArtifactOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isArtifactOpen
                  ? isDark ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/35 text-[var(--accent-primary)] font-semibold' : 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                  : isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-secondary)] shadow-2xs'
              }`}
            >
              {isArtifactOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isArtifactOpen ? t('hideArtifact') : t('openArtifact')}</span>
            </motion.button>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Empty State when no messages */}
            {chatMessages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="py-6 sm:py-10 text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-1 border border-[var(--accent-primary)]/20 shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    {language === 'vi' ? 'Chào mừng bạn đến với Zero AI Note' : 'Welcome to Zero AI Note'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 max-w-md mx-auto">
                    {language === 'vi'
                      ? 'Tải lên tài liệu, dán link YouTube hoặc chọn một phương pháp ghi chú bên dưới để bắt đầu.'
                      : 'Upload files, paste YouTube links, or select a study method below to begin.'}
                  </p>
                </div>

                {/* Suggested prompt starter cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {suggestedPrompts.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePromptClick(p)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs ${
                          isDark
                            ? 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-hover)]'
                            : 'bg-white border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {p.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                          {p.desc}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Chat Message List */}
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-2.5 sm:gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center shrink-0 shadow-md shadow-[var(--accent-primary)]/20 text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[88%] sm:max-w-[82%] space-y-2">
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] rounded-br-xs shadow-md shadow-[var(--accent-primary)]/15 font-normal'
                        : isDark 
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-xs shadow-xs' 
                          : 'bg-white text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attached files preview in message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`mt-3 flex flex-wrap gap-1.5 pt-2 border-t ${
                        msg.sender === 'user' ? 'border-white/20' : 'border-[var(--border-color)]'
                      }`}>
                        {msg.attachments.map((att, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              msg.sender === 'user'
                                ? 'bg-white/20 text-white'
                                : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {att.type === 'youtube' ? (
                              <Youtube className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                            )}
                            <span className="truncate max-w-[180px]">{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Result Note Card link in message */}
                  {msg.noteResultId && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pt-1"
                    >
                      {(() => {
                        const targetNote = notes.find(n => n.id === msg.noteResultId) || activeArtifactNote;
                        if (!targetNote) return null;
                        return (
                          <motion.div
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            id="btn-open-generated-note"
                            onClick={() => openNoteDetail(targetNote)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-sm ${
                              isDark 
                                ? 'bg-[var(--bg-card)] border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-hover)]' 
                                : 'bg-white border-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-subtle)]/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                  {targetNote.title}
                                </h4>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                  {language === 'vi' ? 'Xem chi tiết bài ghi chú trích xuất' : 'View full structured note'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
                          </motion.div>
                        );
                      })()}
                    </motion.div>
                  )}

                  <span className="block text-[10px] px-1 text-[var(--text-muted)]">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border bg-[var(--bg-hover)] border-[var(--border-color)]">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">ZU</span>
                  </div>
                )}
              </motion.div>
            ))}

            {/* AI Multi-step Processing Pipeline Card */}
            {isProcessingChat && (
              <ChatPipelineProgress currentStep={processingStep} />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Bar: Method Pills & Input Composer */}
        <div className={`p-2.5 sm:p-4 border-t backdrop-blur-md transition-colors shrink-0 ${
          isDark ? 'border-[var(--border-color)] bg-[var(--bg-app)]/95' : 'border-[var(--border-color)] bg-[var(--bg-surface)]/95'
        }`}>
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Note Method Selection Pills */}
            <MethodPillRow
              methods={methods}
              selectedMethod={selectedMethod}
              onSelectMethod={(m) => setSelectedMethod(m)}
              onOpenCustomTemplate={() => setIsCustomTemplateModalOpen(true)}
              disabled={isProcessingChat}
            />

            {/* Attached files preview chips */}
            {attachedSources.length > 0 && (
              <div className={`flex flex-wrap gap-2 p-2 border rounded-xl ${
                isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
              }`}>
                {attachedSources.map((att, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                      isDark ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-color)]' : 'bg-white text-[var(--text-primary)] border-[var(--border-color)] shadow-2xs'
                    }`}
                  >
                    {att.type === 'youtube' ? (
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    )}
                    <span className="truncate max-w-[180px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedSources(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[var(--text-muted)] hover:text-red-500 ml-1 cursor-pointer p-1"
                      aria-label="Remove source"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="relative flex items-center">
              {/* Attach Source Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                id="btn-attach-source"
                onClick={() => setIsUploadAreaOpen(true)}
                className={`absolute left-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                title={t('attachSource')}
                aria-label={t('attachSource')}
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>

              <textarea
                id="chat-composer-input"
                rows={1}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('chatPlaceholder')}
                className={`w-full border rounded-2xl pl-12 pr-12 py-3 text-sm focus:outline-none transition-all custom-scrollbar resize-none max-h-32 ${
                  isDark 
                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30' 
                    : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/20 shadow-xs'
                }`}
              />

              {/* Submit Button */}
              <motion.button
                whileHover={inputVal.trim() && !isProcessingChat ? { scale: 1.08 } : {}}
                whileTap={inputVal.trim() && !isProcessingChat ? { scale: 0.92 } : {}}
                type="submit"
                id="btn-send-message"
                disabled={!inputVal.trim() || isProcessingChat}
                className={`absolute right-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                  inputVal.trim() && !isProcessingChat
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-md shadow-[var(--accent-primary)]/25 hover:opacity-90'
                    : 'text-[var(--text-muted)] bg-[var(--bg-hover)] cursor-not-allowed opacity-50'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: Artifact Panel */}
      <ArtifactPanel
        note={activeArtifactNote}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />

      {/* Attach source modal & upload drawer */}
      <AttachSourceModal
        isOpen={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        onAttach={handleAttachSource}
      />
      <UploadArea
        isOpen={isUploadAreaOpen}
        onClose={() => setIsUploadAreaOpen(false)}
        onUploaded={handleUploaded}
      />
      <CustomTemplateModal
        isOpen={isCustomTemplateModalOpen}
        onClose={() => setIsCustomTemplateModalOpen(false)}
      />
    </div>
  );
};
