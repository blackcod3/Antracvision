'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Check,
  CircleDot,
  Download,
  FileSpreadsheet,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type ReportRow = {
  id: number;
  code: string;
  label: string;
  origin: string;
  status: string;
  confidence: number;
  date: string;
  recomendacion?: string | null;
  operator: string;
};

type ReportSummary = {
  total: number;
  healthy: number;
  anthracnose: number;
  severity: {
    leve: number;
    moderada: number;
    severa: number;
  };
  avg_confidence: number;
};

type Filters = {
  date_from: string;
  date_to: string;
  clase: string;
  status: string;
};

const EMPTY_SUMMARY: ReportSummary = {
  total: 0,
  healthy: 0,
  anthracnose: 0,
  severity: { leve: 0, moderada: 0, severa: 0 },
  avg_confidence: 0,
};

const STATUS_STYLES: Record<string, string> = {
  crítico: 'bg-[#fde8e8] text-[#c62828]',
  moderado: 'bg-[#ffedd5] text-[#c45c26]',
  leve: 'bg-[#fef3c7] text-[#a16207]',
  saludable: 'bg-[#dcfce7] text-[#15803d]',
};

function detailMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  return fallback;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.clase) params.set('clase', filters.clase);
  if (filters.status) params.set('status', filters.status);
  return params.toString();
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<Filters>({
    date_from: '',
    date_to: '',
    clase: '',
    status: '',
  });
  const [applied, setApplied] = useState<Filters>({
    date_from: '',
    date_to: '',
    clase: '',
    status: '',
  });
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(EMPTY_SUMMARY);
  const [totalMatching, setTotalMatching] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryString = useMemo(() => buildQuery(applied), [applied]);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const qs = queryString ? `?${queryString}&limit=500` : '?limit=500';
      const response = await fetch(`${API_BASE}/api/admin/reports${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo cargar el reporte'));
      }
      const data = await response.json();
      setSummary({
        total: data.summary?.total ?? 0,
        healthy: data.summary?.healthy ?? 0,
        anthracnose: data.summary?.anthracnose ?? 0,
        severity: {
          leve: data.summary?.severity?.leve ?? 0,
          moderada: data.summary?.severity?.moderada ?? 0,
          severa: data.summary?.severity?.severa ?? 0,
        },
        avg_confidence: data.summary?.avg_confidence ?? 0,
      });
      setRows(Array.isArray(data.detections) ? data.detections : []);
      setTotalMatching(data.total_matching ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
      setRows([]);
      setSummary(EMPTY_SUMMARY);
      setTotalMatching(0);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    setSuccess('');
    setApplied({ ...filters });
  };

  const clearFilters = () => {
    const empty = { date_from: '', date_to: '', clase: '', status: '' };
    setFilters(empty);
    setApplied(empty);
    setSuccess('');
  };

  const handleExport = async () => {
    const token = getAdminToken();
    if (!token) return;

    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const qs = queryString ? `?${queryString}` : '';
      const response = await fetch(`${API_BASE}/api/admin/reports/export${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo exportar el Excel'));
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || `reporte_detecciones_${Date.now()}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess(`Excel descargado (${totalMatching} registros).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#0f291e] focus:ring-2 focus:ring-[#0f291e]/20';

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            Reportes
          </h1>
          <p className="text-pretty text-sm text-gray-600 sm:text-base">
            Consulta y exporta el historial de detecciones filtrado por período y clase
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f291e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143d2f] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {exporting ? (
            <RefreshCw className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          {exporting ? 'Exportando…' : 'Exportar Excel'}
        </button>
      </div>

      {error ? (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <section className="mb-6 rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-[#0f291e]" aria-hidden />
          <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm text-gray-600">
            Desde
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block text-sm text-gray-600">
            Hasta
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block text-sm text-gray-600">
            Clase
            <select
              value={filters.clase}
              onChange={(e) => setFilters((prev) => ({ ...prev, clase: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="">Todas</option>
              <option value="Sana">Sana</option>
              <option value="Antracnosis">Antracnosis</option>
            </select>
          </label>
          <label className="block text-sm text-gray-600">
            Estado
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="">Todos</option>
              <option value="saludable">Saludable</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="crítico">Crítico</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-[#0f291e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143d2f]"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="size-4" aria-hidden />
            Actualizar
          </button>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <article className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#dbeafe]">
            <Activity className="size-5 text-[#2563eb]" aria-hidden />
          </div>
          <p className="text-sm text-gray-500">Total filtrado</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">{summary.total}</p>
        </article>
        <article className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#dcfce7]">
            <Check className="size-5 text-[#16a34a]" aria-hidden />
          </div>
          <p className="text-sm text-gray-500">Naranjas sanas</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">{summary.healthy}</p>
        </article>
        <article className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#fee2e2]">
            <CircleDot className="size-5 text-[#dc2626]" aria-hidden />
          </div>
          <p className="text-sm text-gray-500">Con antracnosis</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
            {summary.anthracnose}
          </p>
        </article>
        <article className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#ffedd5]">
            <Gauge className="size-5 text-[#d97706]" aria-hidden />
          </div>
          <p className="text-sm text-gray-500">Confianza promedio</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-gray-950">
            {Math.round(summary.avg_confidence)}%
          </p>
        </article>
      </div>

      <section className="overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-[#fdfcf8] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Vista previa</h2>
            <p className="text-sm text-gray-500">
              {loading
                ? 'Cargando…'
                : `${rows.length} de ${totalMatching} registros · el Excel incluye todos los filtrados`}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Severidad: {summary.severity.leve} leve · {summary.severity.moderada} moderada ·{' '}
            {summary.severity.severa} severa
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-white text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium sm:px-6">Código</th>
                <th className="px-5 py-3 font-medium sm:px-6">Fecha</th>
                <th className="px-5 py-3 font-medium sm:px-6">Clase</th>
                <th className="px-5 py-3 font-medium sm:px-6">Estado</th>
                <th className="px-5 py-3 font-medium sm:px-6">Confianza</th>
                <th className="px-5 py-3 font-medium sm:px-6">Origen</th>
                <th className="px-5 py-3 font-medium sm:px-6">Operador</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500 sm:px-6">
                    Cargando reporte…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500 sm:px-6">
                    No hay detecciones con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-gray-900 sm:px-6">{row.code}</td>
                    <td className="px-5 py-3.5 text-gray-600 sm:px-6">{row.date}</td>
                    <td className="px-5 py-3.5 text-gray-900 sm:px-6">{row.label}</td>
                    <td className="px-5 py-3.5 sm:px-6">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize ${
                          STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-gray-900 sm:px-6">
                      {row.confidence}%
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 sm:px-6">{row.origin}</td>
                    <td className="px-5 py-3.5 text-gray-600 sm:px-6">{row.operator}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
