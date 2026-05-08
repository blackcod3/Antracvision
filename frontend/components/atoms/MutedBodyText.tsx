import type { ReactNode } from 'react';

type MutedBodyTextProps = {
  children: ReactNode;
  className?: string;
};

export function MutedBodyText({ children, className = '' }: MutedBodyTextProps) {
  return (
    <p className={`text-sm leading-relaxed text-zinc-400 sm:text-base md:text-lg ${className}`}>
      {children}
    </p>
  );
}
