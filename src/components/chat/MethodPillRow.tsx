import React from 'react';
import { Plus, Zap, BookOpen, ListTree, HelpCircle, Layers, FileText } from 'lucide-react';
import { NoteMethod } from '../../types';
import { useApp } from '../../context/AppContext';

export interface MethodPillRowProps {
  methods: { id: NoteMethod; label: string }[];
  selectedMethod: NoteMethod;
  onSelectMethod: (method: NoteMethod) => void;
  onOpenCustomTemplate: () => void;
  disabled?: boolean;
}

const METHOD_ICONS: Partial<Record<NoteMethod, React.ComponentType<{ className?: string }>>> = {
  auto: Zap,
  cornell: BookOpen,
  outline: ListTree,
  qa: HelpCircle,
  flashcard: Layers,
  'quick-summary': FileText,
};

export const MethodPillRow: React.FC<MethodPillRowProps> = ({
  methods,
  selectedMethod,
  onSelectMethod,
  onOpenCustomTemplate,
  disabled = false,
}) => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 custom-scrollbar select-none">
      {methods.map((m) => {
        const isSelected = selectedMethod === m.id;
        const isAuto = m.id === 'auto';
        const IconComponent = METHOD_ICONS[m.id];

        if (isAuto) {
          return (
            <button
              key={m.id}
              id="pill-method-auto"
              type="button"
              disabled={disabled}
              onClick={() => onSelectMethod('auto')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
                isSelected
                  ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm shadow-[var(--accent-primary)]/30 ring-2 ring-[var(--accent-primary)]/30'
                  : 'border border-dashed border-[var(--accent-primary)]/60 text-[var(--text-primary)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-primary)]'
              }`}
            >
              <Zap
                className={`w-3.5 h-3.5 ${
                  isSelected
                    ? 'fill-current text-[var(--accent-text)]'
                    : 'text-[var(--accent-primary)]'
                }`}
              />
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              isSelected
                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-sm shadow-[var(--accent-primary)]/20 ring-1 ring-[var(--accent-primary)]/40 font-bold'
                : isDark
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-muted)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-muted)] shadow-2xs'
            }`}
          >
            {IconComponent && (
              <IconComponent
                className={`w-3.5 h-3.5 ${
                  isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                }`}
              />
            )}
            <span>{m.label}</span>
          </button>
        );
      })}

      <button
        id="btn-custom-method-template"
        type="button"
        disabled={disabled}
        onClick={onOpenCustomTemplate}
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer border border-dashed active:scale-95 shrink-0 ${
          isDark
            ? 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 hover:bg-[var(--bg-hover)]'
            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 hover:bg-[var(--bg-hover)]'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{t('customMethod')}</span>
      </button>
    </div>
  );
};
