import type { ReactNode } from 'react';

type InkHeadingProps = {
  children: ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
  id?: string;
};

export function InkHeading({ children, as: Tag = 'h2', className = '', id }: InkHeadingProps) {
  return (
    <Tag
      id={id}
      className={`text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl ${className}`}
    >
      {children}
    </Tag>
  );
}
