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
import { formatMoney } from "@/lib/money";
import { buildCheckoutPreview, createSaleEventsFromCart } from "@/lib/sales";
import { createInitialLocalState, localStateReducer } from "@/lib/state";
import { loadPersistedState, parseBackupPayload, savePersistedState } from "@/lib/storage";
import { getNextSyncCandidate } from "@/lib/sync";
import type {
  CatalogImportPayload,
  CatalogValidationResult,
  CheckoutCartItem,
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
  checkoutCart: (items: CheckoutCartItem[]) => boolean;
  undoLastSale: () => void;
  clearLocalSales: () => void;
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
        message: "本地資料寫入失敗，請先匯出 JSON 備份。",
      });
    });
  }, [isHydrated, state]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker
      .register("/sw.js", {
        updateViaCache: "none",
      })
      .then((registration) => registration.update())
      .catch(() => undefined);
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

  function checkoutCart(items: CheckoutCartItem[]): boolean {
    const filteredItems = items.filter((item) => item.quantity > 0);

    if (filteredItems.length === 0) {
      pushNotice("購物車是空的，請先加入商品。", "error");
      return false;
    }

    try {
      const sales = createSaleEventsFromCart(stateRef.current.catalog, filteredItems);
      const preview = buildCheckoutPreview(stateRef.current.catalog, filteredItems);

      dispatch({
        type: "addSales",
        payload: sales,
      });

      pushNotice(
        `本輪已累加 ${preview.summary.totalQuantity} 件，小計 ${formatMoney(
          preview.summary.revenueCents,
        )}`,
        "success",
      );
      return true;
    } catch (error) {
      pushNotice(
        error instanceof Error ? error.message : "收銀失敗，請重新確認購物車內容。",
        "error",
      );
      return false;
    }
  }

  function undoLastSale() {
    dispatch({ type: "undoLastSale" });
    pushNotice("已撤銷上一輪收銀。", "info");
  }

  function clearLocalSales() {
    dispatch({ type: "clearSales" });
    pushNotice("今日本地銷售資料已清空。", "info");
  }

  async function importCatalogCsv(
    payload: CatalogImportPayload,
  ): Promise<CatalogValidationResult> {
    const result = await validateCatalogImport(payload);

    if (!result.catalog) {
      pushNotice("CSV 驗證失敗，請先修正錯誤列。", "error");
      return result;
    }

    dispatch({
      type: "replaceCatalog",
      payload: result.catalog,
    });
    pushNotice("商品與組合包設定已更新到本地。", "success");

    return result;
  }

  async function syncCatalog(): Promise<ConfigSyncResponse> {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法同步商品設定到試算表。");
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
      const message = error instanceof Error ? error.message : "商品設定同步失敗";
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
      throw new Error("目前離線，無法重新抓取試算表資料。");
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
      pushNotice("已重新抓取最新試算表資料。", "success");
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
      throw new Error("目前離線，無法上傳營業額。");
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
          const message = error instanceof Error ? error.message : "上傳營業額失敗";
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
        pushNotice("目前沒有待上傳的本地銷售資料。", "info");
        return;
      }

      pushNotice("本地銷售已成功上傳，並已更新最新試算表結果。", "success");
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
    pushNotice("已匯出商品設定 CSV。", "success");
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
      pushNotice("已使用 File System Access API 匯出備份。", "success");
      return;
    }

    downloadTextFile(filename, payload, "application/json;charset=utf-8");
    pushNotice("已下載 JSON 備份。", "success");
  }

  function importBackupJson(jsonText: string) {
    const backup = parseBackupPayload(jsonText);
    dispatch({
      type: "hydrate",
      payload: backup.state,
    });
    pushNotice("JSON 備份已匯入完成。", "success");
  }

  async function checkHealth() {
    if (!navigator.onLine) {
      throw new Error("目前離線，無法檢查 API 狀態。");
    }

    setIsCheckingHealth(true);

    try {
      const response = await fetchHealth();
      setHealth(response);
      pushNotice(
        response.gasConfigured ? "Vercel API 已成功連到 GAS。" : "尚未設定 GAS_WEBAPP_URL。",
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
    checkoutCart,
    undoLastSale,
    clearLocalSales,
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
    throw new Error("usePosApp 必須放在 AppProvider 內使用");
  }

  return context;
}
