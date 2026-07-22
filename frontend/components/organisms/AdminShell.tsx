'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/organisms/AdminSidebar';
import { API_BASE } from '@/lib/api';

export type AdminProfile = {
  full_name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
};

type AdminShellProps = {
  children: ReactNode;
};

const DETECTION_SEEN_KEY = 'detection_anthracnose_seen';

function getSeenAnthracnoseCount(): number {
  const raw = localStorage.getItem(DETECTION_SEEN_KEY);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function unreadDetectionBadge(anthracnose: number): number {
  return Math.max(0, anthracnose - getSeenAnthracnoseCount());
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [detectionBadge, setDetectionBadge] = useState(0);
  const [anthracnoseTotal, setAnthracnoseTotal] = useState<number | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const load = async () => {
      try {
        const [statsRes, meRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!statsRes.ok || !meRes.ok) {
          throw new Error('Token inválido');
        }

        const stats = await statsRes.json();
        const me = (await meRes.json()) as AdminProfile;
        const anthracnose = stats.anthracnose ?? 0;
        setAnthracnoseTotal(anthracnose);
        setDetectionBadge(unreadDetectionBadge(anthracnose));
        setProfile(me);
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

  // Clear the Detección badge once the user opens the history page.
  useEffect(() => {
    if (!pathname.startsWith('/admin/detect/historial')) return;
    if (anthracnoseTotal === null) return;
    localStorage.setItem(DETECTION_SEEN_KEY, String(anthracnoseTotal));
    setDetectionBadge(0);
  }, [pathname, anthracnoseTotal]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const custom = event as CustomEvent<AdminProfile>;
      if (custom.detail) setProfile(custom.detail);
    };
    window.addEventListener('admin-profile-updated', onProfileUpdated);
    return () => window.removeEventListener('admin-profile-updated', onProfileUpdated);
  }, []);

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
      <AdminSidebar
        userName={profile?.full_name}
        userRole={profile?.role}
        avatarUrl={profile?.avatar_url}
        detectionBadge={detectionBadge}
        onLogout={handleLogout}
      />
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
