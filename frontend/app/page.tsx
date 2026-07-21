import Link from 'next/link';
import { CircleUser } from 'lucide-react';

import { ScrollToSectionButton } from '@/components/atoms/ScrollToSectionButton';
import { DiseaseInfoSection } from '@/components/organisms/DiseaseInfoSection';
import { FeatureGridSection } from '@/components/organisms/FeatureGridSection';
import { ProcessSection } from '@/components/organisms/ProcessSection';
import { ProtectionCtaSection } from '@/components/organisms/ProtectionCtaSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-page-shell">
      {/* Cabecera: permanece visible al hacer scroll */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-900/[0.06] bg-page-shell px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6 lg:px-10 xl:px-14 supports-[backdrop-filter]:bg-page-shell/92">
        <nav className="flex items-center justify-between gap-3 sm:gap-x-4 sm:gap-y-3">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/images/iconomain.png"
              alt=""
              className="size-10 shrink-0 sm:size-12"
              width={48}
              height={48}
            />
            <span className="truncate text-xl font-bold text-[#264653] sm:text-2xl">
              AntracVision
            </span>
          </div>
          <div className="flex shrink-0 flex-row items-center gap-2 sm:gap-3">
            <Link
              href="/detect"
              className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-gray-700 transition hover:text-green-600 active:text-green-700 sm:min-h-[44px] sm:px-4 sm:text-base"
            >
              Detección
            </Link>
            <Link
              href="/login"
              aria-label="Iniciar sesión como administrador"
              title="Admin"
              className="inline-flex size-11 items-center justify-center rounded-lg bg-[#ff7a28] text-white transition hover:bg-[#f06010] active:bg-[#e05508] sm:size-auto sm:min-h-[44px] sm:px-6 sm:py-2.5 sm:text-base"
            >
              <CircleUser className="size-[22px] shrink-0 sm:hidden" aria-hidden />
              <span className="hidden text-sm font-semibold sm:inline">Admin</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="w-full px-4 py-12 text-center sm:px-6 sm:py-16 md:py-20 lg:px-10 xl:px-14">
        <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:mb-6 md:text-5xl lg:text-6xl">
          Detección Automática de Antracnosis en Naranjas
          <span className="mt-1 block text-[#ff731a] md:mt-2">usando Deep Learning</span>
        </h1>
        <p className="mx-auto mb-8 max-w-5xl text-pretty text-base text-gray-600 sm:text-lg md:text-xl">
          Sistema de información que permite identificar antracnosis en frutos de naranja mediante
          modelos de aprendizaje profundo entrenados con imágenes reales de cultivos en la región San
          Martín.
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/detect"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#ff731a] px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-[#ff5900] active:bg-[#e34e00] md:text-lg"
          >
            Probar Ahora
          </Link>
          <ScrollToSectionButton
            targetId="features"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#ff731a] px-8 py-3.5 text-base font-semibold text-[#e85706] transition hover:bg-[#ffd4b8]/80 active:bg-[#ffd4b8] md:text-lg"
          >
            Conocer Más
          </ScrollToSectionButton>
        </div>
      </section>

      <FeatureGridSection />

      <DiseaseInfoSection />

      <ProcessSection />

      <ProtectionCtaSection />

      {/* Footer: móvil compacto · sm+ marca izq · copyright der */}
      <footer className="bg-[#081008] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 xl:px-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center sm:max-w-none sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-left">
          <div className="flex w-full min-w-0 flex-col items-center sm:items-start">
            <div className="flex items-center justify-center gap-2 sm:justify-start sm:gap-3">
              <img
                src="/images/iconomain.png"
                alt=""
                className="size-9 shrink-0 sm:size-12"
                width={48}
                height={48}
              />
              <span className="text-lg font-bold tracking-tight text-white sm:text-2xl">
                AntracVision
              </span>
            </div>
            <p className="mx-auto mt-1.5 max-w-xs text-pretty text-xs leading-snug text-[#667766] sm:mx-0 sm:mt-3 sm:max-w-xl sm:text-[15px] sm:leading-relaxed">
              Sistema de detección automática de antracnosis con IA
            </p>
          </div>
          <p className="w-full shrink-0 text-pretty text-xs leading-snug text-[#667766] sm:w-auto sm:max-w-none sm:text-sm sm:leading-relaxed sm:text-[15px] sm:text-right">
            <span className="sm:hidden">© 2026 AntracVision</span>
            <span className="hidden sm:inline">
              © 2026 AntracVision. Todos los derechos reservados.
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
