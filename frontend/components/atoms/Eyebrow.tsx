import type { ReactNode } from 'react';

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <p
      className={`text-[#f59040] text-xs font-semibold tracking-[0.2em] uppercase ${className}`}
    >
      {children}
    </p>
  );
}
