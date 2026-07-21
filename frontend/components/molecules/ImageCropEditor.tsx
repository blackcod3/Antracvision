'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Check, RotateCcw, ZoomIn } from 'lucide-react';

type AspectOption = {
  label: string;
  value: number | undefined;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Libre', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
];

type ImageCropEditorProps = {
  imageSrc: string;
  onConfirm: (croppedAreaPixels: Area, outputMaxSize: number) => void;
  onCancel: () => void;
  confirming?: boolean;
};

export default function ImageCropEditor({
  imageSrc,
  onConfirm,
  onCancel,
  confirming = false,
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [outputMaxSize, setOutputMaxSize] = useState(1024);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = () => {
    if (!croppedAreaPixels) return;
    onConfirm(croppedAreaPixels, outputMaxSize);
  };

  const handleResetView = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="space-y-4">
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-900 sm:h-80 md:h-96">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
          objectFit="contain"
        />
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <label
            htmlFor="crop-zoom"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <ZoomIn className="h-4 w-4" aria-hidden />
            Zoom / redimensionar vista
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Proporción del recorte</p>
          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((option) => {
              const selected = aspect === option.value;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setAspect(option.value)}
                  className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    selected
                      ? 'border-green-600 bg-green-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-green-500'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="output-size"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Tamaño de salida (lado máximo): {outputMaxSize}px
          </label>
          <input
            id="output-size"
            type="range"
            min={512}
            max={2048}
            step={128}
            value={outputMaxSize}
            onChange={(e) => setOutputMaxSize(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>512px</span>
            <span>2048px</span>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        Arrastra para mover el recorte. Usa el zoom para acercar o alejar.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!croppedAreaPixels || confirming}
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Check className="mr-2 h-5 w-5" aria-hidden />
          {confirming ? 'Aplicando...' : 'Aplicar recorte'}
        </button>
        <button
          type="button"
          onClick={handleResetView}
          disabled={confirming}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          Restablecer
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={confirming}
          className="min-h-12 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
