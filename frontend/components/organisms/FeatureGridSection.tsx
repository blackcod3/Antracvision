import { ArrowUpRight, Sprout, Target, Zap } from 'lucide-react';

import { FeatureCard } from '@/components/molecules/FeatureCard';

export function FeatureGridSection() {
  return (
    <section id="features" className="py-12 sm:py-16 md:py-20">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:mb-14 sm:text-3xl md:text-4xl">
          ¿Por qué AntracVision?
        </h2>
        <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          <FeatureCard
            icon={<Zap className="size-7 text-amber-400" strokeWidth={2.25} aria-hidden />}
            iconVariant="orange"
            title="Detección Rápida"
            description="Sube una imagen del fruto y obtén el diagnóstico en segundos. Sin esperas, sin formularios complicados."
          />
          <FeatureCard
            icon={
              <span className="relative inline-flex size-7 items-center justify-center" aria-hidden>
                <Target className="size-7 text-red-500" strokeWidth={2} />
                <ArrowUpRight
                  className="absolute size-3.5 text-sky-600"
                  strokeWidth={2.75}
                />
              </span>
            }
            iconVariant="mint"
            title="Alta Precisión"
            description="Modelo entrenado con imágenes reales de huertos de naranja en San Martín, optimizado para condiciones locales."
          />
          <FeatureCard
            icon={<Sprout className="size-7 text-emerald-600" strokeWidth={2} aria-hidden />}
            iconVariant="mint"
            title="Fácil de Usar"
            description="Interfaz intuitiva diseñada para el agricultor. Solo necesitas tu teléfono y una foto del fruto afectado."
          />
        </div>
      </div>
    </section>
  );
}
