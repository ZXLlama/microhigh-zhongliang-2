"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  CloudUpload,
  Database,
  ShoppingCart,
  Trash2,
  Undo2,
  WifiOff,
} from "lucide-react";

import { usePosApp } from "@/components/app-provider";
import { BundlesSection } from "@/components/sections/bundles-section";
import { CashierSection } from "@/components/sections/cashier-section";
import { ProductsSection } from "@/components/sections/products-section";
import { SpreadsheetSection } from "@/components/sections/spreadsheet-section";
import { SyncSection } from "@/components/sections/sync-section";
import { TodaySection } from "@/components/sections/today-section";
import {
  ConfirmDialog,
  LoadingShell,
  MetricCard,
  StatusPill,
  toneClass,
} from "@/components/ui/shell-ui";
import { TAB_ITEMS, type TabId } from "@/lib/constants";
import { getBundleComponentsMap, getProductMap } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import {
  buildBundleSummaries,
  buildProductSummaries,
  summarizeSales,
} from "@/lib/sales";
import type { CsvImportIssue } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type ItemFilter = "all" | "product" | "bundle";

type CsvFileMap = {
  products: File | null;
  bundles: File | null;
  bundleComponents: File | null;
};

const EMPTY_FILES: CsvFileMap = {
  products: null,
  bundles: null,
  bundleComponents: null,
};

async function fileToText(file: File | null): Promise<string> {
  if (!file) {
    throw new Error("請先選擇完整的 CSV 檔案");
  }

  return file.text();
}

