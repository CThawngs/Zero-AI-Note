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
        isDark ? 'bg-[#26211C] border-amber-500/30' : 'bg-white border-amber-300 shadow-amber-500/5'
      }`}
    >
      <div className={`flex items-center justify-between border-b pb-3 ${
        isDark ? 'border-[#38322B]' : 'border-[#EAE4D9]'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-600/20 flex items-center justify-center text-amber-500">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-[#26221D]'
            }`}>
              {language === 'vi' ? 'Quy trình trích xuất & cấu trúc AI' : 'AI Extraction & Synthesis Pipeline'}
            </h4>
            <p className={`text-[11px] ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
              {language === 'vi' ? 'Đang thực thi các bước phân tích dữ liệu chuyên sâu' : 'Executing deep multi-modal parsing stages'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuto && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-500/30">
              <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
              Auto Mode
            </span>
          )}
          <span className="text-xs font-mono bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-lg font-bold">
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
            isDark ? 'bg-amber-950/25 border-amber-500/35' : 'bg-amber-50/90 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse shrink-0" />
            <span className={`text-xs font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
              {language === 'vi' 
                ? 'Đang phân tích để chọn phương pháp phù hợp...' 
                : 'Analyzing content to select optimal methodology...'}
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40">
            <span>{language === 'vi' ? 'AI đã chọn: ' : 'AI Selected: '}</span>
            <span className="uppercase text-amber-400 font-extrabold">{autoSelectedMethod ? autoSelectedMethod.toUpperCase() : 'CORNELL'}</span>
          </div>
        </motion.div>
      )}

      {/* Step 1 */}
      <div className="flex items-start gap-3">
        {currentStep > 1 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 1 ? (isDark ? 'text-white' : 'text-[#26221D]') : (isDark ? 'text-[#7A7167]' : 'text-[#9E958A]')
          }`}>
            {language === 'vi' ? '1. Đọc & Trích xuất nội dung nguồn' : '1. Parsing & Multi-modal Extraction'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
            {language === 'vi' ? 'Phân tích tài liệu PDF, bóc tách phụ đề video YouTube, lọc tạp âm và phân đoạn transcript.' : 'Extracting PDF layout, transcribing audio streams, removing noise artifacts.'}
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-3">
        {currentStep > 2 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : currentStep === 2 ? (
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0 mt-0.5" />
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${isDark ? 'border-[#443C32]' : 'border-[#DDD5C8]'}`} />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 2 ? (isDark ? 'text-white' : 'text-[#26221D]') : (isDark ? 'text-[#7A7167]' : 'text-[#9E958A]')
          }`}>
            {language === 'vi' ? '2. Phân tích ngữ nghĩa & Tạo dàn bài' : '2. Semantic Analysis & Blueprinting'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
            {language === 'vi' ? 'Tổng hợp các luận điểm chính, bảng so sánh và định vị các câu hỏi then chốt.' : 'Structuring key arguments, cross-referencing metrics, generating core questions.'}
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex items-start gap-3">
        {currentStep > 3 ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        ) : currentStep === 3 ? (
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0 mt-0.5" />
        ) : (
          <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${isDark ? 'border-[#443C32]' : 'border-[#DDD5C8]'}`} />
        )}
        <div>
          <p className={`text-xs font-semibold ${
            currentStep >= 3 ? (isDark ? 'text-white' : 'text-[#26221D]') : (isDark ? 'text-[#7A7167]' : 'text-[#9E958A]')
          }`}>
            {language === 'vi' ? '3. Cấu trúc ghi chú chuẩn hoá' : '3. Note Standardization & Export'}
          </p>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#A8A199]' : 'text-[#6E665D]'}`}>
            {language === 'vi' ? 'Định dạng Markdown, bảng biểu, điểm tự tin AI và tải sang Artifact Panel.' : 'Compiling markdown tables, calculating confidence scores, syncing artifact panel.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
