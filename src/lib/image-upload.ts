/**
 * Browser-side image upload for the admin: resize to at most 1920 px on the long
 * side and re-encode as WebP before sending, so stored images stay small.
 */

const MAX_SIDE = 1920;
const QUALITY = 0.82;

export interface UploadedImage {
  id: string;
  url: string;
}

export type UploadError = "type" | "too_large" | "failed";

async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) throw new Error("ENCODE_FAILED");
  return { blob, width, height };
}

export async function uploadImage(file: File, alt = ""): Promise<UploadedImage> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type))
    throw new Error("type" satisfies UploadError);
  // Animated GIFs would lose their animation in a canvas — upload them as they are.
  const { blob, width, height } =
    file.type === "image/gif" ? { blob: file as Blob, width: 0, height: 0 } : await toWebp(file);
  const params = new URLSearchParams({
    filename: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "image",
    alt,
    ...(width ? { width: String(width), height: String(height) } : {}),
  });
  const res = await fetch(`${import.meta.env.BASE_URL}api/admin/media?${params}`, {
    method: "POST",
    headers: { "Content-Type": blob.type },
    body: blob,
  });
  if (res.status === 413) throw new Error("too_large" satisfies UploadError);
  if (res.status === 415) throw new Error("type" satisfies UploadError);
  if (!res.ok) throw new Error("failed" satisfies UploadError);
  return (await res.json()) as UploadedImage;
}

export const UPLOAD_ERROR_TEXT: Record<UploadError, string> = {
  type: "Chỉ nhận ảnh JPG, PNG, WebP hoặc GIF.",
  too_large: "Ảnh quá lớn sau khi nén (tối đa khoảng 1,8 MB). Hãy chọn ảnh nhỏ hơn.",
  failed: "Chưa tải ảnh lên được. Kiểm tra kết nối rồi thử lại.",
};

export function uploadErrorText(error: unknown): string {
  const key = error instanceof Error ? (error.message as UploadError) : "failed";
  return UPLOAD_ERROR_TEXT[key] ?? UPLOAD_ERROR_TEXT.failed;
}
