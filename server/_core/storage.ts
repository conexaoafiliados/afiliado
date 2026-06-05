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
