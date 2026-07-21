'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Activity, AlertCircle, CheckCircle, Cpu, Database, RefreshCw, Server, } from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type StatusTone = 'operational' | 'degraded' | 'disconnected' | 'configured' | 'error';

type SystemStatus = {
  overall: {
    status: StatusTone;
    label: string;
    checked_at: string;
  };
  api: {
    status: StatusTone;
    label: string;
    name: string;
    version: string;
    framework: string;
    uptime_seconds: number;
    frontend_url: string;
    cors: string;
    auth: string;
    token_expire_minutes: number;
    endpoints: Array<{ method: string; path: string; description: string }>;
    runtime: {
      python: string;
      system: string;
      machine: string;
    };
  };
  model: {
    status: StatusTone;
    label: string;
    name: string;
    file: string;
    path: string;
    exists: boolean;
    loaded: boolean;
    size: string | null;
    task: string;
    device: string;
    input_size: string;
    classes: string[];
    framework: string;
    detail: string;
  };
  database: {
    status: StatusTone;
    label: string;
    connected: boolean;
    engine: string | null;
    host: string | null;
    database: string | null;
    url_masked?: string;
    detail: string;
    storage_mode: string;
  };
};

function toneClasses(status: StatusTone) {
  switch (status) {
    case 'operational':
      return {
        badge: 'bg-green-100 text-green-800',
        dot: 'bg-green-500',
        panel: 'bg-green-50 border-green-100',
        text: 'text-green-700',
      };
    case 'degraded':
    case 'configured':
      return {
        badge: 'bg-amber-100 text-amber-900',
        dot: 'bg-amber-500',
        panel: 'bg-amber-50 border-amber-100',
        text: 'text-amber-800',
      };
    case 'disconnected':
      return {
        badge: 'bg-blue-100 text-blue-800',
        dot: 'bg-blue-500',
        panel: 'bg-blue-50 border-blue-100',
        text: 'text-blue-700',
      };
    default:
      return {
        badge: 'bg-red-100 text-red-800',
        dot: 'bg-red-500',
        panel: 'bg-red-50 border-red-100',
        text: 'text-red-700',
      };
  }
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="min-w-0 break-all text-sm font-medium text-gray-900 sm:text-right">{value}</dd>
    </div>
  );
}

