import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const positionClasses: Record<'top' | 'bottom' | 'left' | 'right', string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all duration-150 border ${
            positionClasses[position]
          } bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-color)]`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
