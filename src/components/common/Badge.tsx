import React from 'react';

export type BadgeVariant = 'default' | 'blue' | 'accent' | 'success' | 'warning' | 'danger' | 'purple' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-lg whitespace-nowrap select-none';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-color)] dark:bg-[var(--bg-hover)] dark:text-[var(--text-secondary)]',
    blue: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    accent: 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/35 font-semibold',
    success: 'bg-[var(--status-success)]/15 text-[var(--status-success)] border border-[var(--status-success)]/30',
    warning: 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    danger: 'bg-[var(--status-error)]/15 text-[var(--status-error)] border border-[var(--status-error)]/30',
    purple: 'bg-[var(--accent-subtle)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)]'
  };

  const dotClasses: Record<BadgeVariant, string> = {
    default: 'bg-[var(--text-muted)]',
    blue: 'bg-[var(--accent-primary)]',
    accent: 'bg-[var(--accent-primary)]',
    success: 'bg-[var(--status-success)]',
    warning: 'bg-[var(--accent-primary)]',
    danger: 'bg-[var(--status-error)]',
    purple: 'bg-[var(--accent-primary)]',
    outline: 'bg-[var(--text-muted)]'
  };

  const sizeClasses: Record<BadgeSize, string> = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5'
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

