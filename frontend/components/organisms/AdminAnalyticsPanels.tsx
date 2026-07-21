'use client';

import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';

export type DailyPoint = {
  date: string;
  label: string;
  anthracnose: number;
  healthy: number;
};

export type SeverityCounts = {
  leve: number;
  moderada: number;
  severa: number;
};

type AdminAnalyticsPanelsProps = {
  daily: DailyPoint[];
  total: number;
  healthy: number;
  anthracnose: number;
  severity: SeverityCounts;
};

const ANTHRACNOSE = '#e53935';
const HEALTHY = '#1b5e3b';
const MILD = '#e8a317';
const MODERATE = '#c45c26';
const SEVERE = '#e53935';

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-gray-800">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-gray-600">
          <span className="size-2 rounded-sm" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold text-gray-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function SeverityBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 8 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm text-gray-600">{label}</span>
      <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f3efe6]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">
        {value}
      </span>
    </div>
  );
}

export function AdminAnalyticsPanels({
  daily,
  total,
  healthy,
  anthracnose,
  severity,
}: AdminAnalyticsPanelsProps) {
  const donutData = [
    { name: 'Con antracnosis', value: anthracnose, color: ANTHRACNOSE },
    { name: 'Sanas', value: healthy, color: HEALTHY },
  ].filter((d) => d.value > 0);

  const emptyDonut = donutData.length === 0;
  const pieData = emptyDonut
    ? [{ name: 'Sin datos', value: 1, color: '#e5e7eb' }]
    : donutData;

  const severityMax = Math.max(severity.leve, severity.moderada, severity.severa, 1);

  return (
    <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
      <section className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-gray-950 sm:text-[1.35rem]">
              Detecciones por día
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Últimos 7 días</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-[#e53935]" aria-hidden />
              Antracnosis
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] bg-[#1b5e3b]" aria-hidden />
              Sanas
            </span>
          </div>
        </div>

        <div className="h-[260px] w-full sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fillAnthracnose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ANTHRACNOSE} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={ANTHRACNOSE} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillHealthy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={HEALTHY} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={HEALTHY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="anthracnose"
                name="Antracnosis"
                stroke={ANTHRACNOSE}
                strokeWidth={2.5}
                fill="url(#fillAnthracnose)"
                dot={{ r: 4, fill: ANTHRACNOSE, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="healthy"
                name="Sanas"
                stroke={HEALTHY}
                strokeWidth={2.5}
                fill="url(#fillHealthy)"
                dot={{ r: 4, fill: HEALTHY, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="flex flex-col rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-6">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold tracking-tight text-gray-950 sm:text-[1.35rem]">
            Estado general
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Distribución total</p>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative size-[132px] shrink-0 sm:size-[148px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="92%"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    paddingAngle={emptyDonut ? 0 : 2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-2xl font-bold leading-none text-gray-950">
                  {total}
                </span>
                <span className="mt-0.5 text-xs text-gray-500">total</span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-3">
              <li className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <span className="size-2.5 rounded-full bg-[#e53935]" aria-hidden />
                  Con antracnosis
                </span>
                <span className="text-sm font-bold tabular-nums text-gray-950">{anthracnose}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <span className="size-2.5 rounded-full bg-[#1b5e3b]" aria-hidden />
                  Sanas
                </span>
                <span className="text-sm font-bold tabular-nums text-gray-950">{healthy}</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Severidad</h3>
            <div className="space-y-3.5">
              <SeverityBar label="Leve" value={severity.leve} max={severityMax} color={MILD} />
              <SeverityBar
                label="Moderada"
                value={severity.moderada}
                max={severityMax}
                color={MODERATE}
              />
              <SeverityBar
                label="Severa"
                value={severity.severa}
                max={severityMax}
                color={SEVERE}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
