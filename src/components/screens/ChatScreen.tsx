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
      isDark ? 'bg-[#1F1B18] text-[#F7F4EE]' : 'bg-[#FAF7F2] text-[#26221D]'
    }`}>
      {/* Left / Center: Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Chat Header for toggling artifact panel if closed */}
        <div className={`h-11 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 ${
          isDark ? 'bg-[#24201C]/90 border-[#38322B]' : 'bg-[#FCFAF7]/95 border-[#E6E0D6]'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className={`text-xs font-semibold ${isDark ? 'text-[#EDE7DE]' : 'text-[#3A3229]'}`}>
              {language === 'vi' ? 'Hội thoại & Trích xuất ghi chú AI' : 'AI Research & Note Synthesis'}
            </span>
          </div>

          {activeArtifactNote && (
            <button
              onClick={() => setIsArtifactOpen(!isArtifactOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer active:scale-95 ${
                isArtifactOpen
                  ? isDark ? 'bg-amber-600/20 border-amber-500/35 text-amber-400 font-semibold' : 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                  : isDark ? 'bg-[#2A241E] border-[#3E372E] text-[#D8D2C9]' : 'bg-white border-[#E2DBD0] text-[#4E463E] shadow-2xs'
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-600/25">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[82%] space-y-2`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-600 text-white rounded-br-xs shadow-md shadow-amber-600/20 font-normal'
                        : isDark 
                          ? 'bg-[#28231E] text-[#F7F4EE] border border-[#3C352D] rounded-tl-xs shadow-sm' 
                          : 'bg-white text-[#26221D] border border-[#E6E0D6] shadow-2xs rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attached files preview in message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={`mt-3 flex flex-wrap gap-1.5 pt-2 border-t ${
                        msg.sender === 'user' ? 'border-amber-400/30' : (isDark ? 'border-[#3C352D]' : 'border-[#EAE4D9]')
                      }`}>
                        {msg.attachments.map((att, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              msg.sender === 'user'
                                ? 'bg-amber-700/60 text-amber-100'
                                : (isDark ? 'bg-[#322B24] text-[#D8D2C9]' : 'bg-[#F2ECE3] text-[#4A4239]')
                            }`}
                          >
                            {att.type === 'youtube' ? (
                              <Youtube className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
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
                              ? 'bg-[#28231E] hover:bg-amber-600/20 border-[#3C352D] hover:border-amber-500/40 text-[#D8D2C9] hover:text-amber-300' 
                              : 'bg-white hover:bg-amber-50 border-[#E2DBD0] hover:border-amber-400 text-[#4A4239] hover:text-amber-800'
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
                                ? 'bg-[#26211C] border-amber-500/35 hover:border-amber-500 hover:bg-[#2F2923]' 
                                : 'bg-white border-amber-300 hover:border-amber-500 hover:bg-amber-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-500 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className={`text-xs font-semibold transition-colors ${
                                  isDark ? 'text-white group-hover:text-amber-400' : 'text-[#26221D] group-hover:text-amber-700'
                                }`}>
                                  {targetNote.title}
                                </h4>
                                <p className={`text-[11px] ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
                                  {language === 'vi' ? 'Xem chi tiết bài ghi chú trích xuất' : 'View full structured note'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#8C857B] group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <span className={`block text-[10px] px-1 ${isDark ? 'text-[#8C857B]' : 'text-[#968D82]'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDark ? 'bg-[#2E2822] border-[#3E372E]' : 'bg-[#EAE4D9] border-[#DDD5C8]'
                  }`}>
                    <span className={`text-xs font-semibold ${isDark ? 'text-[#EDE7DE]' : 'text-[#3A3229]'}`}>ZU</span>
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
          isDark ? 'border-[#38322B] bg-[#1F1B18]/95' : 'border-[#E6E0D6] bg-[#FCFAF7]/95'
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
                isDark ? 'bg-[#26211C] border-[#38322B]' : 'bg-[#F5F0E6] border-[#E2DBD0]'
              }`}>
                {attachedSources.map((att, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                      isDark ? 'bg-[#302A24] text-[#EDE7DE] border-[#443C32]' : 'bg-white text-[#26221D] border-[#E2DBD0] shadow-2xs'
                    }`}
                  >
                    {att.type === 'youtube' ? (
                      <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="truncate max-w-[180px]">{att.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedSources(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[#8C857B] hover:text-rose-500 ml-1 cursor-pointer p-1"
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
                  isDark ? 'text-[#A8A199] hover:text-white hover:bg-[#2F2923]' : 'text-[#6E665D] hover:text-[#26221D] hover:bg-[#EAE4D9]'
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
                    ? 'bg-[#26211C] border-[#38322B] text-[#F7F4EE] placeholder-[#8A8177] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30' 
                    : 'bg-white border-[#E2DBD0] text-[#26221D] placeholder-[#9E958A] focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20 shadow-xs'
                }`}
              />

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-send-message"
                disabled={!inputVal.trim() || isProcessingChat}
                className={`absolute right-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  inputVal.trim() && !isProcessingChat
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 hover:bg-amber-500'
                    : isDark ? 'text-[#7A7167] bg-[#241F1A] cursor-not-allowed' : 'text-[#9E958A] bg-[#EDE7DE] cursor-not-allowed'
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

