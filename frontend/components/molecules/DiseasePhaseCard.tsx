import Image from 'next/image';

import { PhaseBadge } from '@/components/atoms/PhaseBadge';
import { CardBody } from '@/components/atoms/CardBody';
import { CardHeading } from '@/components/atoms/CardHeading';

import type { DiseasePhaseItem } from '@/lib/diseasePhaseContent';

type DiseasePhaseCardProps = {
  item: DiseasePhaseItem;
  isLast?: boolean;
};

export function DiseasePhaseCard({ item, isLast = false }: DiseasePhaseCardProps) {
  return (
    <article className="relative flex gap-4 sm:gap-6 md:gap-8">
      {/* Timeline: punto + línea (desktop) */}
      <div className="hidden shrink-0 flex-col items-center pt-2 sm:flex sm:w-10 md:w-12" aria-hidden>
        <div className="size-3 shrink-0 rounded-full bg-[#ff7a28] shadow-[0_0_0_4px_rgba(255,122,40,0.2)] md:size-3.5" />
        {!isLast ? (
          <div className="mt-3 w-px flex-1 min-h-[2rem] bg-gradient-to-b from-[#ffca8f] via-[#ff7a28]/35 to-gray-200" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm transition duration-300 ease-out hover:border-[#ff7a28]/25 hover:shadow-md sm:flex-row sm:items-stretch sm:gap-5 sm:rounded-3xl sm:p-5">
          <div className="relative mx-auto size-[7.75rem] max-w-full shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:mx-0 sm:size-28 md:size-[8.25rem]">
            <Image
              src={item.imageSrc}
              alt={item.imageAlt}
              fill
              className="object-cover object-center"
              sizes="128px"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 md:gap-3">
            <PhaseBadge phase={item.phase} />
            <CardHeading className="!text-[1.05rem] leading-snug sm:!text-xl">{item.title}</CardHeading>
            <CardBody className="!mt-0 !text-[13px] leading-relaxed text-gray-600 sm:!text-[15px]">
              {item.description}
            </CardBody>
          </div>
        </div>

        {!isLast ? (
          <div className="flex justify-center py-4 sm:hidden" aria-hidden>
            <div className="h-6 w-px bg-gradient-to-b from-[#ff7a28]/45 to-gray-200" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
