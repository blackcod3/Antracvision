type PhaseBadgeProps = {
  phase: number;
  className?: string;
};

export function PhaseBadge({ phase, className = '' }: PhaseBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#ff7a28]/15 px-3 py-1 text-xs font-semibold tracking-wide text-[#e85706] ${className}`}
    >
      Fase {phase}
    </span>
  );
}
