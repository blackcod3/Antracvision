import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { DiseaseEducationVideoSection } from '@/components/organisms/DiseaseEducationVideoSection';
import { DiseasePhasesSection } from '@/components/organisms/DiseasePhasesSection';
import { ProcessIntro } from '@/components/molecules/ProcessIntro';

export default function AntracnosisPage() {
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
          <div className="flex shrink-0 flex-row items-center gap-2 sm:gap-3">
            <Link
              href="/detect"
              className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-gray-700 transition hover:text-green-600 active:text-green-700 sm:min-h-[44px] sm:px-4 sm:text-base"
            >
              Detección
            </Link>
            <Link
              href="/"
              aria-label="Regresar a la página principal"
              title="Inicio"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-gray-700 transition hover:text-green-600 sm:size-auto sm:min-h-11 sm:px-3 sm:text-sm md:text-base"
            >
              <ArrowLeft className="h-6 w-6 shrink-0 sm:mr-2 sm:h-5 sm:w-5" aria-hidden />
              <span className="hidden sm:inline">Volver al inicio</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="w-full px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10 xl:px-14">
        <div className="mx-auto max-w-6xl">
          <ProcessIntro
            eyebrow="Ampliación"
            title="Evolución de la antracnosis en el cultivo"
            subtitle="Aquí encontrarás una guía paso a paso con imágenes representativas y un espacio para material audiovisual que complemente lo ya visto en la sección Conoce la enfermedad."
          />

          <DiseasePhasesSection />

          <DiseaseEducationVideoSection />

          <p className="mt-14 text-center text-sm text-gray-500 sm:mt-16">
            ¿Listo para probar el modelo?{' '}
            <Link href="/detect" className="font-semibold text-[#e85706] underline-offset-4 hover:underline">
              Ir a detección
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-200/80 bg-page-shell px-4 py-6 text-center text-xs text-gray-500 sm:px-6">
        © {new Date().getFullYear()} AntracVision · Información educativa
      </footer>
    </div>
  );
}
