export type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Recorta la imagen según el área seleccionada y la opcionalmente redimensiona.
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  outputMaxSize = 1024
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo crear el contexto del canvas');
  }

  const scale = Math.min(1, outputMaxSize / Math.max(pixelCrop.width, pixelCrop.height));
  const outputWidth = Math.round(pixelCrop.width * scale);
  const outputHeight = Math.round(pixelCrop.height * scale);

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Error al generar la imagen recortada'));
      },
      'image/jpeg',
      0.92
    );
  });

  const baseName = fileName.replace(/\.[^.]+$/, '') || 'imagen';
  return new File([blob], `${baseName}-editada.jpg`, { type: 'image/jpeg' });
}
