'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type Stats = {
  total_detections: number;
  healthy: number;
  anthracnose: number;
};

function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    total_detections: 0,
    healthy: 0,
    anthracnose: 0,
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
        setStats(data);
      } catch {
        // AdminShell already validates auth
      }
    };

    void load();
  }, []);

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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mb-1 text-sm text-gray-600">Total Detecciones</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total_detections}</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">
              {stats.total_detections > 0
                ? `${((stats.healthy / stats.total_detections) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <p className="mb-1 text-sm text-gray-600">Plantas Sanas</p>
          <p className="text-3xl font-bold text-green-600">{stats.healthy}</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">
              {stats.total_detections > 0
                ? `${((stats.anthracnose / stats.total_detections) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <p className="mb-1 text-sm text-gray-600">Con Antracnosis</p>
          <p className="text-3xl font-bold text-red-600">{stats.anthracnose}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Acciones Rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push('/detect')}
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
