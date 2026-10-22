export const maxProductImageBytes = 5 * 1024 * 1024;

/** Multipart part name on POST /v1/products/{productId}/images. */
export const productImageField = "file";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function productImagePath(productId: string): string {
  return `/v1/products/${encodeURIComponent(productId)}/images`;
}

/** Message for a rejected `file` part, or null when the file can be stored. */
export function productImageRejection(file: File | null): string | null {
  if (!file) return "Choose an image file.";
  if (file.size <= 0) return "Image file is empty.";
  if (file.size > maxProductImageBytes) return "Image file must be 5 MB or smaller.";
  if (!imageTypes.has(file.type)) return "Use a JPEG, PNG, WebP, or GIF.";
  return null;
}
