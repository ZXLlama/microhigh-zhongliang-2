import { clsx } from "clsx";

import type { ItemType } from "@/lib/types";

export function cn(...values: Array<string | number | false | null | undefined>) {
  return clsx(values);
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return "尚未同步";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortTime(value?: string): string {
  if (!value) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function itemKey(itemType: ItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function splitItemKey(key: string): { itemType: ItemType; itemId: string } {
  const [itemType, itemId] = key.split(":");

  if (itemType !== "product" && itemType !== "bundle") {
    throw new Error(`無效的項目 key: ${key}`);
  }

  return { itemType, itemId };
}

export function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function supportsFileSystemAccessApi(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export async function saveTextWithFileSystemApi(
  filename: string,
  content: string,
  mimeType: string,
) {
  type SaveFilePicker = (options: {
    suggestedName: string;
    types: Array<{
      accept: Record<string, string[]>;
      description: string;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (value: string) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;

  const picker = (window as Window & {
    showSaveFilePicker?: SaveFilePicker;
  }).showSaveFilePicker;

  if (!picker) {
    throw new Error("目前瀏覽器不支援 File System Access API");
  }

  const extension = filename.includes(".")
    ? `.${filename.split(".").at(-1)}`
    : ".txt";
  const handle = await picker({
    suggestedName: filename,
    types: [
      {
        description: mimeType,
        accept: {
          [mimeType]: [extension],
        },
      },
    ],
  });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}
