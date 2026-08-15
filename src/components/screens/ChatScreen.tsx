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
  PanelRightClose
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteMethod } from '../../types';
import { ArtifactPanel } from './ArtifactPanel';
import { AttachSourceModal } from '../modals/AttachSourceModal';
import { CustomTemplateModal } from '../modals/CustomTemplateModal';
import { MethodPillRow } from '../chat/MethodPillRow';
import { ChatPipelineProgress } from '../chat/ChatPipelineProgress';

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
    setAttachedSources(prev => [...prev, source]);
    addToast(
      language === 'vi' ? 'Đã đính kèm' : 'Source Attached', 
      `"${source.name}" ${language === 'vi' ? 'đã sẵn sàng để trích xuất.' : 'ready for extraction.'}`
    );
  };

  const handleQuickQuestionClick = (methodName: NoteMethod) => {
    setSelectedMethod(methodName);
    sendChatMessage(
      language === 'vi' 
        ? `Hãy áp dụng phương pháp ${methodName.toUpperCase()} để cấu trúc toàn bộ nội dung tài liệu.`
        : `Please apply the ${methodName.toUpperCase()} framework to structure the entire document content.`
    );
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex-1 flex h-full overflow-hidden relative transition-colors duration-200 ${
      isDark ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-app)] text-[var(--text-primary)]'
    }`}>
      {/* Left / Center: Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Chat Header for toggling artifact panel if closed */}
        <div className={`h-11 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[var(--bg-card)]/90 border-[var(--border-color)]' : 'bg-[var(--bg-surface)]/95 border-[var(--border-color)]'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className={`text-xs font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
              {language === 'vi' ? 'Hội thoại & Trích xuất ghi chú AI' : 'AI Research & Note Synthesis'}
            </span>
          </div>

          {activeArtifactNote && (
            <button
              onClick={() => setIsArtifactOpen(!isArtifactOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer active:scale-95 ${
                isArtifactOpen
                  ? isDark ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/35 text-[var(--accent-primary)] font-semibold' : 'bg-[var(--accent-subtle)] border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                  : isDark ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]' : 'bg-white border-[var(--border-color)] text-[var(--text-secondary)] shadow-2xs'
              }`}
            >
              {isArtifactOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isArtifactOpen ? t('hideArtifact') : t('openArtifact')}</span>
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className={`flex gap-2.5 sm:gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] via-[var(--accent-primary)] to-[var(--accent-primary)] flex items-center justify-center shrink-0 shadow-md shadow-[var(--accent-primary)]/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[82%] space-y-2`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[var(--accent-primary)] text-white rounded-br-xs shadow-md shadow-[var(--accent-primary)]/20 font-normal'
                        : isDark 
                          ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-xs shadow-sm' 
                          : 'bg-white text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attached files preview in message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`mt-3 flex flex-wrap gap-1.5 pt-2 border-t ${
                        msg.sender === 'user' ? 'border-[var(--accent-primary)]/30' : (isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]')
                      }`}>
                        {msg.attachments.map((att, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              msg.sender === 'user'
                                ? 'bg-[var(--accent-primary)]/60 text-[var(--accent-text)]'
                                : (isDark ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]')
                            }`}
                          >
                            {att.type === 'youtube' ? (
                              <Youtube className="w-3.5 h-3.5 text-[var(--status-error)]" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                            )}
                            <span className="truncate max-w-[180px]">{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive clarification pills if AI asks */}
                  {msg.sender === 'ai' && msg.id.includes('ask') && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['cornell', 'outline', 'quick-summary'].map((m) => (
                        <button
                          key={m}
                          id={`btn-quick-choice-${m}`}
                          onClick={() => handleQuickQuestionClick(m as NoteMethod)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isDark 
                              ? 'bg-[var(--bg-card)] hover:bg-[var(--accent-primary)]/20 border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]' 
                              : 'bg-white hover:bg-[var(--accent-subtle)] border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
                          }`}
                        >
                          ✨ {language === 'vi' ? 'Chọn' : 'Select'} {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Result Note Card link in message */}
                  {msg.noteResultId && (
                    <div className="pt-2">
                      {(() => {
                        const targetNote = notes.find(n => n.id === msg.noteResultId) || activeArtifactNote;
                        if (!targetNote) return null;
                        return (
                          <div
                            id="btn-open-generated-note"
                            onClick={() => {
                              openNoteDetail(targetNote);
                            }}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-sm active:scale-[0.99] ${
                              isDark 
                                ? 'bg-[var(--bg-card)] border-[var(--accent-primary)]/35 hover:border-[var(--accent-primary)] hover:bg-[var(--bg-hover)]' 
                                : 'bg-white border-[var(--accent-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-subtle)]/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className={`text-xs font-semibold transition-colors ${
                                  'text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]'
                                }`}>
                                  {targetNote.title}
                                </h4>
                                <p className={`text-xs ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                                  {language === 'vi' ? 'Xem chi tiết bài ghi chú trích xuất' : 'View full structured note'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <span className={`block text-xs px-1 ${isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDark ? 'bg-[var(--bg-hover)] border-[var(--border-color)]' : 'bg-[var(--bg-hover)] border-[var(--border-color)]'
                  }`}>
                    <span className={`text-xs font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>ZU</span>
                  </div>
                )}
              </motion.div>
            ))}

            {/* AI Multi-step Processing Pipeline Card (Extracted subcomponent) */}
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
            {/* Note Method Selection Pills (Extracted subcomponent) */}
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
                      <Youtube className="w-3.5 h-3.5 text-[var(--status-error)]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    )}
                    <span className="truncate max-w-[180px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedSources(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[var(--text-muted)] hover:text-[var(--status-error)] ml-1 cursor-pointer p-1"
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
              <button
                type="button"
                id="btn-attach-source"
                onClick={() => setIsAttachModalOpen(true)}
                className={`absolute left-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                  isDark ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                title={t('attachSource')}
                aria-label={t('attachSource')}
              >
                <Paperclip className="w-4 h-4" />
              </button>

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
                className={`w-full border rounded-2xl pl-12 pr-12 py-3 text-sm focus:outline-none transition-colors custom-scrollbar resize-none max-h-32 ${
                  isDark 
                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30' 
                    : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/20 shadow-xs'
                }`}
              />

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-send-message"
                disabled={!inputVal.trim() || isProcessingChat}
                className={`absolute right-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  inputVal.trim() && !isProcessingChat
                    ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/25 hover:bg-[var(--accent-primary)]'
                    : isDark ? 'text-[var(--text-muted)] bg-[var(--bg-hover)] cursor-not-allowed' : 'text-[var(--text-muted)] bg-[var(--bg-hover)] cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: Artifact Panel (Responsive overlay on mobile or split pane on desktop) */}
      <ArtifactPanel
        note={activeArtifactNote}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />

      {/* Modals */}
      <AttachSourceModal
        isOpen={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        onAttach={handleAttachSource}
      />

      <CustomTemplateModal
        isOpen={isCustomTemplateModalOpen}
        onClose={() => setIsCustomTemplateModalOpen(false)}
      />
    </div>
  );
};

