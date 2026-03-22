"use client";

import { EmptyPanel, MetricCard, SectionCard, StatusPill } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type { SpreadsheetSnapshot } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface SpreadsheetSectionProps {
  snapshot: SpreadsheetSnapshot | null;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function SpreadsheetSection({
  snapshot,
  isRefreshing,
  onRefresh,
}: SpreadsheetSectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="試算表總表"
        subtitle="這裡顯示目前 Google 試算表中最新的累計結果。"
        action={
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            className="min-h-11 rounded-2xl bg-zinc-100 px-4 text-sm font-black text-zinc-950 disabled:opacity-40"
          >
            {isRefreshing ? "抓取中..." : "重新抓取"}
          </button>
        }
      >
        {snapshot ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MetricCard label="營收" value={formatMoney(snapshot.summary.revenueCents)} />
            <MetricCard label="成本" value={formatMoney(snapshot.summary.costCents)} />
            <MetricCard label="淨利" value={formatMoney(snapshot.summary.profitCents)} />
            <MetricCard label="單品件數" value={snapshot.summary.productQuantity.toString()} />
            <MetricCard label="組合包組數" value={snapshot.summary.bundleQuantity.toString()} />
          </div>
        ) : (
          <EmptyPanel
            title="尚未抓取試算表資料"
            description="請先到同步頁確認 GAS 與試算表已串接，然後再按重新抓取。"
          />
        )}
      </SectionCard>

      {snapshot ? (
        <>
          <SectionCard
            title="商品累計"
            subtitle={`最後抓取時間：${formatDateTime(snapshot.fetchedAt)}`}
          >
            <div className="space-y-3">
              {snapshot.productSummaries.map((row) => (
                <div
                  key={row.productId}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-zinc-50">{row.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">{row.category}</p>
                    </div>
                    <p className="text-xl font-black text-zinc-50">{row.totalQuantity} 件</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <MetricCard label="直售" value={row.directQuantity.toString()} />
                    <MetricCard label="組合包帶動" value={row.bundleDrivenQuantity.toString()} />
                    <MetricCard label="營收" value={formatMoney(row.revenueCents)} />
                    <MetricCard label="成本" value={formatMoney(row.costCents)} />
                    <MetricCard label="淨利" value={formatMoney(row.profitCents)} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="同步記錄" subtitle="可用來核對 batchId 與是否有重複入帳。">
            <div className="space-y-3">
              {snapshot.syncLogs.map((log) => (
                <div
                  key={log.batchId}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-zinc-50">{log.batchId}</p>
                    <StatusPill label={log.status} status={log.status.toLowerCase()} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {log.deviceId} / {log.sessionId}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    銷售筆數 {log.saleCount} / {formatDateTime(log.processedAt)}
                  </p>
                  {log.note ? <p className="mt-2 text-sm text-zinc-300">{log.note}</p> : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
