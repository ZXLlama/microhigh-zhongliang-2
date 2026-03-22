import { APP_NAME, LOCAL_SCHEMA_VERSION } from "@/lib/constants";
import { createCatalog } from "@/lib/config";
import { createNextSession } from "@/lib/sales";
import {
  SAMPLE_BUNDLE_COMPONENTS,
  SAMPLE_BUNDLES,
  SAMPLE_PRODUCTS,
} from "@/lib/sample-data";
import type {
  Catalog,
  LocalState,
  SaleEvent,
  SpreadsheetSnapshot,
  SyncBatch,
} from "@/lib/types";
import { createId } from "@/lib/utils";

export type LocalStateAction =
  | { type: "hydrate"; payload: LocalState }
  | { type: "replaceCatalog"; payload: Catalog }
  | { type: "addSale"; payload: SaleEvent }
  | { type: "addSales"; payload: SaleEvent[] }
  | { type: "undoLastSale" }
  | { type: "prepareBatch"; payload: SyncBatch }
  | { type: "setBatchUploading"; payload: { batchId: string; now: string } }
  | {
      type: "setBatchFailed";
      payload: { batchId: string; now: string; error: string };
    }
  | {
      type: "completeBatch";
      payload: { batchId: string; now: string; snapshot: SpreadsheetSnapshot };
    }
  | { type: "replaceSnapshot"; payload: SpreadsheetSnapshot }
  | { type: "setSyncing"; payload?: { batchId?: string } }
  | { type: "setSyncError"; payload: { error: string } }
  | { type: "setSyncSuccess"; payload?: { now?: string; batchId?: string } }
  | { type: "clearSales"; payload?: { now?: string } };

function createDefaultCatalog(now: string): Catalog {
  return createCatalog({
    products: SAMPLE_PRODUCTS,
    bundles: SAMPLE_BUNDLES,
    bundleComponents: SAMPLE_BUNDLE_COMPONENTS,
    source: "sample",
    now,
  });
}

export function createInitialLocalState(
  deviceId = createId("device"),
  now = new Date().toISOString(),
): LocalState {
  const catalog = createDefaultCatalog(now);

  return {
    schemaVersion: LOCAL_SCHEMA_VERSION,
    appName: APP_NAME,
    deviceId,
    catalog,
    sales: [],
    outbox: [],
    favorites: [],
    recentItemKeys: [],
    syncInfo: {
      status: "idle",
    },
    spreadsheetSnapshot: null,
    currentSession: createNextSession(deviceId, now),
    lastUndoSaleIds: [],
  };
}

function getLegacyUndoIds(rawState: Partial<LocalState> & { lastUndoSaleId?: unknown }) {
  if (Array.isArray(rawState.lastUndoSaleIds)) {
    return rawState.lastUndoSaleIds.filter((value): value is string => typeof value === "string");
  }

  if (typeof rawState.lastUndoSaleId === "string") {
    return [rawState.lastUndoSaleId];
  }

  return [];
}

export function normalizeLoadedState(rawState: LocalState): LocalState {
  const now = new Date().toISOString();
  const fallback = createInitialLocalState(rawState.deviceId, now);
  let catalog = fallback.catalog;

  if (rawState.catalog) {
    const rebuiltCatalog = createCatalog({
      products: rawState.catalog.products ?? [],
      bundles: rawState.catalog.bundles ?? [],
      bundleComponents: rawState.catalog.bundleComponents ?? [],
      source: rawState.catalog.metadata?.source ?? "backup",
      now: rawState.catalog.metadata?.lastImportedAt ?? now,
    });
    catalog = {
      ...rebuiltCatalog,
      metadata: {
        ...rebuiltCatalog.metadata,
        versionId:
          rawState.catalog.metadata?.versionId ?? rebuiltCatalog.metadata.versionId,
      },
    };
  }

  return {
    ...fallback,
    ...rawState,
    schemaVersion: LOCAL_SCHEMA_VERSION,
    appName: APP_NAME,
    catalog,
    sales: Array.isArray(rawState.sales) ? rawState.sales : [],
    outbox: Array.isArray(rawState.outbox) ? rawState.outbox : [],
    favorites: Array.isArray(rawState.favorites) ? rawState.favorites : [],
    recentItemKeys: Array.isArray(rawState.recentItemKeys)
      ? rawState.recentItemKeys
      : [],
    syncInfo: {
      ...fallback.syncInfo,
      ...rawState.syncInfo,
    },
    currentSession: rawState.currentSession
      ? {
          ...rawState.currentSession,
          deviceId: rawState.deviceId || fallback.deviceId,
        }
      : fallback.currentSession,
    spreadsheetSnapshot: rawState.spreadsheetSnapshot ?? null,
    lastUndoSaleIds: getLegacyUndoIds(rawState),
  };
}

function pendingStatusForState(state: LocalState): "idle" | "unsynced" {
  return state.sales.length > 0 || state.outbox.length > 0 ? "unsynced" : "idle";
}

function applyAddedSales(state: LocalState, sales: SaleEvent[]): LocalState {
  if (sales.length === 0) {
    return state;
  }

  const updatedSales = [...state.sales, ...sales];
  const lastTimestamp = sales.at(-1)?.timestamp ?? state.currentSession.lastUpdatedAt;

  return {
    ...state,
    sales: updatedSales,
    lastUndoSaleIds: sales.map((sale) => sale.id),
    currentSession: {
      ...state.currentSession,
      lastUpdatedAt: lastTimestamp,
    },
    syncInfo: {
      ...state.syncInfo,
      status: "unsynced",
      lastError: undefined,
    },
  };
}

