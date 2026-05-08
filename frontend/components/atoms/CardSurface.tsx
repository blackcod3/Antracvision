import type { ReactNode } from 'react';

type CardSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function CardSurface({ children, className = '' }: CardSurfaceProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.06] p-4 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
