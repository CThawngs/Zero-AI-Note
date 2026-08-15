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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 ease-out cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

  // Warm amber / terracotta theme styling
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)] active:bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30',
    secondary: isDark 
      ? 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)]' 
      : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-2xs',
    outline: isDark 
      ? 'bg-transparent border-[var(--border-color)] hover:border-[var(--accent-primary)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/50' 
      : 'bg-transparent border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-black hover:bg-[var(--accent-subtle)]/50',
    ghost: isDark 
      ? 'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]' 
      : 'bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--status-error)]/15 border border-[var(--status-error)]/30 text-[var(--status-error)] hover:bg-[var(--status-error)]/25 active:bg-[var(--status-error)]/30'
  };

  // Size specifications
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs gap-1',
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