export function localStateReducer(
  state: LocalState,
  action: LocalStateAction,
): LocalState {
  switch (action.type) {
    case "hydrate":
      return normalizeLoadedState(action.payload);
    case "replaceCatalog":
      return {
        ...state,
        catalog: action.payload,
      };
    case "addSale":
      return applyAddedSales(state, [action.payload]);
    case "addSales":
      return applyAddedSales(state, action.payload);
    case "undoLastSale": {
      if (state.outbox.length > 0 || state.lastUndoSaleIds.length === 0) {
        return state;
      }

      const removableIds = new Set(
        state.lastUndoSaleIds.filter((saleId) =>
          state.sales.some((sale) => sale.id === saleId && sale.syncState === "pending"),
        ),
      );

      if (removableIds.size === 0) {
        return state;
      }

      const nextSales = state.sales.filter((sale) => !removableIds.has(sale.id));

      return {
        ...state,
        sales: nextSales,
        lastUndoSaleIds: [],
        syncInfo: {
          ...state.syncInfo,
          status: pendingStatusForState({
            ...state,
            sales: nextSales,
            outbox: state.outbox,
          }),
        },
      };
    }
    case "prepareBatch": {
      if (state.outbox.some((batch) => batch.batchId === action.payload.batchId)) {
        return state;
      }

      const saleIds = new Set(action.payload.saleIds);

      return {
        ...state,
        sales: state.sales.map((sale) =>
          saleIds.has(sale.id) ? { ...sale, syncState: "in_flight" } : sale,
        ),
        outbox: [...state.outbox, action.payload],
        lastUndoSaleIds: [],
        syncInfo: {
          ...state.syncInfo,
          status: "syncing",
          inFlightBatchId: action.payload.batchId,
          lastError: undefined,
        },
      };
    }
    case "setBatchUploading":
      return {
        ...state,
        outbox: state.outbox.map((batch) =>
          batch.batchId === action.payload.batchId
            ? {
                ...batch,
                status: "uploading",
                attempts: batch.attempts + 1,
                lastAttemptAt: action.payload.now,
                lastError: undefined,
              }
            : batch,
        ),
        syncInfo: {
          ...state.syncInfo,
          status: "syncing",
          inFlightBatchId: action.payload.batchId,
          lastError: undefined,
        },
      };
    case "setBatchFailed":
      return {
        ...state,
        outbox: state.outbox.map((batch) =>
          batch.batchId === action.payload.batchId
            ? {
                ...batch,
                status: "failed",
                lastAttemptAt: action.payload.now,
                lastError: action.payload.error,
              }
            : batch,
        ),
        syncInfo: {
          ...state.syncInfo,
          status: "error",
          lastError: action.payload.error,
          inFlightBatchId: action.payload.batchId,
        },
      };
    case "completeBatch": {
      const completedBatch = state.outbox.find(
        (batch) => batch.batchId === action.payload.batchId,
      );
      const saleIds = new Set(completedBatch?.saleIds ?? []);
      const remainingOutbox = state.outbox.filter(
        (batch) => batch.batchId !== action.payload.batchId,
      );
      const remainingSales = state.sales.filter((sale) => !saleIds.has(sale.id));
      const shouldReset = remainingOutbox.length === 0 && remainingSales.length === 0;

      return {
        ...state,
        sales: remainingSales,
        outbox: remainingOutbox,
        spreadsheetSnapshot: action.payload.snapshot,
        currentSession: shouldReset
          ? createNextSession(state.deviceId, action.payload.now)
          : {
              ...state.currentSession,
              lastUpdatedAt: action.payload.now,
            },
        lastUndoSaleIds: state.lastUndoSaleIds.filter((saleId) =>
          remainingSales.some((sale) => sale.id === saleId),
        ),
        syncInfo: {
          ...state.syncInfo,
          status: shouldReset ? "reset" : "unsynced",
          lastSyncAt: action.payload.now,
          lastResetAt: shouldReset ? action.payload.now : state.syncInfo.lastResetAt,
          lastSuccessBatchId: action.payload.batchId,
          lastError: undefined,
          inFlightBatchId: undefined,
        },
      };
    }
    case "replaceSnapshot":
      return {
        ...state,
        spreadsheetSnapshot: action.payload,
      };
    case "setSyncing":
      return {
        ...state,
        syncInfo: {
          ...state.syncInfo,
          status: "syncing",
          inFlightBatchId: action.payload?.batchId,
          lastError: undefined,
        },
      };
    case "setSyncError":
      return {
        ...state,
        syncInfo: {
          ...state.syncInfo,
          status: "error",
          lastError: action.payload.error,
        },
      };
    case "setSyncSuccess":
      return {
        ...state,
        syncInfo: {
          ...state.syncInfo,
          status: "success",
          lastSyncAt: action.payload?.now ?? new Date().toISOString(),
          lastSuccessBatchId:
            action.payload?.batchId ?? state.syncInfo.lastSuccessBatchId,
          lastError: undefined,
          inFlightBatchId: undefined,
        },
      };
    case "clearSales": {
      const now = action.payload?.now ?? new Date().toISOString();

      return {
        ...state,
        sales: [],
        outbox: [],
        syncInfo: {
          ...state.syncInfo,
          status: "reset",
          lastResetAt: now,
          lastError: undefined,
          inFlightBatchId: undefined,
        },
        currentSession: createNextSession(state.deviceId, now),
        lastUndoSaleIds: [],
      };
    }
    default:
      return state;
  }
}
