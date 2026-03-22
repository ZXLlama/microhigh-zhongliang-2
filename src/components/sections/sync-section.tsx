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
      <SectionCard title="同步狀態" subtitle="先確認本地資料與批次狀態，再決定是否上傳。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="同步狀態" value={state.syncInfo.status} />
          <MetricCard label="本地銷售" value={state.sales.length.toString()} />
          <MetricCard label="待送批次" value={state.outbox.length.toString()} />
          <MetricCard
            label="最後成功批次"
            value={state.syncInfo.lastSuccessBatchId ? "已記錄" : "尚無"}
            hint={state.syncInfo.lastSuccessBatchId ?? "還沒有成功上傳過"}
          />
        </div>
        {state.syncInfo.lastError ? (
          <div className="mt-4 rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {state.syncInfo.lastError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="同步操作" subtitle="所有同步都會先走 Vercel API，再由後端轉送到 GAS。">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void onUpload()}
            disabled={isUploading || state.sales.length === 0}
            className="min-h-14 rounded-3xl bg-zinc-100 px-4 text-left text-zinc-950 disabled:opacity-40"
          >
            <span className="flex items-center gap-3">
              <Upload className="h-5 w-5" />
              <span>
                <span className="block text-base font-black">上傳營業額</span>
                <span className="block text-sm text-zinc-600">
                  將本地待同步銷售送到試算表
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onRefreshSnapshot()}
            disabled={isRefreshingSnapshot}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <RefreshCcw className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  重新抓取試算表
                </span>
                <span className="block text-sm text-zinc-400">
                  只更新最新總表，不會上傳本地資料
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onSyncCatalog()}
            disabled={isSyncingCatalog}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Database className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  同步商品設定
                </span>
                <span className="block text-sm text-zinc-400">
                  更新 Products / Bundles / BundleComponents
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onCheckHealth()}
            disabled={isCheckingHealth}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  檢查 API 狀態
                </span>
                <span className="block text-sm text-zinc-400">
                  確認 Vercel API 與 GAS 是否可用
                </span>
              </span>
            </span>
          </button>
        </div>

        {health ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black text-zinc-50">健康檢查結果</p>
            <p className="mt-2 text-sm text-zinc-400">
              Server Time：{formatDateTime(health.serverTime)}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              GAS 狀態：{health.gasConfigured ? "已連線" : "未連線"}
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="匯出 / 匯入" subtitle="建議在活動前後各做一次 JSON 備份。">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportCatalogCsv}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Download className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  匯出商品 CSV
                </span>
                <span className="block text-sm text-zinc-400">
                  下載 products / bundles / bundle_components
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onExportBackupDownload()}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Download className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  下載 JSON 備份
                </span>
                <span className="block text-sm text-zinc-400">
                  保存目前本地狀態與歷史紀錄
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onExportBackupFileSystem()}
            className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 text-left"
          >
            <span className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  用 File System API 匯出
                </span>
                <span className="block text-sm text-zinc-400">
                  支援的瀏覽器可直接指定下載位置
                </span>
              </span>
            </span>
          </button>
          <label className="min-h-14 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left">
            <span className="flex items-center gap-3">
              <CloudUpload className="h-5 w-5 text-zinc-200" />
              <span>
                <span className="block text-base font-black text-zinc-50">
                  匯入 JSON 備份
                </span>
                <span className="block text-sm text-zinc-400">
                  覆蓋目前本地資料，請先確認檔案來源
                </span>
              </span>
            </span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) =>
                void onImportBackupFile(event.currentTarget.files?.[0] ?? null)
              }
              className="mt-3 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-zinc-100"
            />
          </label>
        </div>
      </SectionCard>
    </div>
  );
}
