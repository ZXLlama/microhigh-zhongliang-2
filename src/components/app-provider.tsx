"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  fetchHealth,
  fetchLatestSnapshot,
  syncCatalogToServer,
  uploadSyncBatch,
  validateCatalogImport,
} from "@/lib/api";
import { exportCatalogToCsv } from "@/lib/csv";
import { assertLocalState } from "@/lib/guards";
import { findBundle, findProduct } from "@/lib/sales";
import { createBundleSaleEvent, createProductSaleEvent } from "@/lib/sales";
import { createInitialLocalState, localStateReducer } from "@/lib/state";
import { parseBackupPayload, savePersistedState, loadPersistedState } from "@/lib/storage";
import { getNextSyncCandidate } from "@/lib/sync";
import type {
  CatalogImportPayload,
  CatalogValidationResult,
  ConfigSyncResponse,
  HealthResponse,
  LocalState,
} from "@/lib/types";
import {
  downloadTextFile,
  saveTextWithFileSystemApi,
  supportsFileSystemAccessApi,
} from "@/lib/utils";

type NoticeTone = "info" | "success" | "error";

interface Notice {
  tone: NoticeTone;
  message: string;
}

interface AppContextValue {
  state: LocalState;
  isHydrated: boolean;
  isOnline: boolean;
  isUploading: boolean;
  isRefreshingSnapshot: boolean;
  isSyncingCatalog: boolean;
  isCheckingHealth: boolean;
  health: HealthResponse | null;
  notice: Notice | null;
  dismissNotice: () => void;
  addProductSale: (productId: string) => void;
  addBundleSale: (bundleId: string) => void;
  undoLastSale: () => void;
  clearLocalSales: () => void;
  toggleFavorite: (key: string) => void;
  importCatalogCsv: (
    payload: CatalogImportPayload,
  ) => Promise<CatalogValidationResult>;
  syncCatalog: () => Promise<ConfigSyncResponse>;
  refreshSpreadsheetSnapshot: () => Promise<void>;
  uploadPendingSales: () => Promise<void>;
  exportCatalogCsvFiles: () => void;
  exportBackupJson: (preferFileSystemApi?: boolean) => Promise<void>;
  importBackupJson: (jsonText: string) => void;
  checkHealth: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function waitForRenderTurn() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    localStateReducer,
    undefined,
    () => createInitialLocalState("device_boot"),
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshingSnapshot, setIsRefreshingSnapshot] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const persisted = await loadPersistedState().catch(() => null);
      const nextState = persisted
        ? assertLocalState(persisted)
        : createInitialLocalState();

      if (!mounted) {
        return;
      }

      dispatch({
        type: "hydrate",
        payload: nextState,
      });
      setIsHydrated(true);
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void savePersistedState(state).catch(() => {
      setNotice({
        tone: "error",
        message: "本地儲存失敗，請先匯出 JSON 備份。",
      });
    });
  }, [isHydrated, state]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  function pushNotice(message: string, tone: NoticeTone = "info") {
    setNotice({ message, tone });
  }

  function dismissNotice() {
    setNotice(null);
  }

  function addProductSale(productId: string) {
    const product = findProduct(stateRef.current.catalog, productId);

    if (!product) {
      pushNotice("找不到商品資料", "error");
      return;
    }

    dispatch({
      type: "addSale",
      payload: createProductSaleEvent({ product }),
    });
    pushNotice(`已記錄 ${product.name}`, "success");
  }

  function addBundleSale(bundleId: string) {
    const bundle = findBundle(stateRef.current.catalog, bundleId);

    if (!bundle) {
      pushNotice("找不到組合包資料", "error");
      return;
    }

    dispatch({
      type: "addSale",
      payload: createBundleSaleEvent({
        bundle,
        catalog: stateRef.current.catalog,
      }),
    });
    pushNotice(`已記錄 ${bundle.bundleName}`, "success");
  }

  function undoLastSale() {
    dispatch({ type: "undoLastSale" });
    pushNotice("已撤銷最後一筆本地操作", "info");
  }

  function clearLocalSales() {
    dispatch({ type: "clearSales" });
    pushNotice("本地當日資料已清除", "info");
  }

  function toggleFavorite(key: string) {
    dispatch({
      type: "toggleFavorite",
      payload: key,
    });
  }

  async function importCatalogCsv(
    payload: CatalogImportPayload,
  ): Promise<CatalogValidationResult> {
    const result = await validateCatalogImport(payload);

    if (!result.catalog) {
      pushNotice("CSV 驗證失敗，請先修正錯誤列", "error");
      return result;
    }

    dispatch({
      type: "replaceCatalog",
      payload: result.catalog,
    });
    pushNotice("商品與組合包設定已套用到本地", "success");

    return result;
  }

  async function syncCatalog(): Promise<ConfigSyncResponse> {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法同步設定到試算表");
    }

    setIsSyncingCatalog(true);
    dispatch({ type: "setSyncing" });

    try {
      const result = await syncCatalogToServer(stateRef.current.catalog);
      dispatch({
        type: "setSyncSuccess",
        payload: { now: new Date().toISOString() },
      });
      pushNotice(result.message, "success");
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "設定同步失敗";
      dispatch({
        type: "setSyncError",
        payload: { error: message },
      });
      pushNotice(message, "error");
      throw error;
    } finally {
      setIsSyncingCatalog(false);
    }
  }

  async function refreshSpreadsheetSnapshot() {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法抓取試算表資料");
    }

    setIsRefreshingSnapshot(true);
    dispatch({ type: "setSyncing" });

    try {
      const response = await fetchLatestSnapshot();
      dispatch({
        type: "replaceSnapshot",
        payload: response.snapshot,
      });
      dispatch({
        type: "setSyncSuccess",
        payload: { now: new Date().toISOString() },
      });
      pushNotice("已更新試算表累計資料", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "抓取試算表資料失敗";
      dispatch({
        type: "setSyncError",
        payload: { error: message },
      });
      pushNotice(message, "error");
      throw error;
    } finally {
      setIsRefreshingSnapshot(false);
    }
  }

  async function uploadPendingSales() {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法上傳營業額");
    }

    if (isUploading) {
      return;
    }

    setIsUploading(true);
    let processedCount = 0;

    try {
      while (true) {
        const currentState = stateRef.current;
        const candidate = getNextSyncCandidate(currentState);

        if (!candidate) {
          break;
        }

        if (!currentState.outbox.some((batch) => batch.batchId === candidate.batchId)) {
          dispatch({
            type: "prepareBatch",
            payload: candidate,
          });
        }

        const uploadNow = new Date().toISOString();
        dispatch({
          type: "setBatchUploading",
          payload: {
            batchId: candidate.batchId,
            now: uploadNow,
          },
        });

        try {
          const response = await uploadSyncBatch(candidate);
          dispatch({
            type: "completeBatch",
            payload: {
              batchId: candidate.batchId,
              now: new Date().toISOString(),
              snapshot: response.snapshot,
            },
          });
          processedCount += 1;
          await waitForRenderTurn();
        } catch (error) {
          const message = error instanceof Error ? error.message : "同步上傳失敗";
          dispatch({
            type: "setBatchFailed",
            payload: {
              batchId: candidate.batchId,
              now: new Date().toISOString(),
              error: message,
            },
          });
          pushNotice(message, "error");
          throw error;
        }
      }

      if (processedCount === 0) {
        pushNotice("目前沒有待上傳的本地資料", "info");
        return;
      }

      pushNotice("本地資料已上傳，且同步後已重置本地記錄", "success");
    } finally {
      setIsUploading(false);
    }
  }

  function exportCatalogCsvFiles() {
    const csvBundle = exportCatalogToCsv(stateRef.current.catalog);
    downloadTextFile("products.csv", csvBundle.productsCsv, "text/csv;charset=utf-8");
    downloadTextFile("bundles.csv", csvBundle.bundlesCsv, "text/csv;charset=utf-8");
    downloadTextFile(
      "bundle_components.csv",
      csvBundle.bundleComponentsCsv,
      "text/csv;charset=utf-8",
    );
    pushNotice("已匯出三份 CSV 設定檔", "success");
  }

  async function exportBackupJson(preferFileSystemApi = false) {
    const filename = `microhigh-zhongliang-2-backup-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`;
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        state: stateRef.current,
      },
      null,
      2,
    );

    if (preferFileSystemApi && supportsFileSystemAccessApi()) {
      await saveTextWithFileSystemApi(filename, payload, "application/json");
      pushNotice("已透過 File System Access API 儲存備份檔", "success");
      return;
    }

    downloadTextFile(filename, payload, "application/json;charset=utf-8");
    pushNotice("已下載 JSON 備份檔", "success");
  }

  function importBackupJson(jsonText: string) {
    const backup = parseBackupPayload(jsonText);
    dispatch({
      type: "hydrate",
      payload: backup.state,
    });
    pushNotice("已從 JSON 備份還原本地資料", "success");
  }

  async function checkHealth() {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法檢查連線狀態");
    }

    setIsCheckingHealth(true);

    try {
      const response = await fetchHealth();
      setHealth(response);
      pushNotice(
        response.gasConfigured ? "Vercel API 與 GAS 設定正常" : "GAS_WEBAPP_URL 尚未設定",
        response.gasConfigured ? "success" : "error",
      );
    } finally {
      setIsCheckingHealth(false);
    }
  }

  const value: AppContextValue = {
    state,
    isHydrated,
    isOnline,
    isUploading,
    isRefreshingSnapshot,
    isSyncingCatalog,
    isCheckingHealth,
    health,
    notice,
    dismissNotice,
    addProductSale,
    addBundleSale,
    undoLastSale,
    clearLocalSales,
    toggleFavorite,
    importCatalogCsv,
    syncCatalog,
    refreshSpreadsheetSnapshot,
    uploadPendingSales,
    exportCatalogCsvFiles,
    exportBackupJson,
    importBackupJson,
    checkHealth,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function usePosApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("usePosApp 必須在 AppProvider 內使用");
  }

  return context;
}
