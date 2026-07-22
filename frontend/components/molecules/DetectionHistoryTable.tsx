'use client';

import type { ReactNode } from 'react';
import { Check, Eye, ShieldAlert, X } from 'lucide-react';

export type DetectionStatus = 'Severa' | 'Moderada' | 'Leve' | 'Sana';

export type RecentDetection = {
  id: number;
  code: string;
  label: string;
  origin: string;
  status: DetectionStatus;
  confidence: number;
  date: string;
  image_url?: string | null;
  recomendacion?: string | null;
  estado?: string | null;
};

export const SAMPLE_DETECTIONS: RecentDetection[] = [
  {
    id: 7,
    code: '#DET-0007',
    label: 'Antracnosis',
    origin: 'Imagen subida',
    status: 'Severa',
    confidence: 96,
    date: 'Hoy, 09:41',
  },
  {
    id: 6,
    code: '#DET-0006',
    label: 'Sana',
    origin: 'Cámara',
    status: 'Sana',
    confidence: 88,
    date: 'Hoy, 08:15',
  },
  {
    id: 5,
    code: '#DET-0005',
    label: 'Antracnosis',
    origin: 'Imagen subida',
    status: 'Moderada',
    confidence: 91,
    date: 'Ayer, 17:02',
  },
  {
    id: 4,
    code: '#DET-0004',
    label: 'Antracnosis',
    origin: 'Cámara',
    status: 'Leve',
    confidence: 84,
    date: 'Ayer, 11:47',
  },
  {
    id: 3,
    code: '#DET-0003',
    label: 'Antracnosis',
    origin: 'Imagen subida',
    status: 'Severa',
    confidence: 94,
    date: '18 jul, 14:20',
  },
];

const STATUS_STYLES: Record<DetectionStatus, string> = {
  Severa: 'bg-[#fde8e8] text-[#c62828]',
  Moderada: 'bg-[#ffedd5] text-[#c45c26]',
  Leve: 'bg-[#fef3c7] text-[#a16207]',
  Sana: 'bg-[#dcfce7] text-[#15803d]',
};

function DetectionIcon({ status }: { status: DetectionStatus }) {
  const healthy = status === 'Sana';
  return (
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
        healthy ? 'bg-[#e8f5e9]' : 'bg-[#fde8e8]'
      }`}
      aria-hidden
    >
      {healthy ? (
        <Check className="size-5 text-[#2e7d32]" strokeWidth={2.5} />
      ) : (
        <ShieldAlert className="size-5 text-[#e53935]" strokeWidth={2} />
      )}
    </div>
  );
}

function ConfidenceCell({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex min-w-[7.5rem] items-center gap-2.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e8e4dc] sm:w-20">
        <div
          className="h-full rounded-full bg-[#1b5e3b] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-gray-700">{pct}%</span>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}

type DetectionHistoryTableProps = {
  detections: RecentDetection[];
  onView?: (detection: RecentDetection) => void;
  onDelete?: (detection: RecentDetection) => void;
};

export function DetectionHistoryTable({
  detections,
  onView,
  onDelete,
}: DetectionHistoryTableProps) {
  const showActions = Boolean(onView || onDelete);

  if (!detections.length) {
    return (
      <p className="px-5 py-10 text-center text-sm text-gray-500 sm:px-6">
        No hay detecciones registradas todavía.
      </p>
    );
  }

  const headings = ['Detección', 'Origen', 'Estado', 'Confianza', 'Fecha'];
  if (showActions) headings.push('Acciones');

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-100">
            {headings.map((heading) => (
              <th
                key={heading}
                className={`px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-gray-400 sm:px-6 ${
                  heading === 'Acciones' ? 'text-right' : ''
                }`}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detections.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
              <td className="px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <DetectionIcon status={row.status} />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-950">{row.label}</p>
                    <p className="text-sm text-gray-400">{row.code}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 sm:px-6">{row.origin}</td>
              <td className="px-5 py-4 sm:px-6">
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-5 py-4 sm:px-6">
                <ConfidenceCell value={row.confidence} />
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 sm:px-6">{row.date}</td>
              {showActions ? (
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-end gap-1">
                    {onView ? (
                      <ActionButton
                        label="Ver detalle"
                        onClick={() => onView(row)}
                        className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Eye className="size-4" aria-hidden />
                      </ActionButton>
                    ) : null}
                    {onDelete ? (
                      <ActionButton
                        label="Eliminar"
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="size-4" aria-hidden />
                      </ActionButton>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
