'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Check, CircleDot, Gauge, Triangle } from 'lucide-react';
import { AdminAnalyticsPanels, type DailyPoint, type SeverityCounts, } from '@/components/organisms/AdminAnalyticsPanels';
import { RecentDetectionsPanel, type RecentDetection, } from '@/components/organisms/RecentDetectionsPanel';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type Stats = {
  total_detections: number;
  healthy: number;
  anthracnose: number;
  severe: number;
  avg_confidence: number;
  healthy_pct: number;
  anthracnose_pct: number;
  previous_total: number;
  total_change_pct: number;
  daily: DailyPoint[];
  severity: SeverityCounts;
  recent: RecentDetection[];
};

const EMPTY_DAILY: DailyPoint[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(
  (label) => ({ date: label, label, anthracnose: 0, healthy: 0 }),
);

type StatCardProps = {
  icon: ReactNode;
  iconWrapClass: string;
  badge: ReactNode;
  title: string;
  value: string | number;
  footnote: string;
};

function StatCard({ icon, iconWrapClass, badge, title, value, footnote }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className={`flex size-11 items-center justify-center rounded-xl ${iconWrapClass}`}>
          {icon}
        </div>
        <div className="pt-0.5 text-sm font-medium tabular-nums">{badge}</div>
      </div>
      <p className="text-[15px] text-gray-500">{title}</p>
      <p className="mt-1 font-serif text-[2.35rem] font-bold leading-none tracking-tight text-gray-950">
        {value}
      </p>
      <p className="mt-3 text-sm text-gray-400">{footnote}</p>
    </article>
  );
}

function TrendBadge({ value, emphasize = false }: { value: number; emphasize?: boolean }) {
  const positive = value >= 0;
  const abs = Math.abs(value);
  const label = `${Number.isInteger(abs) ? abs.toFixed(0) : abs.toFixed(1)}%`;

  if (!emphasize) {
    return <span className="text-gray-500">{label}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${positive ? 'text-red-500' : 'text-emerald-600'}`}>
      <Triangle
        className={`size-2.5 fill-current ${positive ? '' : 'rotate-180'}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    total_detections: 0,
    healthy: 0,
    anthracnose: 0,
    severe: 0,
    avg_confidence: 0,
    healthy_pct: 0,
    anthracnose_pct: 0,
    previous_total: 0,
    total_change_pct: 0,
    daily: EMPTY_DAILY,
    severity: { leve: 0, moderada: 0, severa: 0 },
    recent: [],
  });
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setStats({
          total_detections: data.total_detections ?? 0,
          healthy: data.healthy ?? 0,
          anthracnose: data.anthracnose ?? 0,
          severe: data.severe ?? 0,
          avg_confidence: data.avg_confidence ?? 0,
          healthy_pct: data.healthy_pct ?? 0,
          anthracnose_pct: data.anthracnose_pct ?? 0,
          previous_total: data.previous_total ?? 0,
          total_change_pct: data.total_change_pct ?? 0,
          daily: Array.isArray(data.daily) && data.daily.length ? data.daily : EMPTY_DAILY,
          severity: {
            leve: data.severity?.leve ?? 0,
            moderada: data.severity?.moderada ?? 0,
            severa: data.severity?.severa ?? 0,
          },
          recent: Array.isArray(data.recent) ? data.recent : [],
        });
      } catch {
        // AdminShell already validates auth
      }
    };

    void load();
  }, []);

  const confidenceDisplay = Math.round(stats.avg_confidence);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Panel de Administración
        </h1>
        <p className="text-pretty text-sm text-gray-600 sm:text-base">
          Monitorea las estadísticas del sistema de detección
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <StatCard
          icon={<Activity className="size-5 text-[#2563eb]" strokeWidth={2.25} aria-hidden />}
          iconWrapClass="bg-[#dbeafe]"
          badge={<TrendBadge value={stats.total_change_pct} emphasize />}
          title="Total Detecciones"
          value={stats.total_detections}
          footnote={`vs. ${stats.previous_total} el periodo anterior`}
        />

        <StatCard
          icon={<Check className="size-5 text-[#16a34a]" strokeWidth={2.5} aria-hidden />}
          iconWrapClass="bg-[#dcfce7]"
          badge={<span className="text-gray-500">{stats.healthy_pct.toFixed(1)}%</span>}
          title="Naranjas Sanas"
          value={stats.healthy}
          footnote="del total analizado"
        />

        <StatCard
          icon={<CircleDot className="size-5 text-[#dc2626]" strokeWidth={2.25} aria-hidden />}
          iconWrapClass="bg-[#fee2e2]"
          badge={<TrendBadge value={stats.anthracnose_pct} emphasize />}
          title="Con Antracnosis"
          value={stats.anthracnose}
          footnote={`${stats.severe} en etapa severa`}
        />

        <StatCard
          icon={<Gauge className="size-5 text-[#d97706]" strokeWidth={2.25} aria-hidden />}
          iconWrapClass="bg-[#ffedd5]"
          badge={
            <span className="text-emerald-600">
              {stats.avg_confidence.toFixed(1)}%
            </span>
          }
          title="Confianza promedio"
          value={`${confidenceDisplay}%`}
          footnote="del modelo YOLOv8"
        />
      </div>

      <AdminAnalyticsPanels
        daily={stats.daily}
        total={stats.total_detections}
        healthy={stats.healthy}
        anthracnose={stats.anthracnose}
        severity={stats.severity}
      />

      <RecentDetectionsPanel detections={stats.recent} />

      <div className="mt-2">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Acciones Rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/admin/detect')}
            className="rounded-lg bg-white p-5 text-left shadow transition hover:shadow-lg active:bg-gray-50 sm:p-6"
          >
            <h3 className="mb-2 font-bold text-gray-900">Probar Detección</h3>
            <p className="text-sm text-gray-600">
              Realizar una nueva detección de antracnosis
            </p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/settings')}
            className="rounded-lg bg-white p-5 text-left shadow transition hover:shadow-lg active:bg-gray-50 sm:p-6"
          >
            <h3 className="mb-2 font-bold text-gray-900">Estado del Sistema</h3>
            <p className="text-sm text-gray-600">
              Ver detalle de API, modelo y base de datos
            </p>
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminPage() {
  return <DashboardContent />;
}
