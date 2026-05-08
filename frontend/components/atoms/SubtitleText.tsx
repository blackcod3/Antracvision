import type { ReactNode } from 'react';

type SubtitleTextProps = {
  children: ReactNode;
  className?: string;
};

export function SubtitleText({ children, className = '' }: SubtitleTextProps) {
  return (
    <p className={`text-base md:text-lg text-gray-600 leading-relaxed ${className}`}>{children}</p>
  );
}
