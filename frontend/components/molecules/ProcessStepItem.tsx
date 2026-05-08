import { StepCircle } from '@/components/atoms/StepCircle';

type ProcessStepItemProps = {
  step: number;
  circleVariant: 'outline' | 'filled';
  title: string;
  description: string;
};

export function ProcessStepItem({
  step,
  circleVariant,
  title,
  description,
}: ProcessStepItemProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <StepCircle step={step} variant={circleVariant} />
      <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 w-full max-w-none text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );
}
