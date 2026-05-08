import type { ReactNode } from 'react';

import { Eyebrow } from '@/components/atoms/Eyebrow';
import { MutedBodyText } from '@/components/atoms/MutedBodyText';
import { SectionTitle } from '@/components/atoms/SectionTitle';

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <header className="w-full max-w-5xl">
      <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
      <SectionTitle className="mb-4">{title}</SectionTitle>
      <MutedBodyText>{description}</MutedBodyText>
    </header>
  );
}
