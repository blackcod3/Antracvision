'use client';

import { useEffect, useState } from 'react';
import {
  DetectionHistoryTable,
  SAMPLE_DETECTIONS,
  type RecentDetection,
} from '@/components/molecules/DetectionHistoryTable';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

export default function DetectionHistoryPage() {
  const [detections, setDetections] = useState<RecentDetection[]>(SAMPLE_DETECTIONS);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/detections?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data.detections) && data.detections.length) {
          setDetections(data.detections);
        }
      } catch {
        // Keep sample fallback when the API is unavailable
      }
    };

    void load();
  }, []);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Historial de detecciones
        </h1>
        <p className="text-pretty text-sm text-gray-600 sm:text-base">
          Registro completo de análisis realizados por el sistema
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-[#fdfcf8] px-5 py-4 sm:px-6">
          <p className="text-sm text-gray-500">{detections.length} registros</p>
        </div>

        <DetectionHistoryTable detections={detections} />
      </section>
    </>
  );
}
