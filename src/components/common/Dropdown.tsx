import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder,
  label,
  size = 'md',
  className = ''
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border text-left transition-colors cursor-pointer active:scale-[0.99] bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 ${
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs sm:text-sm'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder || 'Select'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-full min-w-[180px] max-h-60 overflow-y-auto rounded-xl border shadow-xl z-50 p-1 custom-scrollbar bg-[var(--bg-card)] border-[var(--border-color)]"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                option.value === value
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <div className="truncate flex-1">
                <p className="truncate">{option.label}</p>
                {option.description && (
                  <p className="text-[10px] truncate text-[var(--text-muted)]">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
