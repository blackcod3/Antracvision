'use client';

import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Crop, Loader2, Upload } from 'lucide-react';
import ImageCropEditor from '@/components/molecules/ImageCropEditor';
import { Area, getCroppedImage } from '@/lib/cropImage';
import { API_BASE } from '@/lib/api';

export type DetectionResult = {
  clase: string;
  probabilidad: number;
  confianza_porcentaje: string;
  estado: string;
  recomendacion: string;
  timestamp: string;
};

type DetectionWorkspaceProps = {
  /** Compact layout for the admin panel (no marketing cards). */
  variant?: 'public' | 'admin';
};

function statusColor(estado: string) {
  switch (estado) {
    case 'saludable':
      return 'text-green-600 bg-green-50';
    case 'leve':
      return 'text-yellow-600 bg-yellow-50';
    case 'moderado':
      return 'text-[#e85706] bg-orange-50';
    case 'crítico':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function DetectionWorkspace({ variant = 'public' }: DetectionWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState('imagen.jpg');
  const [isEditing, setIsEditing] = useState(false);
  const [applyingCrop, setApplyingCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = variant === 'admin';

  const revokeUrl = (url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    revokeUrl(sourceImageUrl);
    revokeUrl(previewUrl);

    const objectUrl = URL.createObjectURL(file);
    setSourceImageUrl(objectUrl);
    setSourceFileName(file.name);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(true);
    setResult(null);
    setError(null);
  };

  const handleCropConfirm = async (croppedAreaPixels: Area, outputMaxSize: number) => {
    if (!sourceImageUrl) return;

    setApplyingCrop(true);
    setError(null);

    try {
      const croppedFile = await getCroppedImage(
        sourceImageUrl,
        croppedAreaPixels,
        sourceFileName,
        outputMaxSize,
      );

      revokeUrl(previewUrl);
      const nextPreview = URL.createObjectURL(croppedFile);
      setSelectedFile(croppedFile);
      setPreviewUrl(nextPreview);
      setIsEditing(false);
      setResult(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo aplicar el recorte. Intenta con otra imagen.');
    } finally {
      setApplyingCrop(false);
    }
  };

  const handleCropCancel = () => {
    revokeUrl(sourceImageUrl);
    setSourceImageUrl(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReEdit = () => {
    if (!sourceImageUrl) return;
    setIsEditing(true);
    setResult(null);
    setError(null);
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const headers: HeadersInit = {};
      if (isAdmin) {
        const token = localStorage.getItem('token');
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/detect`, {
        method: 'POST',
        headers,
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
    revokeUrl(sourceImageUrl);
    revokeUrl(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSourceImageUrl(null);
    setIsEditing(false);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const panelClass = isAdmin
    ? 'rounded-lg bg-white p-5 shadow md:p-6'
    : 'rounded-xl bg-white p-5 shadow-lg md:p-8';

  return (
    <>
      <div className={panelClass}>
        {isEditing && sourceImageUrl ? (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 md:text-xl">
              Recortar y redimensionar
            </h2>
            <ImageCropEditor
              imageSrc={sourceImageUrl}
              onConfirm={handleCropConfirm}
              onCancel={handleCropCancel}
              confirming={applyingCrop}
            />
          </div>
        ) : (
          <>
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
                    <Upload
                      className="mx-auto h-14 w-14 text-gray-400 md:h-16 md:w-16"
                      aria-hidden
                    />
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
                      <p className="mt-2 text-sm text-green-700">
                        Podrás recortar y redimensionar antes de analizar
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

            <div className="mb-8 flex flex-row flex-wrap gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => void handleDetect()}
                disabled={!selectedFile || loading}
                className="flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-6 md:min-h-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  'Detectar Enfermedad'
                )}
              </button>
              {selectedFile && sourceImageUrl ? (
                <button
                  type="button"
                  onClick={handleReEdit}
                  disabled={loading}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-green-600 px-4 py-3 font-semibold text-green-700 transition hover:bg-green-50 sm:px-6 md:min-h-0"
                >
                  <Crop className="mr-2 h-4 w-4" aria-hidden />
                  Editar
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleReset}
                className="min-h-12 shrink-0 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-400 transition hover:bg-gray-500 hover:text-white sm:px-6 md:min-h-0"
              >
                Limpiar
              </button>
            </div>
          </>
        )}

        {error ? (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <p className="break-words text-sm text-red-800 md:text-base">{error}</p>
          </div>
        ) : null}

        {result ? (
          <div className="animate-fade-in space-y-6">
            <div className="border-t pt-6">
              <h2 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">
                Resultados del Análisis
              </h2>

              <div
                className={`mb-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold md:text-base ${statusColor(result.estado)}`}
              >
                {result.clase === 'Sana' ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <AlertCircle className="mr-2 h-5 w-5" />
                )}
                {result.clase}
              </div>

              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Confianza</p>
                  <p className="text-2xl font-bold text-gray-900">{result.confianza_porcentaje}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Estado</p>
                  <p className="text-2xl font-bold capitalize text-gray-900">{result.estado}</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-2 text-lg font-bold text-blue-900">Recomendación</h3>
                <p className="text-blue-800">{result.recomendacion}</p>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Análisis realizado: {new Date(result.timestamp).toLocaleString('es-PE')}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {!isAdmin ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-5 shadow md:p-6">
            <h3 className="mb-2 font-bold text-gray-900">Consejos para mejores resultados</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Toma la foto con buena iluminación</li>
              <li>• Enfoca claramente el fruto</li>
              <li>• Recorta dejando solo la zona de interés</li>
              <li>• Evita sombras o reflejos</li>
            </ul>
          </div>
          <div className="rounded-lg bg-white p-5 shadow md:p-6">
            <h3 className="mb-2 font-bold text-gray-900">¿Necesitas ayuda?</h3>
            <p className="text-sm text-gray-600">
              Si tienes dudas sobre los resultados o necesitas asesoramiento profesional,
              contacta a un agrónomo especializado.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
