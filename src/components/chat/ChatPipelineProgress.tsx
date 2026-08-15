import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface ChatPipelineProgressProps {
  currentStep: number;
}

export const ChatPipelineProgress: React.FC<ChatPipelineProgressProps> = ({ currentStep }) => {
  const { theme, language, selectedMethod, autoSelectedMethod } = useApp();
  const isDark = theme === 'dark';
  const isAuto = selectedMethod === 'auto';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`p-4 sm:p-5 rounded-2xl border shadow-xl space-y-4 max-w-2xl mx-auto ${
        isDark ? 'bg-[var(--bg-card)] border-[var(--accent-primary)]/30' : 'bg-white border-[var(--accent-primary)] shadow-[var(--accent-primary)]/5'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${
        isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-subtle)]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${'text-[var(--text-primary)]'}`}>
              {language === 'vi' ? 'Quy trình trích xuất & cấu trúc AI' : 'AI Extraction & Synthesis Pipeline'}
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
              {language === 'vi' ? 'Đang thực thi các bước phân tích dữ liệu chuyên sâu' : 'Executing deep multi-modal parsing stages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuto && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] px-2 py-0.5 rounded-lg border border-[var(--accent-primary)]/30">
              <Zap className="w-3 h-3 fill-[var(--accent-primary)] text-[var(--accent-primary)]" />
              Auto Mode
            </span>
          )}
          <span className="text-xs font-mono bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded-lg font-bold">
            {language === 'vi' ? 'Bước' : 'Step'} {currentStep} / 3
          </span>
        </div>
      </div>

      {/* Auto Method Selection Notice & Badge */}
      {isAuto && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
            isDark ? 'bg-[var(--accent-subtle)]/25 border-[var(--accent-primary)]/35' : 'bg-[var(--accent-subtle)]/90 border-[var(--accent-primary)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)] fill-[var(--accent-primary)] animate-pulse shrink-0" />
            <span className={`text-xs font-medium ${isDark ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-primary)]'}`}>
              {language === 'vi' 
                ? 'Đang phân tích để chọn phương pháp phù hợp...' 
                : 'Analyzing content to select optimal methodology...'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40">
            <span>{language === 'vi' ? 'AI đã chọn: ' : 'AI Selected: '}</span>
            <span className="uppercase text-[var(--accent-primary)] font-extrabold">{autoSelectedMethod ? autoSelectedMethod.toUpperCase() : 'CORNELL'}</span>
          </div>
        </motion.div>
      )}

      {/* Step 1 */}
      <div className="flex items-start gap-3">
        {currentStep > 1 ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--status-success)] shrink-0 mt-0.5" />
        ) : (
          <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 1 ? ('text-[var(--text-primary)]') : (isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]')
          }`}>
            {language === 'vi' ? '1. Đọc & Trích xuất nội dung nguồn' : '1. Parsing & Multi-modal Extraction'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
            {language === 'vi' ? 'Phân tích tài liệu PDF, bóc tách phụ đề video YouTube, lọc tạp âm và phân đoạn transcript.' : 'Extracting PDF layout, transcribing audio streams, removing noise artifacts.'}
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-3">
        {currentStep > 2 ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--status-success)] shrink-0 mt-0.5" />
        ) : currentStep === 2 ? (
          <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin shrink-0 mt-0.5" />
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-color)]'}`} />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 2 ? ('text-[var(--text-primary)]') : (isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]')
          }`}>
            {language === 'vi' ? '2. Phân tích ngữ nghĩa & Tạo dàn bài' : '2. Semantic Analysis & Blueprinting'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
            {language === 'vi' ? 'Tổng hợp các luận điểm chính, bảng so sánh và định vị các câu hỏi then chốt.' : 'Structuring key arguments, cross-referencing metrics, generating core questions.'}
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex items-start gap-3">
        {currentStep > 3 ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--status-success)] shrink-0 mt-0.5" />
        ) : currentStep === 3 ? (
          <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin shrink-0 mt-0.5" />
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-color)]'}`} />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 3 ? ('text-[var(--text-primary)]') : (isDark ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]')
          }`}>
            {language === 'vi' ? '3. Cấu trúc ghi chú chuẩn hoá' : '3. Note Standardization & Export'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
            {language === 'vi' ? 'Định dạng Markdown, bảng biểu, điểm tự tin AI và tải sang Artifact Panel.' : 'Compiling markdown tables, calculating confidence scores, syncing artifact panel.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
