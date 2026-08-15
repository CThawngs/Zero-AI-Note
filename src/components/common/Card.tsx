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
          ? 'bg-[#201D1A] border-[#36302A] text-[#F7F4EE]' 
          : 'bg-white border-[#E6E0D6] text-[#26221D] shadow-sm'
      } ${
        hoverEffect 
          ? isDark 
            ? 'hover:border-amber-500/40 hover:bg-[#26221E] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30' 
            : 'hover:border-amber-600/40 hover:shadow-md hover:shadow-amber-900/5 hover:-translate-y-0.5 hover:bg-[#FDFBF7]' 
          : ''
      } ${
        selected 
          ? 'border-amber-500 ring-2 ring-amber-500/30' 
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

