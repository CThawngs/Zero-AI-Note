import React from 'react';
import { useApp } from '../../context/AppContext';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverEffect = false,
  selected = false,
  children,
  className = '',
  ...props
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ease-out ${
        isDark 
          ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)]' 
          : 'bg-white border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
      } ${
        hoverEffect 
          ? isDark 
            ? 'hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30' 
            : 'hover:border-[var(--accent-primary)]/40 hover:shadow-md hover:shadow-[var(--accent-primary)]/5 hover:-translate-y-0.5 hover:bg-[var(--bg-hover)]' 
          : ''
      } ${
        selected 
          ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30' 
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

