import { ExternalLink, PlayCircle } from 'lucide-react';

import { Eyebrow } from '@/components/atoms/Eyebrow';
import { InkHeading } from '@/components/atoms/InkHeading';
import { SubtitleText } from '@/components/atoms/SubtitleText';

const PLANTIX_RESOURCE_URL =
  '';

function getYoutubeEmbedSrc(): string | null {
  const id = process.env.NEXT_PUBLIC_ANTHRAC_EDU_YOUTUBE_ID?.trim();
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}

export function DiseaseEducationVideoSection() {
  const embedSrc = getYoutubeEmbedSrc();

  return (
    <section aria-labelledby="video-educativo" className="mt-16 md:mt-24">
      <header className="mb-8 max-w-3xl sm:mb-10">
        <Eyebrow className="mb-3">Material audiovisual</Eyebrow>
        <InkHeading as="h2" id="video-educativo" className="mb-4">
          Video informativo
        </InkHeading>
        <SubtitleText>
          {embedSrc
            ? 'Recurso audiovisual recomendado sobre antracnosis y manejo en cítricos.'
            : ''}
        </SubtitleText>
      </header>

      {embedSrc ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-black shadow-lg sm:rounded-3xl">
          <div className="relative aspect-video w-full">
            <iframe
              title="Video informativo sobre antracnosis en cítricos"
              src={embedSrc}
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-green-50/80 to-white p-8 shadow-inner sm:rounded-3xl sm:p-12">
          <div className="relative z-[1] mx-auto flex max-w-lg flex-col items-center text-center">
            <PlayCircle className="mb-4 size-14 text-[#ff7a28]" strokeWidth={1.25} aria-hidden />
            <p className="text-base font-semibold text-gray-900 sm:text-lg">
              Añade un video educativo
            </p>
            <a
              href={PLANTIX_RESOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e85706] underline-offset-4 transition hover:text-[#ff5900] hover:underline"
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Artículo de referencia (Plantix)
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
