type StoredMedia = {
  bytes: ArrayBuffer;
  type: string;
  objectUrl?: string;
};

const files = new Map<string, StoredMedia>();

function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export function registerMockMedia(name: string, bytes: Uint8Array, type: string): string {
  const path = `/media/${name}`;
  const buffer = copyBuffer(bytes);
  let objectUrl: string | undefined;
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" && typeof Blob !== "undefined") {
    objectUrl = URL.createObjectURL(new Blob([buffer], { type }));
  }
  const previous = files.get(path);
  if (previous?.objectUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(previous.objectUrl);
  }
  files.set(path, { bytes: buffer, type, objectUrl });
  return path;
}

export function mockMediaObjectUrl(path: string): string | undefined {
  return files.get(path)?.objectUrl;
}

export function readMockMedia(path: string): { bytes: ArrayBuffer; type: string } | undefined {
  const stored = files.get(path);
  if (!stored) return undefined;
  return { bytes: stored.bytes, type: stored.type };
}

export function clearMockMedia(): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    for (const stored of files.values()) {
      if (stored.objectUrl) URL.revokeObjectURL(stored.objectUrl);
    }
  }
  files.clear();
}
