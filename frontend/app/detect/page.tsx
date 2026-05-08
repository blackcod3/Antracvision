'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

interface DetectionResult {
    clase: string;
    probabilidad: number;
    confianza_porcentaje: string;
    estado: string;
    recomendacion: string;
    timestamp: string;
}

export default function DetectPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleDetect = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('http://localhost:8000/api/detect', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error en la detección');
            }

            const data: DetectionResult = await response.json();
            setResult(data);
        } catch (err) {
            setError('Error al procesar la imagen. Por favor intenta nuevamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'saludable': return 'text-green-600 bg-green-50';
            case 'leve': return 'text-yellow-600 bg-yellow-50';
            case 'moderado': return 'text-orange-600 bg-orange-50';
            case 'crítico': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-green-50 to-white">
            {/* Header: en móvil apila marca y enlace sin estrechar el layout */}
            <header className="container mx-auto px-4 py-4 md:py-6">
                <nav className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <Link href="/" className="flex items-center gap-2 min-w-0">
                        <img
                            src="/images/iconomain.png"
                            alt=""
                            className="h-11 w-11 shrink-0 md:h-12 md:w-12"
                            width={48}
                            height={48}
                        />
                        <span className="truncate text-xl font-bold text-[#264653] md:text-2xl">
                            AntracVision
                        </span>
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex min-h-11 shrink-0 items-center self-start rounded-md py-1 pr-2 text-sm text-gray-700 transition hover:text-green-600 md:self-auto md:text-base"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                        Volver al Inicio
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 md:py-12">
                <div className="mx-auto max-w-4xl">
                    <h1 className="mb-3 text-center text-2xl font-bold text-gray-900 text-balance md:mb-4 md:text-4xl">
                        Detección de Antracnosis
                    </h1>
                    <p className="mb-8 text-center text-base text-gray-600 text-pretty md:text-lg">
                        Sube una imagen del fruto de la naranja para detectar la presencia de antracnosis
                    </p>

                    <div className="rounded-xl bg-white p-5 shadow-lg md:p-8">
                        {/* Upload Area */}
                        <div className="mb-8">
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-10 text-center touch-manipulation transition hover:border-green-500 min-[480px]:px-8 md:min-h-0 md:p-8"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <div className="space-y-4">
                                        <img
                                            src={previewUrl}
                                            alt="Vista previa"
                                            className="mx-auto max-h-52 w-auto max-w-full rounded-lg object-contain md:max-h-64"
                                        />
                                        <p className="break-all px-1 text-xs text-gray-600 md:text-sm">
                                            {selectedFile?.name}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="mx-auto h-14 w-14 text-gray-400 md:h-16 md:w-16" aria-hidden />
                                        <div className="px-1">
                                            <p className="text-base font-semibold text-gray-700 md:text-lg">
                                                <span className="md:hidden">Toca para subir una imagen</span>
                                                <span className="hidden md:inline">Haz clic para subir una imagen</span>
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                <span className="md:hidden">PNG o JPG hasta 10&nbsp;MB</span>
                                                <span className="hidden md:inline">
                                                    o arrastra y suelta (PNG, JPG hasta 10MB)
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="mb-8 flex flex-col gap-3 md:flex-row md:gap-0 md:space-x-4">
                            <button
                                type="button"
                                onClick={handleDetect}
                                disabled={!selectedFile || loading}
                                className="flex min-h-12 w-full flex-1 items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:min-h-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Analizando...
                                    </>
                                ) : (
                                    'Detectar Enfermedad'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="min-h-12 w-full shrink-0 rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-400 transition hover:bg-gray-500 hover:text-white md:min-h-0 md:w-auto"
                            >
                                Limpiar
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                                <p className="break-words text-sm text-red-800 md:text-base">{error}</p>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="border-t pt-6">
                                    <h2 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">
                                        Resultados del Análisis
                                    </h2>

                                    {/* Status Badge */}
                                    <div
                                        className={`mb-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold md:text-base ${getStatusColor(result.estado)}`}
                                    >
                                        {result.clase === 'Sana' ? (
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 mr-2" />
                                        )}
                                        {result.clase}
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Confianza</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {result.confianza_porcentaje}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Estado</p>
                                            <p className="text-2xl font-bold text-gray-900 capitalize">
                                                {result.estado}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recommendation */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                                            Recomendación
                                        </h3>
                                        <p className="text-blue-800">
                                            {result.recomendacion}
                                        </p>
                                    </div>

                                    {/* Timestamp */}
                                    <p className="text-sm text-gray-500 mt-4">
                                        Análisis realizado: {new Date(result.timestamp).toLocaleString('es-PE')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Cards */}
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-5 shadow md:p-6">
                            <h3 className="font-bold text-gray-900 mb-2">Consejos para mejores resultados</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Toma la foto con buena iluminación</li>
                                <li>• Enfoca claramente el fruto</li>
                                <li>• Evita sombras o reflejos</li>
                                <li>• Captura la hoja completa si es posible</li>
                            </ul>
                        </div>
                        <div className="rounded-lg bg-white p-5 shadow md:p-6">
                            <h3 className="mb-2 font-bold text-gray-900">¿Necesitas ayuda?</h3>
                            <p className="text-sm text-gray-600">
                                Si tienes dudas sobre los resultados o necesitas asesoramiento
                                profesional, contacta a un agrónomo especializado.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}