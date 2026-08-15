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
    default: 'bg-[#2B2620] text-[#D8D0C5] border border-[#3E372E] dark:bg-[#2B2620] dark:text-[#D8D0C5]',
    blue: 'bg-amber-600/15 text-amber-500 border border-amber-600/30',
    accent: 'bg-amber-600/20 text-amber-500 border border-amber-600/35 font-semibold',
    success: 'bg-emerald-600/15 text-emerald-500 border border-emerald-600/30',
    warning: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
    danger: 'bg-rose-600/15 text-rose-500 border border-rose-600/30',
    purple: 'bg-orange-600/15 text-orange-400 border border-orange-600/30',
    outline: 'bg-transparent text-[#A8A199] border border-[#3E372E]'
  };

  const dotClasses: Record<BadgeVariant, string> = {
    default: 'bg-[#A8A199]',
    blue: 'bg-amber-500',
    accent: 'bg-amber-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    purple: 'bg-orange-500',
    outline: 'bg-[#A8A199]'
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

