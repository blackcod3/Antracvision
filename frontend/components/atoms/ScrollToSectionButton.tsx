'use client';

import type { ReactNode } from 'react';

type ScrollToSectionButtonProps = {
  targetId: string;
  className?: string;
  children: ReactNode;
};

export function ScrollToSectionButton({
  targetId,
  className,
  children,
}: ScrollToSectionButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const section = document.getElementById(targetId);
        if (!section) return;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
    >
      {children}
    </button>
  );
}
