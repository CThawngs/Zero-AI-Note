import React from 'react';

export const NoteCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] animate-pulse flex flex-col justify-between h-[210px]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-20 bg-[var(--bg-hover)] rounded-full" />
          <div className="h-4 w-12 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="h-5 w-3/4 bg-[var(--bg-hover)] rounded mb-2" />
        <div className="h-4 w-full bg-[var(--bg-hover)] rounded mb-1.5" />
        <div className="h-4 w-2/3 bg-[var(--bg-hover)] rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
        <div className="flex gap-2">
          <div className="w-5 h-5 bg-[var(--bg-hover)] rounded" />
          <div className="w-5 h-5 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="h-3 w-16 bg-[var(--bg-hover)] rounded" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-[var(--bg-hover)] rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full" />
      ))}
    </div>
  );
};

