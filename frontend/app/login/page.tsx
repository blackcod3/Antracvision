'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Credenciales incorrectas');
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            router.push('/admin');
        } catch (err) {
            setError('Email o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f4f6f5] px-4 py-10">
            <div className="w-full max-w-md">
                <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Bienvenido
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-gray-600 sm:text-[15px]">
                    Ingresa tus credenciales para acceder al panel administrativo.
                </p>

                <form onSubmit={handleSubmit} className="mt-10 space-y-5">
                    {error ? (
                        <div
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
                            role="alert"
                        >
                            {error}
                        </div>
                    ) : null}

                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Email
                        </label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                            placeholder="admin@antracvision.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-gray-900"
                        >
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-[#0f291e]/40 focus:ring-2 focus:ring-[#0f291e]/20"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition hover:text-gray-800"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" aria-hidden />
                                ) : (
                                    <Eye className="h-5 w-5" aria-hidden />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            className="text-sm font-medium text-[#ff6600] underline-offset-4 hover:text-[#d63500] hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-lg bg-[#0f291e] py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#143d2f] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                    >
                        {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="mt-10 text-center text-xs text-gray-500 sm:text-sm">
                    Conexión segura · Solo administradores autorizados
                </p>

                <p className="mt-6 text-center">
                    <Link href="/" className="text-sm text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline">
                        Volver al inicio
                    </Link>
                </p>
            </div>
        </div>
    );
}
