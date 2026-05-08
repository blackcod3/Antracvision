import { ProcessIntro } from '@/components/molecules/ProcessIntro';
import { ProcessStepItem } from '@/components/molecules/ProcessStepItem';

const STEPS = [
  {
    step: 1 as const,
    circleVariant: 'outline' as const,
    title: 'Sube la imagen',
    description: 'Toma una foto clara del fruto y súbela a la plataforma',
  },
  {
    step: 2 as const,
    circleVariant: 'filled' as const,
    title: 'Análisis con IA',
    description:
      'El modelo de deep learning procesa la imagen automáticamente',
  },
  {
    step: 3 as const,
    circleVariant: 'outline' as const,
    title: 'Recibe resultado',
    description:
      'Obtén el diagnóstico con nivel de confianza en segundos',
  },
];

export function ProcessSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        <ProcessIntro
          eyebrow="Proceso"
          title="¿Cómo funciona?"
          subtitle="Tres pasos simples para obtener un diagnóstico confiable de tus naranjas."
        />

        <div className="relative">
          {/* Línea discontinua entre el centro del paso 1 y el centro del paso 3 */}
          <div
            className="pointer-events-none absolute left-[8%] right-[8%] top-[1.75rem] z-0 hidden border-t-2 border-dashed border-[#f59040] md:block lg:left-[14%] lg:right-[14%]"
            aria-hidden
          />

          <ol className="relative z-[1] m-0 grid list-none gap-12 p-0 md:grid-cols-3 md:gap-6 md:items-start lg:gap-10">
            {STEPS.map((item) => (
              <li key={item.step}>
                <ProcessStepItem
                  step={item.step}
                  circleVariant={item.circleVariant}
                  title={item.title}
                  description={item.description}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
