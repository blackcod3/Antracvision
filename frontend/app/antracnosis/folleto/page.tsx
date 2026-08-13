import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

import { ANTHRACNOSE_BROCHURE } from '@/lib/diseasePhaseContent';

export default function AntracnosisBrochurePage() {
  return (
    <div className="min-h-screen bg-page-shell">
      <header className="sticky top-0 z-50 w-full border-b border-gray-900/[0.06] bg-page-shell px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6 lg:px-10 xl:px-14 supports-[backdrop-filter]:bg-page-shell/92">
        <nav className="flex items-center justify-between gap-3 sm:gap-x-4 sm:gap-y-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <img
              src="/images/iconomain.png"
              alt=""
              className="size-10 shrink-0 sm:size-12"
              width={48}
              height={48}
            />
            <span className="truncate text-xl font-bold text-[#264653] sm:text-2xl">AntracVision</span>
          </Link>
          <Link
            href="/antracnosis"
            aria-label="Volver a antracnosis"
            title="Volver"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-gray-700 transition hover:text-green-600 sm:size-auto sm:min-h-11 sm:px-3 sm:text-sm md:text-base"
          >
            <ArrowLeft className="h-6 w-6 shrink-0 sm:mr-2 sm:h-5 sm:w-5" aria-hidden />
            <span className="hidden sm:inline">Volver</span>
          </Link>
        </nav>
      </header>

      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="mx-auto flex max-w-[1024px] flex-col items-center">
          <h1 className="mb-6 text-center text-xl font-bold text-gray-900 sm:mb-8 sm:text-2xl">
            {ANTHRACNOSE_BROCHURE.title}
          </h1>
          <Image
            src={ANTHRACNOSE_BROCHURE.src}
            alt={ANTHRACNOSE_BROCHURE.alt}
            width={ANTHRACNOSE_BROCHURE.width}
            height={ANTHRACNOSE_BROCHURE.height}
            className="h-auto w-full max-w-[1024px] rounded-lg shadow-lg"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
        </div>
      </main>
    </div>
  );
}
