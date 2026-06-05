export type ImageUploadProfile = "avatar" | "banner";

type PreparedImage = { base64: string; mime: string };

const PROFILES = {
  avatar: { maxWidth: 800, maxHeight: 800, maxBytes: 450 * 1024 },
  banner: { maxWidth: 1600, maxHeight: 540, maxBytes: 900 * 1024 },
} as const;

const MAX_INPUT_BYTES = 20 * 1024 * 1024;

function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
) {
  let w = width;
  let h = height;
  const ratio = w / h;
  if (w > maxWidth) {
    w = maxWidth;
    h = w / ratio;
  }
  if (h > maxHeight) {
    h = maxHeight;
    w = h * ratio;
  }
  return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid_image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function prepareImageForUpload(
  file: File,
  profile: ImageUploadProfile
): Promise<{ ok: true; data: PreparedImage } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Selecione um arquivo de imagem (JPG, PNG ou WebP)." };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, error: "Imagem muito grande. Use um arquivo de até 20 MB." };
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, error: "Não foi possível ler a imagem. Tente outro arquivo." };
  }

  const cfg = PROFILES[profile];
  let { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, cfg.maxWidth, cfg.maxHeight);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { ok: false, error: "Seu navegador não suporta processamento de imagem." };
  }

  let quality = 0.9;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    blob = await canvasToBlob(canvas, quality);

    if (blob && blob.size <= cfg.maxBytes) break;

    if (quality > 0.5) {
      quality -= 0.07;
    } else {
      width = Math.max(320, Math.round(width * 0.85));
      height = Math.max(120, Math.round(height * 0.85));
      quality = 0.82;
    }
  }

  if (!blob || blob.size > cfg.maxBytes) {
    return { ok: false, error: "Não foi possível otimizar a imagem. Tente outra foto." };
  }

  const base64 = await blobToDataUrl(blob);
  return { ok: true, data: { base64, mime: "image/jpeg" } };
}
