'use client';

import Link from 'next/link';
import { DetectionHistoryTable, SAMPLE_DETECTIONS, type RecentDetection, } from '@/components/molecules/DetectionHistoryTable';

export type { DetectionStatus, RecentDetection } from '@/components/molecules/DetectionHistoryTable';

type RecentDetectionsPanelProps = {
  detections?: RecentDetection[];
};

export function RecentDetectionsPanel({ detections }: RecentDetectionsPanelProps) {
  const rows = detections?.length ? detections : SAMPLE_DETECTIONS;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-[#fdfcf8] px-5 py-4 sm:px-6">
        <h2 className="font-serif text-xl font-bold tracking-tight text-gray-950 sm:text-[1.35rem]">
          Detecciones recientes
        </h2>
        <p className="text-sm text-gray-500">Últimas {rows.length}</p>
      </div>

      <DetectionHistoryTable detections={rows} />

      <div className="border-t border-gray-100 bg-[#fdfcf8] px-5 py-3.5 text-center sm:px-6">
        <Link
          href="/admin/detect/historial"
          className="text-sm font-medium text-[#3d4a3f] transition-colors hover:text-gray-950"
        >
          Ver historial completo →
        </Link>
      </div>
    </section>
  );
}
