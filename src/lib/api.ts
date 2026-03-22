import { assertCatalog, assertSpreadsheetSnapshot } from "@/lib/guards";
import type {
  Catalog,
  CatalogImportPayload,
  CatalogValidationResult,
  ConfigSyncResponse,
  HealthResponse,
  LatestSnapshotResponse,
  UploadBatchResponse,
  SyncBatch,
} from "@/lib/types";

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: string; message?: string })
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.toString() ||
        payload?.message?.toString() ||
        `請求失敗 (${response.status})`,
    );
  }

  if (!payload) {
    throw new Error("API 回傳的不是有效 JSON");
  }

  return payload as T;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return readJsonResponse<HealthResponse>(
    await fetch("/api/health", {
      cache: "no-store",
    }),
  );
}

export async function uploadSyncBatch(batch: SyncBatch): Promise<UploadBatchResponse> {
  const response = await readJsonResponse<UploadBatchResponse>(
    await fetch("/api/sync/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ batch }),
    }),
  );

  assertSpreadsheetSnapshot(response.snapshot);
  return response;
}

export async function fetchLatestSnapshot(): Promise<LatestSnapshotResponse> {
  const response = await readJsonResponse<LatestSnapshotResponse>(
    await fetch("/api/sync/latest", {
      cache: "no-store",
    }),
  );

  assertSpreadsheetSnapshot(response.snapshot);
  return response;
}

export async function validateCatalogImport(
  payload: CatalogImportPayload,
): Promise<CatalogValidationResult> {
  const response = await readJsonResponse<CatalogValidationResult>(
    await fetch("/api/config/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
  );

  if (response.catalog) {
    assertCatalog(response.catalog);
  }

  return response;
}

export async function syncCatalogToServer(
  catalog: Catalog,
): Promise<ConfigSyncResponse> {
  assertCatalog(catalog);

  return readJsonResponse<ConfigSyncResponse>(
    await fetch("/api/config/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ catalog }),
    }),
  );
}
