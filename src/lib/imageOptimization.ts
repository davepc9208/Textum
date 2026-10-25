const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const WEBP_QUALITIES = [0.82, 0.72, 0.62];

interface ImageOptimizationOptions {
  maxDimension?: number;
  maxBytes?: number;
}

export async function optimizeImage(
  file: File,
  { maxDimension = 1800, maxBytes = 2 * 1024 * 1024 }: ImageOptimizationOptions = {},
): Promise<File> {
  const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!supportedTypes.has(file.type)) {
    throw new Error('Formato no compatible. Usa una imagen JPG, PNG o WebP.');
  }
  if (file.size === 0) throw new Error('El archivo de imagen está vacío.');
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('La imagen original supera 25 MB. Elige un archivo más pequeño.');
  }
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Este navegador no permite procesar imágenes automáticamente. Prueba con una versión actualizada.');
  }

  let bitmap: ImageBitmap | undefined;
  const canvas = document.createElement('canvas');
  try {
    bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height) throw new Error('No se pudieron leer las dimensiones de la imagen.');

    const sourceDimension = Math.max(bitmap.width, bitmap.height);
    const needsResize = sourceDimension > maxDimension;
    if (file.type === 'image/webp' && file.size <= maxBytes && !needsResize) return file;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo preparar la imagen en este navegador.');

    const dimensions = [Math.min(maxDimension, sourceDimension)];
    while (dimensions[dimensions.length - 1] > 480) {
      const next = Math.max(480, Math.round(dimensions[dimensions.length - 1] * 0.8));
      if (next === dimensions[dimensions.length - 1]) break;
      dimensions.push(next);
    }

    for (const dimension of dimensions) {
      const scale = Math.min(1, dimension / sourceDimension);
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of WEBP_QUALITIES) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (!blob || blob.type !== 'image/webp') {
          throw new Error('El navegador no pudo convertir la imagen a WebP. Prueba con Chrome, Edge o Firefox actualizado.');
        }
        if (blob.size <= maxBytes && (needsResize || file.size > maxBytes || blob.size < file.size)) {
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagen';
          return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
        }
        if (blob.size >= file.size && !needsResize && file.size <= maxBytes) return file;
      }
    }

    throw new Error(`No se pudo reducir la imagen por debajo de ${(maxBytes / 1024).toFixed(0)} KB. Prueba con otra imagen de menor resolución.`);
  } catch (error) {
    if (error instanceof Error && error.message) throw error;
    throw new Error('No se pudo procesar la imagen. Comprueba que el archivo no esté dañado.');
  } finally {
    bitmap?.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}
