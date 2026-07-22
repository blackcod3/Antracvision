'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  DetectionHistoryTable,
  SAMPLE_DETECTIONS,
  type RecentDetection,
} from '@/components/molecules/DetectionHistoryTable';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

function detailMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  return fallback;
}

function imageSrc(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detection-modal-title"
        className={`relative z-10 w-full rounded-xl bg-white shadow-xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="detection-modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeDetection(raw: Record<string, unknown>): RecentDetection | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const status = raw.status;
  if (
    status !== 'Severa' &&
    status !== 'Moderada' &&
    status !== 'Leve' &&
    status !== 'Sana'
  ) {
    return null;
  }

  return {
    id,
    code: typeof raw.code === 'string' ? raw.code : `#DET-${String(id).padStart(4, '0')}`,
    label: typeof raw.label === 'string' ? raw.label : 'Detección',
    origin: typeof raw.origin === 'string' ? raw.origin : 'Imagen subida',
    status,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0,
    date: typeof raw.date === 'string' ? raw.date : '',
    image_url: typeof raw.image_url === 'string' ? raw.image_url : null,
    recomendacion: typeof raw.recomendacion === 'string' ? raw.recomendacion : null,
    estado: typeof raw.estado === 'string' ? raw.estado : null,
  };
}

export default function DetectionHistoryPage() {
  const [detections, setDetections] = useState<RecentDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detail, setDetail] = useState<RecentDetection | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecentDetection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/detections?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo cargar el historial'));
      }
      const data = await response.json();
      const rows = Array.isArray(data.detections)
        ? data.detections
            .map((item: Record<string, unknown>) => normalizeDetection(item))
            .filter((item: RecentDetection | null): item is RecentDetection => item !== null)
        : [];
      setDetections(rows.length ? rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      setDetections(SAMPLE_DETECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async () => {
    const token = getAdminToken();
    if (!token || !pendingDelete) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/detections/${pendingDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo eliminar la detección'));
      }
      setPendingDelete(null);
      setSuccess('Detección eliminada del historial.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const photo = imageSrc(detail?.image_url);

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

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {success}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-[#fdfcf8] px-5 py-4 sm:px-6">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando…' : `${detections.length} registros`}
          </p>
        </div>

        <DetectionHistoryTable
          detections={detections}
          onView={(row) => setDetail(row)}
          onDelete={(row) => setPendingDelete(row)}
        />
      </section>

      {detail ? (
        <ModalShell title="Detalle de detección" onClose={() => setDetail(null)} wide>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-xl bg-gray-50">
              {photo ? (
                <img
                  src={photo}
                  alt={`Imagen de ${detail.code}`}
                  className="aspect-square w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center px-4 text-center text-sm text-gray-500">
                  No hay imagen guardada para este registro
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Código</p>
                <p className="text-sm font-medium text-gray-900">{detail.code}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Detección</p>
                <p className="text-sm font-medium text-gray-900">{detail.label}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Estado</p>
                <p className="text-sm text-gray-900">{detail.status}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Confianza</p>
                <p className="text-sm text-gray-900">{detail.confidence}%</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Origen</p>
                <p className="text-sm text-gray-900">{detail.origin}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fecha</p>
                <p className="text-sm text-gray-900">{detail.date}</p>
              </div>
              {detail.recomendacion ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Recomendación
                  </p>
                  <p className="text-sm text-gray-700">{detail.recomendacion}</p>
                </div>
              ) : null}
            </div>
          </div>
        </ModalShell>
      ) : null}

      {pendingDelete ? (
        <ModalShell
          title="¿Estás seguro?"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-gray-300"
              >
                {deleting ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            Vas a ocultar la detección{' '}
            <span className="font-semibold text-gray-900">{pendingDelete.code}</span> del historial.
            El registro se desactiva y dejará de mostrarse.
          </p>
        </ModalShell>
      ) : null}
    </>
  );
}
