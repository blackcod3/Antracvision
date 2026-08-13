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
      'Aparecen pequeñas manchas o decoloraciones superficiales sobre la epidermis del fruto, generalmente poco visibles. El tejido conserva mayormente su apariencia normal y las lesiones pueden ser difíciles de identificar mediante inspección visual.',
    imageSrc: '/images/fase1.webp',
    imageAlt: 'Cítrico con manchas oscuras mínimas y dispersas en la cáscara',
  },
  {
    phase: 2,
    title: 'Lesión localizada',
    description:
      'Se observa una o pocas lesiones claramente visibles, generalmente de coloración marrón o marrón oscura, que pueden presentar un ligero hundimiento y bordes más definidos. El daño permanece limitado a una zona determinada del fruto.',
    imageSrc: '/images/fase2.webp',
    imageAlt: 'Fruto con una lesión localizada y manchas asociadas en la cáscara',
  },
  {
    phase: 3,
    title: 'Expansión y coalescencia',
    description:
      'Las lesiones aumentan progresivamente de tamaño y pueden unirse entre sí, formando áreas o parches de coloración marrón oscura. Se incrementa la superficie afectada y el fruto presenta una mayor pérdida de uniformidad en su apariencia.',
    imageSrc: '/images/fase3.webp',
    imageAlt: 'Fruto con múltiples lesiones marcadas antes de fusionarse por completo',
  },
  {
    phase: 4,
    title: 'Síntomas avanzados',
    description:
      'Se presentan lesiones extensas y necróticas, que pueden profundizarse y comprometer una parte considerable de la superficie del fruto. En condiciones favorables pueden observarse estructuras asociadas al desarrollo del patógeno y el fruto puede presentar deterioro severo, pérdida de calidad comercial y, eventualmente, desprendimiento prematuro.',
    imageSrc: '/images/fase4.webp',
    imageAlt: 'Fruto con lesión muy extensa y hundida en la antracnosis avanzada',
  },
];

export const ANTHRACNOSE_BROCHURE = {
  src: '/images/folleto-antracnosis.webp',
  href: '/antracnosis/folleto',
  width: 1024,
  height: 1536,
  alt: 'Folleto informativo sobre antracnosis en cítricos',
  title: 'Folleto de antracnosis en cítricos',
};
