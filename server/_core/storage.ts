import { getSupabaseAdmin } from "./supabaseAdmin";

export async function uploadImage(
  bucket: string,
  path: string,
  base64: string,
  mime?: string
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const ext = mime?.includes("png") ? "png" : mime?.includes("webp") ? "webp" : "jpg";
  const fullPath = path.includes(".") ? path : `${path}.${ext}`;
  const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  const { error } = await admin.storage.from(bucket).upload(fullPath, buffer, {
    contentType: mime || "image/jpeg",
    upsert: true,
  });
  if (error) {
    console.warn(`[Storage upload ${bucket}]`, error.message);
    return null;
  }
  const { data } = admin.storage.from(bucket).getPublicUrl(fullPath);
  return data.publicUrl;
}

const FILE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
};

export function materialKind(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  return "imagem";
}

/** Arquivo público de material (imagem, PDF ou MP4). Usa o bucket que já recebe uploads. */
export async function uploadPublicFile(
  path: string,
  base64: string,
  mime: string
): Promise<string | null> {
  const ext = FILE_EXT[mime];
  if (!ext) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (buffer.length > 8 * 1024 * 1024) return null;
  const fullPath = `${path}.${ext}`;
  const { error } = await admin.storage.from("avatars").upload(fullPath, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) {
    console.warn("[Storage upload materials]", error.message);
    return null;
  }
  const { data } = admin.storage.from("avatars").getPublicUrl(fullPath);
  return data.publicUrl;
}
