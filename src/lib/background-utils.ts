export const MAX_BACKGROUND_IMAGE_BYTES = 1_500_000;

export const VALID_BACKGROUND_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type BackgroundImageReadResult =
  | { ok: true; dataUrl: string; mimeType: (typeof VALID_BACKGROUND_IMAGE_MIME_TYPES)[number] }
  | { ok: false; code: "unsupported-type" | "file-too-large" | "read-failed" };

function isValidBackgroundImageMimeType(mimeType: string): mimeType is (typeof VALID_BACKGROUND_IMAGE_MIME_TYPES)[number] {
  return (VALID_BACKGROUND_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader is unavailable"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("FileReader returned a non-string result"));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

function verifyImageDecodes(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new Error("Image is unavailable"));
      return;
    }

    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.src = dataUrl;
  });
}

export async function readBackgroundImage(file: File): Promise<BackgroundImageReadResult> {
  if (!isValidBackgroundImageMimeType(file.type)) {
    return { ok: false, code: "unsupported-type" };
  }

  if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
    return { ok: false, code: "file-too-large" };
  }

  try {
    const dataUrl = await readAsDataUrl(file);
    await verifyImageDecodes(dataUrl);
    return { ok: true, dataUrl, mimeType: file.type };
  } catch {
    return { ok: false, code: "read-failed" };
  }
}
