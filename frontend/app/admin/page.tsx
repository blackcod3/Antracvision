'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Activity, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_detections: 0,
        healthy: 0,
        anthracnose: 0
    });
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            localStorage.removeItem('token');
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-page-shell px-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-page-shell">
            {/* Header */}
            <header className="shadow bg-white">
                <div className="w-full px-4 py-3 sm:px-6 sm:py-4 lg:px-10 xl:px-14">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                            <img
                                src="/images/iconomain.png"
                                alt=""
                                className="size-10 shrink-0 sm:size-12"
                                width={48}
                                height={48}
                            />
                            <span className="truncate text-xl font-bold text-[#264653] sm:text-2xl">
                                AntracVision
                            </span>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 sm:text-sm">
                                Admin
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-gray-700 transition hover:text-red-600 active:text-red-700 sm:w-auto sm:justify-start sm:text-base"
                        >
                            <LogOut className="size-5 shrink-0" aria-hidden />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-14">
                <div className="mb-6 sm:mb-8">
                    <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
                        Panel de Administración
                    </h1>
                    <p className="text-pretty text-sm text-gray-600 sm:text-base">
                        Monitorea las estadísticas del sistema de detección
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Total Detecciones</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {stats.total_detections}
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-600">
                                {stats.total_detections > 0
                                    ? `${((stats.healthy / stats.total_detections) * 100).toFixed(1)}%`
                                    : '0%'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Plantas Sanas</p>
                        <p className="text-3xl font-bold text-green-600">
                            {stats.healthy}
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-sm text-gray-600">
                                {stats.total_detections > 0
                                    ? `${((stats.anthracnose / stats.total_detections) * 100).toFixed(1)}%`
                                    : '0%'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Con Antracnosis</p>
                        <p className="text-3xl font-bold text-red-600">
                            {stats.anthracnose}
                        </p>
                    </div>
                </div>

                {/* System Status */}
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Estado del Sistema
                    </h2>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 rounded-lg bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-3 shrink-0 rounded-full bg-green-500" />
                                <span className="font-medium text-gray-900">API Backend</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600 sm:text-right">
                                Operativo
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-3 shrink-0 rounded-full bg-green-500" />
                                <span className="font-medium text-gray-900">Modelo YOLOv8</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600 sm:text-right">
                                Cargado
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-3 shrink-0 rounded-full bg-red-500" />
                                <span className="font-medium text-gray-900">Base de Datos</span>
                            </div>
                            <span className="text-sm font-semibold text-red-600 sm:text-right">
                                Aun sin BD
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Acciones Rápidas
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => router.push('/detect')}
                            className="rounded-lg bg-white p-5 text-left shadow transition hover:shadow-lg active:bg-gray-50 sm:p-6"
                        >
                            <h3 className="font-bold text-gray-900 mb-2">Probar Detección</h3>
                            <p className="text-sm text-gray-600">
                                Realizar una nueva detección de antracnosis
                            </p>
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-white p-5 text-left shadow transition hover:shadow-lg active:bg-gray-50 sm:p-6"
                        >
                            <h3 className="font-bold text-gray-900 mb-2">Ver Historial</h3>
                            <p className="text-sm text-gray-600">
                                Revisar todas las detecciones realizadas
                            </p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}