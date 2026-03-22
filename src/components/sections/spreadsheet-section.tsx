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
        title="試算表累計"
        subtitle="這裡顯示 Google 試算表端最後一次抓回的最新資料。"
        action={
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            className="min-h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-bold text-white"
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
            <MetricCard label="單品數量" value={snapshot.summary.productQuantity.toString()} />
            <MetricCard label="組合包數量" value={snapshot.summary.bundleQuantity.toString()} />
          </div>
        ) : (
          <EmptyPanel
            title="尚未抓取試算表資料"
            description="按上方重新抓取，或先完成一次上傳營業額。"
          />
        )}
      </SectionCard>

      {snapshot ? (
        <>
          <SectionCard
            title="試算表商品累計"
            subtitle={`抓取時間：${formatDateTime(snapshot.fetchedAt)}`}
          >
            <div className="space-y-3">
              {snapshot.productSummaries.map((row) => (
                <div
                  key={row.productId}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-zinc-950">{row.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{row.category}</p>
                    </div>
                    <p className="text-xl font-black text-zinc-950">{row.totalQuantity} 份</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <MetricCard label="直售" value={row.directQuantity.toString()} />
                    <MetricCard
                      label="組合包帶動"
                      value={row.bundleDrivenQuantity.toString()}
                    />
                    <MetricCard label="營收" value={formatMoney(row.revenueCents)} />
                    <MetricCard label="成本" value={formatMoney(row.costCents)} />
                    <MetricCard label="淨利" value={formatMoney(row.profitCents)} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="最近同步紀錄" subtitle="用來確認 batchId 與處理時間。">
            <div className="space-y-3">
              {snapshot.syncLogs.map((log) => (
                <div
                  key={log.batchId}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-zinc-950">{log.batchId}</p>
                    <StatusPill label={log.status} status={log.status.toLowerCase()} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {log.deviceId} / {log.sessionId}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    筆數 {log.saleCount} / {formatDateTime(log.processedAt)}
                  </p>
                  {log.note ? <p className="mt-2 text-sm text-zinc-600">{log.note}</p> : null}
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
