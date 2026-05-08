import {
  SymptomInfoCard,
  type SymptomIconVariant,
} from '@/components/molecules/SymptomInfoCard';
import { SectionHeader } from '@/components/molecules/SectionHeader';

const SYMPTOM_CARDS: Array<{
  icon: SymptomIconVariant;
  title: string;
  description: string;
}> = [
  {
    icon: 'dot-orange',
    title: 'Lesiones hundidas',
    description:
      'Zonas deprimidas en la cáscara que se expanden y pueden afectar gran parte del fruto.',
  },
  {
    icon: 'dot-gray',
    title: 'Manchas oscuras',
    description:
      'Aparición de manchas de color marrón a negro con bordes irregulares sobre la superficie.',
  },
  {
    icon: 'droplet',
    title: 'Exudado gomoso',
    description:
      'Secreción de sustancias gomosas en zonas afectadas, especialmente en condiciones húmedas.',
  },
  {
    icon: 'leaf',
    title: 'Caída prematura',
    description:
      'Frutos afectados pueden caer antes de madurar, reduciendo el rendimiento del cultivo.',
  },
];

export function DiseaseInfoSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0f1712] px-4 py-8 shadow-xl sm:rounded-3xl sm:px-6 sm:py-10 md:px-10 md:py-14">
          <div className="flex flex-col gap-10 lg:gap-12">
            <SectionHeader
              eyebrow="Conoce la enfermedad"
              title="¿Qué es la Antracnosis?"
              description={
                <>
                  Causada por el hongo{' '}
                  <em className="text-zinc-300">Colletotrichum gloeosporioides</em>
                  , afecta hojas, flores y frutos de naranja provocando pérdidas significativas si no
                  se detecta a tiempo.
                </>
              }
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SYMPTOM_CARDS.map((card) => (
                <SymptomInfoCard
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
