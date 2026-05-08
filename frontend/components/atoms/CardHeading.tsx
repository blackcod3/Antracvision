import type { ReactNode } from 'react';

type CardHeadingProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeading({ children, className = '' }: CardHeadingProps) {
  return (
    <h3 className={`text-lg font-bold text-gray-900 sm:text-xl ${className}`}>{children}</h3>
  );
}
