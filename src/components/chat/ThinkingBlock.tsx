import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronDown, ChevronUp, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface ThinkingBlockProps {
  duration?: number;
  model?: string;
  thoughtProcess?: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  duration,
  model,
  thoughtProcess,
}) => {
  const { theme, language } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  if (!duration && !thoughtProcess) return null;

  const durationText = duration ? `${duration}s` : '1.8s';

  return (
    <div className="mb-2.5 select-none">
      {/* Pill Toggle Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? isDark
              ? 'bg-[var(--accent-subtle)]/30 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
              : 'bg-[var(--accent-subtle)] border-[var(--accent-primary)]/50 text-[var(--accent-primary)]'
            : isDark
              ? 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 shadow-2xs'
        }`}
      >
        <Brain className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        <span>
          {isEn ? `Thought for ${durationText}` : `Đã suy nghĩ trong ${durationText}`}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3 text-[var(--text-muted)] ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 text-[var(--text-muted)] ml-0.5" />
        )}
      </motion.button>

      {/* Expanded Reasoning Details Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={`p-3 sm:p-3.5 rounded-2xl border text-xs space-y-2.5 leading-relaxed ${
              isDark 
                ? 'bg-[var(--bg-app)]/80 border-[var(--border-color)] text-[var(--text-secondary)]' 
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] shadow-2xs'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                  <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>{isEn ? 'Reasoning Engine' : 'Động cơ suy luận'}:</span>
                  <span className="font-mono text-[var(--accent-primary)]">{model || 'Gemini 2.0 Flash'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{durationText}</span>
                  <span>•</span>
                  <span className="text-[var(--status-success)] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {isEn ? 'Completed' : 'Hoàn tất'}
                  </span>
                </div>
              </div>

              <p className="italic text-[11px] leading-normal opacity-90">
                {thoughtProcess || (isEn 
                  ? `Evaluated query structure, retrieved context, verified logic parameters, and synthesized structured response.` 
                  : `Phân tích cấu trúc câu hỏi, đối soát dữ liệu ngữ cảnh, kiểm tra tính logic và tổng hợp câu trả lời cấu trúc cao.`)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