export function AppShell() {
  const {
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
  } = usePosApp();

  const [activeTab, setActiveTab] = useState<TabId>("cashier");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [csvFiles, setCsvFiles] = useState<CsvFileMap>(EMPTY_FILES);
  const [importIssues, setImportIssues] = useState<CsvImportIssue[]>([]);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"undo" | "clear" | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const localSummary = useMemo(() => summarizeSales(state.sales), [state.sales]);
  const localProductRows = useMemo(
    () => buildProductSummaries(state.catalog, state.sales),
    [state.catalog, state.sales],
  );
  const localBundleRows = useMemo(
    () => buildBundleSummaries(state.catalog, state.sales),
    [state.catalog, state.sales],
  );
  const productMap = useMemo(() => getProductMap(state.catalog), [state.catalog]);
  const bundleComponentsMap = useMemo(
    () => getBundleComponentsMap(state.catalog),
    [state.catalog],
  );
  const categories = useMemo(
    () =>
      ["all", ...new Set(state.catalog.products.map((product) => product.category).filter(Boolean))],
    [state.catalog.products],
  );
  const productSoldMap = useMemo(
    () =>
      new Map(
        localProductRows.map((row) => [row.productId, row.totalQuantity]),
      ),
    [localProductRows],
  );
  const bundleSoldMap = useMemo(
    () => new Map(localBundleRows.map((row) => [row.bundleId, row.quantity])),
    [localBundleRows],
  );

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const visibleProducts = useMemo(
    () =>
      state.catalog.products.filter((product) => {
        if (!showInactive && !product.isActive) {
          return false;
        }

        if (categoryFilter !== "all" && product.category !== categoryFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.productId.toLowerCase().includes(normalizedSearch)
        );
      }),
    [categoryFilter, normalizedSearch, showInactive, state.catalog.products],
  );
  const visibleBundles = useMemo(
    () =>
      state.catalog.bundles.filter((bundle) => {
        if (!showInactive && !bundle.isActive) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          bundle.bundleName.toLowerCase().includes(normalizedSearch) ||
          bundle.bundleId.toLowerCase().includes(normalizedSearch)
        );
      }),
    [normalizedSearch, showInactive, state.catalog.bundles],
  );
  const quickKeys = [...state.favorites, ...state.recentItemKeys].filter(
    (value, index, values) => values.indexOf(value) === index,
  );

  async function handleCsvImport() {
    setIsImportingCsv(true);

    try {
      const result = await importCatalogCsv({
        productsCsv: await fileToText(csvFiles.products),
        bundlesCsv: await fileToText(csvFiles.bundles),
        bundleComponentsCsv: await fileToText(csvFiles.bundleComponents),
      });
      setImportIssues(result.issues);
    } catch (error) {
      setImportIssues([
        {
          file: "products",
          row: 1,
          column: "csv",
          severity: "error",
          message: error instanceof Error ? error.message : "CSV 匯入失敗",
        },
      ]);
    } finally {
      setIsImportingCsv(false);
    }
  }

  async function handleBackupFile(file: File | null) {
    if (!file) {
      return;
    }

    importBackupJson(await file.text());
  }

  if (!isHydrated) {
    return <LoadingShell />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_58%)] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-24 pt-4 sm:px-6">
        <header className="sticky top-3 z-30 rounded-[32px] border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
                Mobile-First POS
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                微high忠糧 2.0
              </h1>
              <p className="mt-1 text-sm text-zinc-500">裝置 ID：{state.deviceId}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusPill label={state.syncInfo.status} status={state.syncInfo.status} />
              <p className="text-xs text-zinc-500">
                最後同步：{formatDateTime(state.syncInfo.lastSyncAt)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="今日營收" value={formatMoney(localSummary.revenueCents)} />
            <MetricCard label="今日成本" value={formatMoney(localSummary.costCents)} />
            <MetricCard label="今日淨利" value={formatMoney(localSummary.profitCents)} />
            <MetricCard
              label="待同步筆數"
              value={state.sales.length.toString()}
              hint={`${state.outbox.length} 個待送批次`}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirmAction("undo")}
              disabled={state.outbox.length > 0 || !state.lastUndoSaleId}
              className="min-h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-2">
                <Undo2 className="h-4 w-4" />
                撤銷最後一筆
              </span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction("clear")}
              className="min-h-12 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700"
            >
              <span className="inline-flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                清除當日資料
              </span>
            </button>
            <button
              type="button"
              onClick={() => void uploadPendingSales()}
              disabled={isUploading || state.sales.length === 0}
              className="min-h-12 rounded-2xl bg-zinc-950 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-2">
                <CloudUpload className="h-4 w-4" />
                {isUploading ? "同步中..." : "上傳營業額"}
              </span>
            </button>
          </div>
        </header>

        {!isOnline ? (
          <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">離線模式</p>
                <p className="mt-1">
                  現在仍可本地記錄銷售；上傳試算表與抓取最新資料會暫停，資料不會被刪除。
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={dismissNotice}
              className={cn(
                "w-full rounded-3xl border px-4 py-3 text-left text-sm font-semibold shadow-sm",
                toneClass(notice.tone),
              )}
            >
              {notice.message}
            </button>
          </div>
        ) : null}

        <main className="mt-4 flex-1">
          {activeTab === "cashier" ? (
            <CashierSection
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              itemFilter={itemFilter}
              onItemFilterChange={setItemFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              showInactive={showInactive}
              onToggleShowInactive={() => setShowInactive((current) => !current)}
              categories={categories}
              quickKeys={quickKeys}
              favorites={state.favorites}
              products={visibleProducts}
              bundles={visibleBundles}
              productMap={productMap}
              bundleComponentsMap={bundleComponentsMap}
              productSoldMap={productSoldMap}
              bundleSoldMap={bundleSoldMap}
              onAddProductSale={addProductSale}
              onAddBundleSale={addBundleSale}
              onToggleFavorite={toggleFavorite}
            />
          ) : null}
          {activeTab === "products" ? (
            <ProductsSection
              csvFiles={csvFiles}
              onCsvFilesChange={setCsvFiles}
              importIssues={importIssues}
              isImportingCsv={isImportingCsv}
              onImportCsv={handleCsvImport}
              products={state.catalog.products}
            />
          ) : null}
          {activeTab === "bundles" ? (
            <BundlesSection
              bundles={state.catalog.bundles}
              bundleComponentsMap={bundleComponentsMap}
              productMap={productMap}
            />
          ) : null}
          {activeTab === "today" ? (
            <TodaySection
              summary={localSummary}
              productRows={localProductRows}
              bundleRows={localBundleRows}
            />
          ) : null}
          {activeTab === "spreadsheet" ? (
            <SpreadsheetSection
              snapshot={state.spreadsheetSnapshot}
              isRefreshing={isRefreshingSnapshot}
              onRefresh={refreshSpreadsheetSnapshot}
            />
          ) : null}
          {activeTab === "sync" ? (
            <SyncSection
              state={state}
              isUploading={isUploading}
              isRefreshingSnapshot={isRefreshingSnapshot}
              isSyncingCatalog={isSyncingCatalog}
              isCheckingHealth={isCheckingHealth}
              health={health}
              onUpload={uploadPendingSales}
              onRefreshSnapshot={refreshSpreadsheetSnapshot}
              onSyncCatalog={syncCatalog}
              onCheckHealth={checkHealth}
              onExportCatalogCsv={exportCatalogCsvFiles}
              onExportBackupDownload={() => exportBackupJson(false)}
              onExportBackupFileSystem={() => exportBackupJson(true)}
              onImportBackupFile={handleBackupFile}
            />
          ) : null}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <div className="mx-auto grid max-w-5xl grid-cols-6 gap-1">
            {TAB_ITEMS.map((tab) => {
              const icon =
                tab.id === "cashier" ? (
                  <ShoppingCart className="h-5 w-5" />
                ) : tab.id === "products" ? (
                  <ShoppingCart className="h-5 w-5" />
                ) : tab.id === "bundles" ? (
                  <Boxes className="h-5 w-5" />
                ) : tab.id === "today" ? (
                  <BarChart3 className="h-5 w-5" />
                ) : tab.id === "spreadsheet" ? (
                  <Database className="h-5 w-5" />
                ) : (
                  <CloudUpload className="h-5 w-5" />
                );

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      setActiveTab(tab.id);
                    })
                  }
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center rounded-2xl text-[11px] font-bold",
                    activeTab === tab.id ? "bg-zinc-950 text-white" : "text-zinc-500",
                  )}
                >
                  {icon}
                  <span className="mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {confirmAction === "undo" ? (
        <ConfirmDialog
          title="確認撤銷最後一筆"
          description="只有尚未進入同步批次的最後一筆本地銷售可以撤銷。"
          confirmLabel="確認撤銷"
          confirmTone="neutral"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            undoLastSale();
            setConfirmAction(null);
          }}
        />
      ) : null}

      {confirmAction === "clear" ? (
        <ConfirmDialog
          title="確認清除當日資料"
          description="這會刪除本地 IndexedDB 裡的今日銷售與待同步批次。建議先匯出 JSON 備份。"
          confirmLabel="我知道，清除資料"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            clearLocalSales();
            setConfirmAction(null);
          }}
        />
      ) : null}
    </div>
  );
}
