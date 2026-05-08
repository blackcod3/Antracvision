import type { ReactNode } from 'react';

import { CardBody } from '@/components/atoms/CardBody';
import { CardHeading } from '@/components/atoms/CardHeading';
import { IconContainer, type FeatureIconVariant } from '@/components/atoms/IconContainer';

type FeatureCardProps = {
  icon: ReactNode;
  iconVariant: FeatureIconVariant;
  title: string;
  description: string;
};

export function FeatureCard({ icon, iconVariant, title, description }: FeatureCardProps) {
  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-gray-100/90 bg-white p-5 text-left shadow-sm transition duration-300 ease-out will-change-transform hover:-translate-y-[5px] hover:shadow-xl sm:rounded-3xl sm:p-7 md:p-8"
    >
      <IconContainer variant={iconVariant} className="mb-6">
        {icon}
      </IconContainer>
      <CardHeading>{title}</CardHeading>
      <CardBody className="mt-3">{description}</CardBody>
    </article>
  );
}
