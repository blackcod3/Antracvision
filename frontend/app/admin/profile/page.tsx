'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, Eye, EyeOff, Save, Trash2, User } from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type AdminProfile = {
  full_name: string;
  email: string;
  username: string;
  avatar_url: string | null;
  role: string;
};

function avatarSrc(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function AdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const applyProfile = useCallback((data: AdminProfile) => {
    setProfile(data);
    setFullName(data.full_name);
    setEmail(data.email);
    window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: data }));
  }, []);

  const loadProfile = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo cargar el perfil');
      const data = (await response.json()) as AdminProfile;
      applyProfile(data);
    } catch {
      setError('Error al cargar el perfil. Verifica que el backend esté en ejecución.');
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token || !profile) return;

    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    const emailChanged = email.trim().toLowerCase() !== profile.email.toLowerCase();
    const passwordChanging = Boolean(newPassword);

    if ((emailChanged || passwordChanging) && !currentPassword) {
      setError('Ingresa tu contraseña actual para cambiar el correo o la contraseña.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          current_password: currentPassword || null,
          new_password: newPassword || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'No se pudo guardar el perfil');
      }

      const data = (await response.json()) as AdminProfile;
      applyProfile(data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const token = getAdminToken();
    if (!token) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || 'No se pudo subir la foto');
      }

      const data = (await response.json()) as AdminProfile;
      applyProfile(data);
      setSuccess('Foto de perfil actualizada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const token = getAdminToken();
    if (!token || !profile?.avatar_url) return;

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No se pudo eliminar la foto');
      const data = (await response.json()) as AdminProfile;
      applyProfile(data);
      setSuccess('Foto de perfil eliminada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la foto');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
          <p className="text-sm text-gray-600">Cargando perfil…</p>
        </div>
      </div>
    );
  }

  const photo = avatarSrc(profile?.avatar_url);
  const initial = (fullName.trim().charAt(0) || 'A').toUpperCase();

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Mi perfil
        </h1>
        <p className="text-pretty text-sm text-gray-600 sm:text-base">
          Edita tu perfil de usuario.
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

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Foto de perfil
          </h2>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {photo ? (
                <img
                  src={photo}
                  alt={fullName || 'Administrador'}
                  className="size-28 rounded-full object-cover ring-4 ring-[#e8eee9]"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full bg-[#1a2f26] text-3xl font-semibold text-white ring-4 ring-[#e8eee9]">
                  {initial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 inline-flex size-10 items-center justify-center rounded-full bg-[#0f291e] text-white shadow transition hover:bg-[#143d2f] disabled:opacity-60"
              >
                <Camera className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-4 text-base font-semibold text-gray-900">{fullName || 'Administrador'}</p>
            <p className="text-sm text-gray-500">{profile?.role}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="mt-5 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f291e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143d2f] disabled:opacity-60"
              >
                <Camera className="size-4" aria-hidden />
                {uploading ? 'Subiendo…' : 'Cambiar foto'}
              </button>
              {profile?.avatar_url ? (
                <button
                  type="button"
                  onClick={() => void handleRemoveAvatar()}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Quitar foto
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-gray-500">JPG, PNG, WEBP o GIF · Máx. 5 MB</p>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow">
            <div className="mb-5 flex items-center gap-2">
              <User className="size-5 text-[#0f291e]" aria-hidden />
              <h2 className="text-lg font-semibold text-gray-900">Información personal</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-900">
                  Nombre completo
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                  placeholder="admin@antracvision.com"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Este correo también se usa para iniciar sesión.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">Cambiar contraseña</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="current_password" className="mb-2 block text-sm font-medium text-gray-900">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    id="current_password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                    placeholder="Requerida al cambiar correo o contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                    aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                  >
                    {showCurrent ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new_password" className="mb-2 block text-sm font-medium text-gray-900">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="new_password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                    aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                  >
                    {showNew ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-gray-900">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f291e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#143d2f] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Save className="size-4" aria-hidden />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
