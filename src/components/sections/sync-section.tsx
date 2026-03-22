"use client";

import {
  CloudUpload,
  Database,
  Download,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";

import { MetricCard, SectionCard } from "@/components/ui/shell-ui";
import type { HealthResponse, LocalState } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface SyncSectionProps {
  state: LocalState;
  isUploading: boolean;
  isRefreshingSnapshot: boolean;
  isSyncingCatalog: boolean;
  isCheckingHealth: boolean;
  health: HealthResponse | null;
  onUpload: () => Promise<void>;
  onRefreshSnapshot: () => Promise<void>;
  onSyncCatalog: () => Promise<unknown>;
  onCheckHealth: () => Promise<void>;
  onExportCatalogCsv: () => void;
  onExportBackupDownload: () => Promise<void>;
  onExportBackupFileSystem: () => Promise<void>;
  onImportBackupFile: (file: File | null) => Promise<void>;
}

export function SyncSection({
  state,
  isUploading,
  isRefreshingSnapshot,
  isSyncingCatalog,
  isCheckingHealth,
  health,
  onUpload,
  onRefreshSnapshot,
  onSyncCatalog,
  onCheckHealth,
  onExportCatalogCsv,
  onExportBackupDownload,
  onExportBackupFileSystem,
  onImportBackupFile,
}: SyncSectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard title="同步狀態" subtitle="先本地，後上傳。失敗時本地資料不會刪除。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="同步狀態" value={state.syncInfo.status} />
          <MetricCard label="待同步銷售" value={state.sales.length.toString()} />
          <MetricCard label="待送批次" value={state.outbox.length.toString()} />
          <MetricCard
            label="最後成功批次"
            value={state.syncInfo.lastSuccessBatchId ? "有" : "無"}
            hint={state.syncInfo.lastSuccessBatchId ?? "尚未成功同步"}
          />
        </div>
        {state.syncInfo.lastError ? (
          <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {state.syncInfo.lastError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="同步操作" subtitle="所有網路操作都會透過 Vercel API route。">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void onUpload()}
            disabled={isUploading || state.sales.length === 0}
            className="min-h-14 rounded-3xl bg-zinc-950 px-4 text-left text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex items-center gap-3">
              <Upload className="h-5 w-5" />
              <span>
                <span className="block text-base font-black">上傳營業額</span>
                <span className="block text-sm text-zinc-300">成功後才會重製本地資料</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onRefreshSnapshot()}
            disabled={isRefreshingSnapshot}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <RefreshCcw className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  重新抓取試算表
                </span>
                <span className="block text-sm text-zinc-500">只讀，不會上傳本地資料</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onSyncCatalog()}
            disabled={isSyncingCatalog}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Database className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  同步商品設定到試算表
                </span>
                <span className="block text-sm text-zinc-500">
                  更新 Products / Bundles / BundleComponents
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onCheckHealth()}
            disabled={isCheckingHealth}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  檢查 API 健康狀態
                </span>
                <span className="block text-sm text-zinc-500">
                  驗證 Vercel API 與 GAS 設定
                </span>
              </span>
            </span>
          </button>
        </div>

        {health ? (
          <div className="mt-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="font-black text-zinc-950">健康檢查結果</p>
            <p className="mt-2 text-sm text-zinc-600">
              Server Time：{formatDateTime(health.serverTime)}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              GAS 設定：{health.gasConfigured ? "已設定" : "未設定"}
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="匯出與備份" subtitle="設定檔與完整本地資料都可以先備份再操作。">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportCatalogCsv}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Download className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  匯出目前設定 CSV
                </span>
                <span className="block text-sm text-zinc-500">
                  下載 products / bundles / bundle_components
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onExportBackupDownload()}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Download className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  下載 JSON 備份
                </span>
                <span className="block text-sm text-zinc-500">
                  含本地銷售、設定、同步狀態
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onExportBackupFileSystem()}
            className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  用 File System API 儲存
                </span>
                <span className="block text-sm text-zinc-500">
                  不支援的瀏覽器會自動改用下載
                </span>
              </span>
            </span>
          </button>
          <label className="min-h-14 rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-left">
            <span className="flex items-center gap-3">
              <CloudUpload className="h-5 w-5 text-zinc-700" />
              <span>
                <span className="block text-base font-black text-zinc-950">
                  匯入 JSON 備份
                </span>
                <span className="block text-sm text-zinc-500">
                  會覆蓋目前本地資料
                </span>
              </span>
            </span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) =>
                void onImportBackupFile(event.currentTarget.files?.[0] ?? null)
              }
              className="mt-3 block w-full text-sm text-zinc-600"
            />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}
