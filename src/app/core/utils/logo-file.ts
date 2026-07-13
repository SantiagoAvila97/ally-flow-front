/** Valida y lee un archivo de imagen cuadrada 1:1 → data URL. */
export function readSquareLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      reject(new Error('Solo PNG, JPG o WEBP'));
      return;
    }
    if (file.size > 800_000) {
      reject(new Error('El logo debe pesar menos de 800KB'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.naturalWidth !== img.naturalHeight) {
        reject(
          new Error(
            `El logo debe ser cuadrado (1:1). Recibido ${img.naturalWidth}×${img.naturalHeight}`,
          ),
        );
        return;
      }
      if (img.naturalWidth < 64 || img.naturalWidth > 2048) {
        reject(new Error('El logo debe medir entre 64px y 2048px por lado'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? '');
        if (!result.startsWith('data:image/')) {
          reject(new Error('No se pudo leer la imagen'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagen inválida'));
    };
    img.src = url;
  });
}
