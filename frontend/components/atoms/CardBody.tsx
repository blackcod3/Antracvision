import type { ReactNode } from 'react';

type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <p className={`text-sm leading-relaxed text-gray-600 sm:text-[15px] ${className}`}>
      {children}
    </p>
  );
}
