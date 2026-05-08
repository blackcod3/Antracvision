import type { ReactNode } from 'react';

export type FeatureIconVariant = 'orange' | 'mint';

const variantClass: Record<FeatureIconVariant, string> = {
  orange: 'bg-[#ffe8d5]',
  mint: 'bg-[#d4f0e4]',
};

type IconContainerProps = {
  variant: FeatureIconVariant;
  children: ReactNode;
  className?: string;
};

export function IconContainer({ variant, children, className = '' }: IconContainerProps) {
  return (
    <div
      className={`inline-flex size-14 shrink-0 items-center justify-center rounded-xl ${variantClass[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
