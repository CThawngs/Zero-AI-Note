import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Cpu, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface AIThinkingEffectProps {
  currentStep?: number;
  modelName?: string;
  hasAttachments?: boolean;
}

export const AIThinkingEffect: React.FC<AIThinkingEffectProps> = ({
  modelName,
  hasAttachments = false,
}) => {
  const { theme, language, selectedModel } = useApp();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Live thinking timer (100ms interval for ultra-smooth precision)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);
  const activeModel = modelName || selectedModel || 'Gemini 2.0 Flash';

  // Dynamic thinking step based on elapsed time
  const getThinkingPhase = () => {
    if (elapsedMs < 1200) {
      return isEn 
        ? 'Analyzing query context & parameters...' 
        : 'Đang phân tích câu hỏi & ngữ cảnh...';
    }
    if (elapsedMs < 3000) {
      return isEn 
        ? 'Executing deep reasoning chain & synthesis...' 
        : 'Đang kích hoạt chuỗi suy luận & đối chiếu dữ liệu...';
    }
    return isEn 
      ? 'Synthesizing response & formatting structure...' 
      : 'Đang định dạng bài giảng & hoàn tất phản hồi...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-2.5 sm:gap-3.5 justify-start w-full"
    >
      {/* AI Avatar with Glowing Pulse */}
      <div className="relative shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center shadow-md shadow-[var(--accent-primary)]/30 text-[var(--accent-text)]">
          <Brain className="w-4 h-4 animate-pulse" />
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--status-success)] border-2 border-[var(--bg-app)] animate-ping" />
      </div>

      {/* Thinking Container */}
      <div className="max-w-[92%] sm:max-w-[85%] space-y-2">
        <div className={`rounded-2xl border transition-all overflow-hidden shadow-md ${
          isDark 
            ? 'bg-[var(--bg-card)]/90 border-[var(--accent-primary)]/40 shadow-[var(--accent-primary)]/5' 
            : 'bg-white/95 border-[var(--accent-primary)]/40 shadow-lg shadow-[var(--accent-primary)]/5'
        }`}>
          {/* Header Bar with Live Timer & Model Badge */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-2.5 flex items-center justify-between gap-2 border-b cursor-pointer select-none transition-colors ${
              isDark ? 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]' : 'border-[var(--border-subtle)] hover:bg-[var(--accent-subtle)]/30'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" style={{ animationDuration: '3s' }} />
              <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                <span>{isEn ? 'Thinking' : 'Đang suy nghĩ'}</span>
                <span className="font-mono font-extrabold text-[var(--accent-primary)] bg-[var(--accent-subtle)] px-1.5 py-0.2 rounded-md border border-[var(--accent-primary)]/30">
                  {elapsedSeconds}s
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)] truncate max-w-[140px]">
                {activeModel}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {/* Collapsible Thinking Stream Content */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3.5 space-y-3 text-xs"
            >
              {/* Dynamic Phase Status */}
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping shrink-0" />
                <p className="text-[12px] font-medium text-[var(--text-secondary)] italic">
                  {getThinkingPhase()}
                </p>
              </div>

              {/* Shimmer reasoning placeholder lines */}
              <div className="space-y-2 pt-1">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-[var(--accent-primary)]/20 via-[var(--accent-primary)]/40 to-[var(--accent-primary)]/10 animate-pulse w-[88%]" />
                <div className="h-2.5 rounded-full bg-gradient-to-r from-[var(--accent-primary)]/15 via-[var(--accent-primary)]/30 to-[var(--accent-primary)]/10 animate-pulse w-[72%]" />
                <div className="h-2.5 rounded-full bg-gradient-to-r from-[var(--accent-primary)]/10 via-[var(--accent-primary)]/25 to-[var(--accent-primary)]/5 animate-pulse w-[54%]" />
              </div>

              {/* Reasoning steps pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <Cpu className="w-3 h-3 text-[var(--accent-primary)]" />
                  {isEn ? 'Deep Reasoning' : 'Suy luận sâu'}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-color)]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {isEn ? 'Zero-latency Chain' : 'Xử lý tốc độ cao'}
                </span>
                {hasAttachments && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-color)]">
                    📄 {isEn ? 'Source Parsed' : 'Đã nạp file'}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
