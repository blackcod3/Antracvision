export type DiseasePhaseItem = {
  phase: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};
export const ANTHRACNOSE_PHASES: DiseasePhaseItem[] = [
  {
    phase: 1,
    title: 'Infección incipiente',
    description:
      'Aparecen manchas muy pequeñas o decoloraciones superficiales repartidas sobre la piel del fruto, difíciles de ver sin detenerse a mirar. El tejido aún luce mayormente sano; conviene inspeccionar en buena luz.',
    imageSrc: '/images/antrac376.jpg',
    imageAlt: 'Cítrico con manchas oscuras mínimas y dispersas en la cáscara',
  },
  {
    phase: 2,
    title: 'Lesión localizada',
    description:
      'Una o pocas lesiones se hacen visibles: zona más oscura, a veces ligeramente hundida, con bordes más definidos que las simples motas iniciales. El daño sigue acotado a una región del fruto.',
    imageSrc: '/images/antrac29.jpg',
    imageAlt: 'Fruto con una lesión localizada y manchas asociadas en la cáscara',
  },
  {
    phase: 3,
    title: 'Expansión y coalescencia',
    description:
      'Varias lesiones crecen al mismo tiempo o se unen; se aprecian parches marrones en distintas zonas. La superficie muestra pérdida de uniformidad del color y aumenta la superficie comprometida.',
    imageSrc: '/images/antrac313.jpg',
    imageAlt: 'Fruto con múltiples lesiones marcadas antes de fusionarse por completo',
  },
  {
    phase: 4,
    title: 'Síntomas avanzados',
    description:
      'Lesión profunda y extensa, con área necrótica central y anillo periférico típico de estadios tardíos. El fruto pierde valor comercial y puede desecar o desprenderse antes de tiempo.',
    imageSrc: '/images/antrac45.jpg',
    imageAlt: 'Fruto con lesión muy extensa y hundida en la antracnosis avanzada',
  },
];
