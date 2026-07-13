/** Límite de archivo original (teléfonos suelen pesar más). */
export const EVIDENCE_MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Límite del dataURL resultante enviado a la API. */
export const EVIDENCE_MAX_DATA_URL_CHARS = 2_200_000;
const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Valida y comprime una foto de evidencia a dataURL (JPEG).
 * Solo archivos de imagen locales — no URLs.
 */
export async function prepareEvidencePhoto(file: File): Promise<string> {
  if (!file) {
    throw new Error('No se seleccionó ninguna foto');
  }
  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
    throw new Error('Solo se permiten fotos PNG, JPEG o WebP');
  }
  if (file.size <= 0) {
    throw new Error('El archivo de foto está vacío o no se pudo leer');
  }
  if (file.size > EVIDENCE_MAX_FILE_BYTES) {
    throw new Error('La foto supera 8MB. Elige una más liviana o baja la resolución');
  }

  const bitmap = await loadImage(file);
  try {
    const { width, height } = fitInside(bitmap.naturalWidth, bitmap.naturalHeight, MAX_EDGE_PX);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo procesar la foto en este dispositivo');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    let dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    if (dataUrl.length > EVIDENCE_MAX_DATA_URL_CHARS) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    }
    if (dataUrl.length > EVIDENCE_MAX_DATA_URL_CHARS) {
      throw new Error('La foto sigue siendo muy pesada tras comprimir. Prueba otra imagen');
    }
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('No se pudo convertir la foto');
    }
    return dataUrl;
  } finally {
    bitmap.src = '';
  }
}

function fitInside(w: number, h: number, maxEdge: number): { width: number; height: number } {
  if (w <= 0 || h <= 0) {
    throw new Error('Dimensiones de imagen inválidas');
  }
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la foto. El archivo puede estar dañado'));
    };
    img.src = url;
  });
}
