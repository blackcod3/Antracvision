import { Eyebrow } from '@/components/atoms/Eyebrow';
import { InkHeading } from '@/components/atoms/InkHeading';
import { SubtitleText } from '@/components/atoms/SubtitleText';
import { DiseasePhaseCard } from '@/components/molecules/DiseasePhaseCard';

import { ANTHRACNOSE_PHASES } from '@/lib/diseasePhaseContent';

export function DiseasePhasesSection() {
  return (
    <section
      aria-labelledby="fases-antracnosis"
      className="mt-14 scroll-mt-24 rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-10 shadow-sm backdrop-blur-[2px] sm:mt-16 sm:rounded-3xl sm:px-8 sm:py-12 md:mt-20 md:px-10"
    >
      <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
        <Eyebrow className="mb-3">Avance típico</Eyebrow>
        <InkHeading as="h2" id="fases-antracnosis" className="mb-4">
          Cómo avanza la enfermedad en el fruto
        </InkHeading>
      </header>

      <div className="mx-auto max-w-3xl">
        {ANTHRACNOSE_PHASES.map((item, index) => (
          <DiseasePhaseCard
            key={item.phase}
            item={item}
            isLast={index === ANTHRACNOSE_PHASES.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
