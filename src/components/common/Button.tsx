import React from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  // Base classes for consistent sizing and tactile micro-interaction feedback
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

  // Warm amber / terracotta theme styling
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-md shadow-amber-600/20 border border-amber-500/30',
    secondary: isDark 
      ? 'bg-[#25211D] hover:bg-[#302B25] text-[#EBE6DE] border border-[#3D362F]' 
      : 'bg-[#F2ECE3] hover:bg-[#E7E0D3] text-[#2C2620] border border-[#DDD5C8] shadow-2xs',
    outline: isDark 
      ? 'bg-transparent border-[#3D362F] hover:border-amber-500/60 text-[#D4CCC2] hover:text-white hover:bg-[#25211D]/50' 
      : 'bg-transparent border-[#DDD5C8] hover:border-amber-600 text-[#4E463E] hover:text-black hover:bg-amber-50/50',
    ghost: isDark 
      ? 'bg-transparent hover:bg-[#25211D] text-[#A8A199] hover:text-[#FAF7F2]' 
      : 'bg-transparent hover:bg-[#F2ECE3] text-[#6E665D] hover:text-[#1F1B16]',
    danger: 'bg-rose-600/15 border border-rose-500/30 text-rose-500 hover:bg-rose-600/25 active:bg-rose-600/30'
  };

  // Size specifications
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-[11px] gap-1',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

