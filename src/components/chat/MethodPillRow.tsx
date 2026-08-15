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
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs shadow-amber-600/30 border border-amber-400/40 ring-1 ring-amber-500/30'
                  : isDark 
                    ? 'border border-dashed border-amber-500/50 text-amber-400 hover:text-white hover:bg-amber-500/10' 
                    : 'border border-dashed border-amber-500/60 text-amber-700 hover:text-amber-900 hover:bg-amber-500/10'
              }`}
            >
              <Zap className={`w-3 h-3 ${isSelected ? 'fill-white text-white animate-pulse' : 'text-amber-500'}`} />
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
                ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/30'
                : isDark 
                  ? 'bg-[#2A241E] text-[#D8D2C9] hover:text-white border border-[#3E372E] hover:border-[#52493D]' 
                  : 'bg-white text-[#4A4239] hover:text-[#26221D] border border-[#E2DBD0] hover:border-[#CCC2B2] shadow-2xs'
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
            ? 'border-[#443C32] text-[#A8A199] hover:text-white hover:border-amber-500/50' 
            : 'border-[#CCC2B2] text-[#6E665D] hover:text-[#26221D] hover:border-amber-600/50'
        }`}
      >
        <Plus className="w-3 h-3" />
        <span>{t('customMethod')}</span>
      </button>
    </div>
  );
};
