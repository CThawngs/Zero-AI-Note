import React from 'react';
import { Plus, Zap } from 'lucide-react';
import { NoteMethod } from '../../types';
import { useApp } from '../../context/AppContext';

export interface MethodPillRowProps {
  methods: { id: NoteMethod; label: string }[];
  selectedMethod: NoteMethod;
  onSelectMethod: (method: NoteMethod) => void;
  onOpenCustomTemplate: () => void;
  disabled?: boolean;
}

export const MethodPillRow: React.FC<MethodPillRowProps> = ({
  methods,
  selectedMethod,
  onSelectMethod,
  onOpenCustomTemplate,
  disabled = false
}) => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
      {methods.map(m => {
        const isSelected = selectedMethod === m.id;
        const isAuto = m.id === 'auto';

        if (isAuto) {
          return (
            <button
              key={m.id}
              id="pill-method-auto"
              type="button"
              disabled={disabled}
              onClick={() => onSelectMethod('auto')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)] text-white shadow-xs shadow-[var(--accent-primary)]/30 border border-[var(--accent-primary)]/40 ring-1 ring-[var(--accent-primary)]/30'
                  : isDark 
                    ? 'border border-dashed border-[var(--accent-primary)]/50 text-[var(--accent-primary)] hover:text-white hover:bg-[var(--accent-primary)]/10' 
                    : 'border border-dashed border-[var(--accent-primary)]/60 text-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'
              }`}
            >
              <Zap className={`w-3 h-3 ${isSelected ? 'fill-white text-white animate-pulse' : 'text-[var(--accent-primary)]'}`} />
              <span>{m.label}</span>
            </button>
          );
        }

        return (
          <button
            key={m.id}
            id={`pill-method-${m.id}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMethod(m.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
              isSelected
                ? 'bg-[var(--accent-primary)] text-white shadow-xs shadow-[var(--accent-primary)]/30'
                : isDark 
                  ? 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-color)]' 
                  : 'bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-color)] shadow-2xs'
            }`}
          >
            {m.label}
          </button>
        );
      })}

      <button
        id="btn-custom-method-template"
        type="button"
        disabled={disabled}
        onClick={onOpenCustomTemplate}
        className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer border border-dashed active:scale-95 ${
          isDark 
            ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50' 
            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50'
        }`}
      >
        <Plus className="w-3 h-3" />
        <span>{t('customMethod')}</span>
      </button>
    </div>
  );
};