function SettingsContent() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const loadStatus = useCallback(async (isRefresh = false) => {
    const token = getAdminToken();
    if (!token) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const started = performance.now();
      const response = await fetch(`${API_BASE}/api/admin/system-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLatencyMs(Math.round(performance.now() - started));

      if (!response.ok) {
        throw new Error('No se pudo obtener el estado del sistema');
      }

      const data = (await response.json()) as SystemStatus;
      setStatus(data);
    } catch {
      setError('Error al consultar el estado del sistema. Verifica que el backend esté en ejecución.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="text-sm text-gray-600">Consultando estado del sistema…</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{error || 'Sin datos'}</p>
            <button
              type="button"
              onClick={() => void loadStatus(true)}
              className="mt-3 text-sm font-semibold text-red-700 underline-offset-2 hover:underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallTone = toneClasses(status.overall.status);
  const apiTone = toneClasses(status.api.status);
  const modelTone = toneClasses(status.model.status);
  const dbTone = toneClasses(status.database.status);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            Configuración
          </h1>
          <p className="text-pretty text-sm text-gray-600 sm:text-base">
            Estado detallado del sistema: API, modelo de detección y base de datos
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus(true)}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1a2f26] px-4 text-sm font-medium text-white transition hover:bg-[#243d32] disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar
        </button>
      </div>

      <div className={`mb-6 rounded-xl border p-5 ${overallTone.panel}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-3 shrink-0 rounded-full ${overallTone.dot}`} />
            <div>
              <p className="text-sm text-gray-600">Estado general</p>
              <p className={`text-lg font-bold ${overallTone.text}`}>{status.overall.label}</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 sm:text-right">
            <p>
              Última verificación:{' '}
              <span className="font-medium text-gray-900">
                {new Date(status.overall.checked_at).toLocaleString('es-PE')}
              </span>
            </p>
            {latencyMs !== null ? (
              <p className="mt-0.5">
                Latencia de consulta: <span className="font-medium text-gray-900">{latencyMs} ms</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { title: 'API Backend', icon: Server, status: status.api.label, tone: apiTone, sectionId: 'api' },
          { title: 'Modelo YOLOv8', icon: Cpu, status: status.model.label, tone: modelTone, sectionId: 'model' },
          { title: 'Base de datos', icon: Database, status: status.database.label, tone: dbTone, sectionId: 'database' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                document
                  .getElementById(item.sectionId)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#1a2f26]/25 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2f26]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-full bg-[#1a2f26]/10">
                  <Icon className="size-5 text-[#1a2f26]" />
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.tone.badge}`}>
                  {item.status}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-xs text-gray-500">Ver detalle →</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* API */}
        <section
          id="api"
          className="scroll-mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <Server className="size-5 text-[#1a2f26]" />
            <h2 className="text-lg font-bold text-gray-900">API del Backend</h2>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${apiTone.badge}`}>
              {status.api.label}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Servicio FastAPI que expone autenticación, detección y métricas administrativas.
          </p>
          <dl>
            <DetailRow label="Nombre" value={status.api.name} />
            <DetailRow label="Versión" value={status.api.version} />
            <DetailRow label="Framework" value={status.api.framework} />
            <DetailRow label="Tiempo activo" value={formatUptime(status.api.uptime_seconds)} />
            <DetailRow label="Autenticación" value={status.api.auth} />
            <DetailRow
              label="Expiración del token"
              value={`${status.api.token_expire_minutes} minutos`}
            />
            <DetailRow label="CORS" value={status.api.cors} />
            <DetailRow label="Frontend permitido" value={status.api.frontend_url} />
            <DetailRow
              label="Runtime"
              value={`Python ${status.api.runtime.python} · ${status.api.runtime.system} ${status.api.runtime.machine}`}
            />
          </dl>

          <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Endpoints activos
          </h3>
          <ul className="space-y-2">
            {status.api.endpoints.map((endpoint) => (
              <li
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-col gap-1 rounded-lg bg-gray-50 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <span className="inline-flex w-fit rounded bg-[#1a2f26] px-2 py-0.5 text-[11px] font-bold text-white">
                  {endpoint.method}
                </span>
                <code className="text-sm font-medium text-gray-900">{endpoint.path}</code>
                <span className="text-sm text-gray-500 sm:ml-auto">{endpoint.description}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Model */}
        <section
          id="model"
          className="scroll-mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <Cpu className="size-5 text-[#1a2f26]" />
            <h2 className="text-lg font-bold text-gray-900">Modelo de detección</h2>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${modelTone.badge}`}>
              {status.model.label}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600">{status.model.detail}</p>
          <dl>
            <DetailRow label="Modelo" value={status.model.name} />
            <DetailRow label="Framework" value={status.model.framework} />
            <DetailRow label="Archivo" value={status.model.file} />
            <DetailRow label="Ruta" value={status.model.path} />
            <DetailRow label="Tamaño" value={status.model.size ?? '—'} />
            <DetailRow label="Tarea" value={status.model.task} />
            <DetailRow label="Dispositivo" value={status.model.device} />
            <DetailRow label="Entrada" value={status.model.input_size} />
            <DetailRow
              label="Archivo presente"
              value={status.model.exists ? 'Sí' : 'No'}
            />
            <DetailRow
              label="Cargado en memoria"
              value={status.model.loaded ? 'Sí' : 'No'}
            />
            <DetailRow
              label="Clases"
              value={
                <span className="inline-flex flex-wrap justify-end gap-1.5">
                  {status.model.classes.map((cls) => (
                    <span
                      key={cls}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                    >
                      {cls}
                    </span>
                  ))}
                </span>
              }
            />
          </dl>
        </section>

        {/* Database */}
        <section
          id="database"
          className="scroll-mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <Database className="size-5 text-[#1a2f26]" />
            <h2 className="text-lg font-bold text-gray-900">Base de datos</h2>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${dbTone.badge}`}>
              {status.database.label}
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600">{status.database.detail}</p>
          <dl>
            <DetailRow
              label="Conectada"
              value={status.database.connected ? 'Sí' : 'No'}
            />
            <DetailRow label="Motor" value={status.database.engine ?? 'No configurado'} />
            <DetailRow label="Host" value={status.database.host ?? '—'} />
            <DetailRow label="Base de datos" value={status.database.database ?? '—'} />
            {status.database.url_masked ? (
              <DetailRow label="URL" value={status.database.url_masked} />
            ) : null}
            <DetailRow
              label="Modo de almacenamiento"
              value={
                status.database.storage_mode === 'in_memory'
                  ? 'Memoria (temporal)'
                  : status.database.storage_mode
              }
            />
          </dl>

          {!status.database.connected ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <Activity className="mt-0.5 size-4 shrink-0" />
              <p>
                Las estadísticas del dashboard viven en memoria del proceso. Al reiniciar el backend
                se reinician a cero hasta que se conecte una base de datos persistente.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
              <p>La base de datos está conectada y disponible para persistencia.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
