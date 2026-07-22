'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, Pencil, Plus, Power, RefreshCw, Users, X,} from 'lucide-react';
import { API_BASE, getAdminToken } from '@/components/organisms/AdminShell';

type RoleOption = {
  id: number;
  name: string;
  description?: string | null;
};

type ManagedUser = {
  id: number;
  full_name: string;
  email: string;
  username: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
};

type ConfirmAction = {
  type: 'delete' | 'toggle';
  user: ManagedUser;
};

type EditForm = {
  full_name: string;
  email: string;
  username: string;
  role: string;
  password: string;
};

const emptyCreate = {
  full_name: '',
  email: '',
  username: '',
  password: '',
  role: '',
};

function detailMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg);
          }
          return null;
        })
        .filter(Boolean)
        .join('. ') || fallback
    );
  }
  return fallback;
}

function avatarSrc(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="users-modal-title"
        className={`relative z-10 w-full rounded-xl bg-white shadow-xl ${
          wide ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id="users-modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition ${className}`}
    >
      {children}
    </button>
  );
}

export default function MaintenanceUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const defaultRole = useCallback(
    (list: RoleOption[] = roles) => {
      const admin = list.find((item) => item.name === 'Administrador');
      return admin?.name || list[0]?.name || '';
    },
    [roles],
  );

  const loadData = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const [usersRes, rolesRes, meRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok || !rolesRes.ok) {
        const body = await (usersRes.ok ? rolesRes : usersRes).json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo cargar usuarios o roles'));
      }

      const usersData = (await usersRes.json()) as { users: ManagedUser[] };
      const rolesData = (await rolesRes.json()) as { roles: RoleOption[] };
      setUsers(usersData.users ?? []);
      setRoles(rolesData.roles ?? []);
      setCreateForm((prev) => ({
        ...prev,
        role: prev.role || rolesData.roles?.find((r) => r.name === 'Administrador')?.name || rolesData.roles?.[0]?.name || '',
      }));

      if (meRes.ok) {
        const me = (await meRes.json()) as { id?: number };
        if (typeof me.id === 'number') setCurrentUserId(me.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetCreateForm = () => {
    setCreateForm({ ...emptyCreate, role: defaultRole() });
    setShowCreatePassword(false);
  };

  const openCreate = () => {
    resetCreateForm();
    setError('');
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    resetCreateForm();
  };

  const openEdit = (user: ManagedUser) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      role: user.role,
      password: '',
    });
    setShowEditPassword(false);
    setError('');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: createForm.full_name.trim(),
          email: createForm.email.trim(),
          username: createForm.username.trim(),
          password: createForm.password,
          role: createForm.role,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo crear el usuario'));
      }

      closeCreate();
      setSuccess('Usuario creado correctamente.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token || !editUser || !editForm) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload: Record<string, string> = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        username: editForm.username.trim(),
        role: editForm.role,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const response = await fetch(`${API_BASE}/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(detailMessage(body, 'No se pudo actualizar el usuario'));
      }

      setEditUser(null);
      setEditForm(null);
      setSuccess('Usuario actualizado correctamente.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    const token = getAdminToken();
    if (!token || !confirmAction) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (confirmAction.type === 'delete') {
        const response = await fetch(`${API_BASE}/api/admin/users/${confirmAction.user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(detailMessage(body, 'No se pudo eliminar el usuario'));
        }
        setSuccess('Usuario eliminado correctamente.');
      } else {
        const nextActive = !confirmAction.user.is_active;
        const response = await fetch(
          `${API_BASE}/api/admin/users/${confirmAction.user.id}/active`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active: nextActive }),
          },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            detailMessage(
              body,
              nextActive ? 'No se pudo activar el usuario' : 'No se pudo desactivar el usuario',
            ),
          );
        }
        setSuccess(nextActive ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
      }

      setConfirmAction(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            Usuarios
          </h1>
          <p className="text-pretty text-sm text-gray-600 sm:text-base">
            Crea y administra usuarios con rol de administrador u operador.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f291e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#143d2f]"
          >
            <Plus className="size-4" aria-hidden />
            Nuevo usuario
          </button>
        </div>
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

      <section className="rounded-lg bg-white p-6 shadow">
        <div className="mb-5 flex items-center gap-2">
          <Users className="size-5 text-[#0f291e]" aria-hidden />
          <h2 className="text-lg font-semibold text-gray-900">Usuarios registrados</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-b-2 border-green-600" />
              <p className="text-sm text-gray-600">Cargando usuarios…</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No hay usuarios registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-2 py-3 font-semibold">Nombre</th>
                  <th className="px-2 py-3 font-semibold">Usuario</th>
                  <th className="px-2 py-3 font-semibold">Rol</th>
                  <th className="px-2 py-3 font-semibold">Estado</th>
                  <th className="px-2 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = currentUserId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-2 py-3">
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-2 py-3 text-gray-700">{user.username}</td>
                      <td className="px-2 py-3">
                        <span className="inline-flex rounded-md bg-[#e8eee9] px-2 py-1 text-xs font-medium text-[#0f291e]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                            user.is_active
                              ? 'bg-green-50 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            label="Ver detalle"
                            onClick={() => setDetailUser(user)}
                            className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Eye className="size-4" aria-hidden />
                          </ActionButton>
                          <ActionButton
                            label="Editar"
                            onClick={() => openEdit(user)}
                            className="text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </ActionButton>
                          <ActionButton
                            label={user.is_active ? 'Desactivar' : 'Activar'}
                            onClick={() => {
                              if (isSelf) return;
                              setConfirmAction({ type: 'toggle', user });
                            }}
                            className={
                              isSelf
                                ? 'cursor-not-allowed text-gray-300'
                                : user.is_active
                                  ? 'text-amber-700 hover:bg-amber-50'
                                  : 'text-green-700 hover:bg-green-50'
                            }
                          >
                            <Power className="size-4" aria-hidden />
                          </ActionButton>
                          <ActionButton
                            label="Eliminar"
                            onClick={() => {
                              if (isSelf) return;
                              setConfirmAction({ type: 'delete', user });
                            }}
                            className={
                              isSelf
                                ? 'cursor-not-allowed text-gray-300'
                                : 'text-red-600 hover:bg-red-50'
                            }
                          >
                            <X className="size-4" aria-hidden />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen ? (
        <ModalShell
          title="Nuevo usuario"
          onClose={closeCreate}
          wide
          footer={
            <>
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={saving || !createForm.role}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0f291e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143d2f] disabled:bg-gray-300"
              >
                <Plus className="size-4" aria-hidden />
                {saving ? 'Creando…' : 'Crear usuario'}
              </button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-gray-900">
                Nombre completo
              </label>
              <input
                id="full_name"
                type="text"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
                required
                minLength={2}
                className={inputClass}
                placeholder="Nombre del usuario"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                className={inputClass}
                placeholder="usuario@antracvision.com"
              />
            </div>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-900">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                required
                minLength={3}
                autoComplete="off"
                className={inputClass}
                placeholder="nombre.usuario"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showCreatePassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                  aria-label={showCreatePassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showCreatePassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-900">
                Rol
              </label>
              <select
                id="role"
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                required
                className={inputClass}
              >
                {roles.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              {roles.find((item) => item.name === createForm.role)?.description ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  {roles.find((item) => item.name === createForm.role)?.description}
                </p>
              ) : null}
            </div>
          </form>
        </ModalShell>
      ) : null}

      {detailUser ? (
        <ModalShell title="Detalle de usuario" onClose={() => setDetailUser(null)}>
          <div className="flex items-start gap-4">
            {avatarSrc(detailUser.avatar_url) ? (
              <img
                src={avatarSrc(detailUser.avatar_url) || ''}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-[#1a2f26] text-xl font-semibold text-white">
                {detailUser.full_name.trim().charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{detailUser.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Correo</p>
                <p className="break-all text-sm text-gray-900">{detailUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Usuario</p>
                <p className="text-sm text-gray-900">{detailUser.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-md bg-[#e8eee9] px-2 py-1 text-xs font-medium text-[#0f291e]">
                  {detailUser.role}
                </span>
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                    detailUser.is_active
                      ? 'bg-green-50 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {detailUser.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {editUser && editForm ? (
        <ModalShell
          title="Editar usuario"
          onClose={() => {
            setEditUser(null);
            setEditForm(null);
          }}
          wide
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setEditUser(null);
                  setEditForm(null);
                }}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-user-form"
                disabled={saving}
                className="rounded-lg bg-[#0f291e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143d2f] disabled:bg-gray-300"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={handleEdit} className="space-y-4">
            <div>
              <label htmlFor="edit_full_name" className="mb-2 block text-sm font-medium text-gray-900">
                Nombre completo
              </label>
              <input
                id="edit_full_name"
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, full_name: e.target.value } : prev))}
                required
                minLength={2}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit_email" className="mb-2 block text-sm font-medium text-gray-900">
                Correo electrónico
              </label>
              <input
                id="edit_email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit_username" className="mb-2 block text-sm font-medium text-gray-900">
                Usuario
              </label>
              <input
                id="edit_username"
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, username: e.target.value } : prev))}
                required
                minLength={3}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit_role" className="mb-2 block text-sm font-medium text-gray-900">
                Rol
              </label>
              <select
                id="edit_role"
                value={editForm.role}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, role: e.target.value } : prev))}
                required
                className={inputClass}
              >
                {roles.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit_password" className="mb-2 block text-sm font-medium text-gray-900">
                Nueva contraseña (opcional)
              </label>
              <div className="relative">
                <input
                  id="edit_password"
                  type={showEditPassword ? 'text' : 'password'}
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, password: e.target.value } : prev))}
                  minLength={8}
                  autoComplete="new-password"
                  className={`${inputClass} pr-12`}
                  placeholder="Dejar vacío para no cambiar"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                  aria-label={showEditPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showEditPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {confirmAction ? (
        <ModalShell
          title="¿Estás seguro?"
          onClose={() => setConfirmAction(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={saving}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:bg-gray-300 ${
                  confirmAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0f291e] hover:bg-[#143d2f]'
                }`}
              >
                {saving
                  ? 'Procesando…'
                  : confirmAction.type === 'delete'
                    ? 'Sí, eliminar'
                    : confirmAction.user.is_active
                      ? 'Sí, desactivar'
                      : 'Sí, activar'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-700">
            {confirmAction.type === 'delete' ? (
              <>
                Vas a eliminar permanentemente a{' '}
                <span className="font-semibold text-gray-900">{confirmAction.user.full_name}</span>.
                Esta acción no se puede deshacer.
              </>
            ) : confirmAction.user.is_active ? (
              <>
                Vas a desactivar a{' '}
                <span className="font-semibold text-gray-900">{confirmAction.user.full_name}</span>.
                No podrá iniciar sesión mientras esté inactivo.
              </>
            ) : (
              <>
                Vas a activar a{' '}
                <span className="font-semibold text-gray-900">{confirmAction.user.full_name}</span>.
                Podrá volver a iniciar sesión.
              </>
            )}
          </p>
        </ModalShell>
      ) : null}
    </>
  );
}
