'use client';

import Link from 'next/link';
import { DetectionWorkspace } from '@/components/organisms/DetectionWorkspace';

export default function AdminDetectPage() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            Nueva detección
          </h1>
          <p className="text-pretty text-sm text-gray-600 sm:text-base">
            Prueba el modelo desde el panel de administración. El resultado queda en el historial.
          </p>
        </div>
        <Link
          href="/admin/detect/historial"
          className="text-sm font-medium text-[#0f291e] underline-offset-4 hover:underline"
        >
          Ver historial →
        </Link>
      </div>

      <div className="mx-auto max-w-3xl">
        <DetectionWorkspace variant="admin" />
      </div>
    </>
  );
}
