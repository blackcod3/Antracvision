import { Eyebrow } from '@/components/atoms/Eyebrow';
import { InkHeading } from '@/components/atoms/InkHeading';
import { SubtitleText } from '@/components/atoms/SubtitleText';

type ProcessIntroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function ProcessIntro({ eyebrow, title, subtitle }: ProcessIntroProps) {
  return (
    <header className="mb-10 w-full max-w-5xl sm:mb-12">
      <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
      <InkHeading className="mb-3">{title}</InkHeading>
      <SubtitleText>{subtitle}</SubtitleText>
    </header>
  );
}
