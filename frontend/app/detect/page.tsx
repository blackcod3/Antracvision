'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DetectionWorkspace } from '@/components/organisms/DetectionWorkspace';

export default function DetectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="sticky top-0 z-50 w-full border-b border-gray-900/[0.06] bg-green-50/92 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-green-50/85">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <nav className="flex items-center justify-between gap-3 md:gap-4">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <img
                src="/images/iconomain.png"
                alt=""
                className="h-11 w-11 shrink-0 md:h-12 md:w-12"
                width={48}
                height={48}
              />
              <span className="truncate text-xl font-bold text-[#264653] md:text-2xl">
                AntracVision
              </span>
            </Link>
            <Link
              href="/"
              aria-label="Volver al Inicio"
              title="Volver al Inicio"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-gray-700 transition hover:text-green-600 sm:size-auto sm:min-h-11 sm:justify-start sm:py-1 sm:pr-2 sm:text-sm md:text-base"
            >
              <ArrowLeft className="h-6 w-6 shrink-0 sm:mr-2 sm:h-5 sm:w-5" aria-hidden />
              <span className="hidden sm:inline">Volver al Inicio</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto overflow-x-clip px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-3 text-center text-2xl font-bold text-balance text-gray-900 md:mb-4 md:text-4xl">
            Detección de Antracnosis
          </h1>
          <p className="mb-8 text-center text-base text-pretty text-gray-600 md:text-lg">
            Sube una imagen del fruto de la naranja, recórtala si lo necesitas y detecta antracnosis
          </p>
          <DetectionWorkspace variant="public" />
        </div>
      </main>
    </div>
  );
}
