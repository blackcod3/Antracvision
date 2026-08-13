import Image from 'next/image';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Eyebrow } from '@/components/atoms/Eyebrow';
import { InkHeading } from '@/components/atoms/InkHeading';
import { SubtitleText } from '@/components/atoms/SubtitleText';
import { ANTHRACNOSE_BROCHURE } from '@/lib/diseasePhaseContent';

export function DiseaseBrochureSection() {
  return (
    <section
      aria-labelledby="folleto-antracnosis"
      className="mt-16 md:mt-24"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm sm:rounded-3xl">
        <div className="grid items-center gap-8 p-6 sm:gap-10 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-14 lg:p-10">
          <div className="max-w-xl">
            <Eyebrow className="mb-3">Material de apoyo</Eyebrow>
            <InkHeading as="h2" id="folleto-antracnosis" className="mb-4">
              {ANTHRACNOSE_BROCHURE.title}
            </InkHeading>
            <SubtitleText className="mb-8">
              Guía visual para identificar síntomas, entender el avance de la enfermedad y
              orientar el manejo en el cultivo de cítricos.
            </SubtitleText>
            <Link
              href={ANTHRACNOSE_BROCHURE.href}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ff731a] px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#ff5900] active:bg-[#e34e00] sm:w-auto"
            >
              <FileText className="size-5 shrink-0" aria-hidden />
              Ver folleto
            </Link>
          </div>

          <Link
            href={ANTHRACNOSE_BROCHURE.href}
            aria-label="Abrir folleto de antracnosis en cítricos"
            className="group mx-auto block w-[min(100%,16rem)] shrink-0 sm:w-[18rem]"
          >
            <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-zinc-100 shadow-md ring-1 ring-black/[0.04] transition duration-300 group-hover:shadow-lg group-hover:ring-[#ff7a28]/30">
              <Image
                src={ANTHRACNOSE_BROCHURE.src}
                alt={ANTHRACNOSE_BROCHURE.alt}
                width={ANTHRACNOSE_BROCHURE.width}
                height={ANTHRACNOSE_BROCHURE.height}
                className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 256px, 288px"
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-gray-500 transition group-hover:text-[#e85706]">
              Folleto extraido de la publicacion de Ingenieros Agrónomos Perú
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
