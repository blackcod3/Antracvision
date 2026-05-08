type StepCircleVariant = 'outline' | 'filled';

type StepCircleProps = {
  step: number;
  variant?: StepCircleVariant;
  className?: string;
};

export function StepCircle({ step, variant = 'outline', className = '' }: StepCircleProps) {
  const base =
    'relative z-[1] flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors';

  if (variant === 'filled') {
    return (
      <span
        className={`${base} border-2 border-[#ff7a28] bg-[#ff7a28] text-white ${className}`}
        aria-label={`Paso ${step}`}
      >
        {step}
      </span>
    );
  }

  return (
    <span
      className={`${base} border-2 border-[#ff7a28] bg-white text-[#ff7a28] ${className}`}
      aria-label={`Paso ${step}`}
    >
      {step}
    </span>
  );
}
