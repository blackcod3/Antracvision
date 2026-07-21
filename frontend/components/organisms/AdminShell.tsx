'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/organisms/AdminSidebar';
import { API_BASE } from '@/lib/api';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [detectionBadge, setDetectionBadge] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Token inválido');
        }

        const data = await response.json();
        setDetectionBadge(data.anthracnose ?? 0);
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page-shell px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-page-shell">
      <AdminSidebar detectionBadge={detectionBadge} onLogout={handleLogout} />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 pt-16 sm:px-6 sm:py-8 lg:px-10 lg:pt-8 xl:px-14">
        <div key={pathname} className="admin-page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export { API_BASE };
