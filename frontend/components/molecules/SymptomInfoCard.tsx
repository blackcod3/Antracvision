import { CardSurface } from '@/components/atoms/CardSurface';
import { Droplet, Leaf } from 'lucide-react';

export type SymptomIconVariant = 'dot-orange' | 'dot-gray' | 'droplet' | 'leaf';

type SymptomInfoCardProps = {
  icon: SymptomIconVariant;
  title: string;
  description: string;
};

function SymptomIcon({ variant }: { variant: SymptomIconVariant }) {
  if (variant === 'dot-orange') {
    return <span className="inline-block size-3 shrink-0 rounded-full bg-[#ff7a28]" aria-hidden />;
  }
  if (variant === 'dot-gray') {
    return <span className="inline-block size-3 shrink-0 rounded-full bg-zinc-500" aria-hidden />;
  }
  if (variant === 'droplet') {
    return <Droplet className="size-5 shrink-0 text-sky-400" strokeWidth={2} aria-hidden />;
  }
  return <Leaf className="size-5 shrink-0 text-[#ff7a28]" strokeWidth={2} aria-hidden />;
}

export function SymptomInfoCard({ icon, title, description }: SymptomInfoCardProps) {
  return (
    <CardSurface className="h-full flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex items-center justify-center">
          <SymptomIcon variant={icon} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[#ff731a] font-semibold text-lg leading-snug">{title}</h3>
          <p className="mt-2 text-zinc-400 text-sm md:text-[15px] leading-relaxed">{description}</p>
        </div>
      </div>
    </CardSurface>
  );
}
