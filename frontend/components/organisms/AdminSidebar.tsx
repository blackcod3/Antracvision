'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Wrench, Eye, BarChart3, Crosshair, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { API_BASE } from '@/lib/api';

type AdminSidebarProps = {
  userName?: string;
  userRole?: string;
  avatarUrl?: string | null;
  detectionBadge?: number;
  onLogout: () => void;
};

function resolveAvatarUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const generalItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true },
] as const;

const moduleItems = [
  { href: '/admin/maintenance', label: 'Mantenimiento', icon: Wrench },
  { href: '/detect', label: 'Detección', icon: Eye, badgeKey: 'detection' as const },
  { href: '/admin/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/settings', label: 'Configuración', icon: Crosshair },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  userName = 'Administrador',
  userRole = 'Administrador',
  avatarUrl = null,
  detectionBadge = 0,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = userName.trim().charAt(0).toUpperCase() || 'A';
  const photo = resolveAvatarUrl(avatarUrl);
  const profileActive = isActive(pathname, '/admin/profile');

  const nav = (
    <>
      <div className="flex items-center gap-3 px-1 pb-5">
        <img
          src="/images/iconomain.png"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-bold leading-tight tracking-tight text-white">
            AntracVision
          </p>
        </div>
      </div>

      <div className="mx-1 border-t border-white/10" />

      <nav className="mt-5 flex flex-1 flex-col gap-6 overflow-y-auto px-1">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d9688]">
            General
          </p>
          <ul className="space-y-1">
            {generalItems.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                      active
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-[#d5e3db] hover:bg-white/5 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d9688]">
            Módulos
          </p>
          <ul className="space-y-1">
            {moduleItems.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const badge =
                'badgeKey' in item && item.badgeKey === 'detection' && detectionBadge > 0
                  ? detectionBadge
                  : null;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                      active
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-[#d5e3db] hover:bg-white/5 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge !== null ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e53935] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                    <ChevronRight className="size-4 shrink-0 text-[#7d9688]" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="mt-auto px-1 pt-4">
        <div className="border-t border-white/10 pt-4">
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
              profileActive ? 'bg-white/10' : ''
            }`}
          >
            <Link
              href="/admin/profile"
              onClick={() => setMobileOpen(false)}
              aria-label="Ver y editar perfil"
              title="Mi perfil"
              className="shrink-0 rounded-full ring-offset-2 ring-offset-[#1a2f26] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-[#0f241c] text-sm font-semibold text-white">
                  {initial}
                </div>
              )}
            </Link>
            <Link
              href="/admin/profile"
              onClick={() => setMobileOpen(false)}
              className="min-w-0 flex-1 rounded-lg transition hover:opacity-90"
            >
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-[#8fa89a]">{userRole}</p>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#a8bfb2] transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex size-11 items-center justify-center rounded-xl bg-[#1a2f26] text-white shadow-lg lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#1a2f26] px-4 py-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-[#a8bfb2] hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="size-5" aria-hidden />
        </button>
        {nav}
      </aside>
    </>
  );
}
