"use client";

import { MetricCard, SectionCard } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type {
  BundleSummaryRow,
  ProductSummaryRow,
  SummaryMetrics,
} from "@/lib/types";

interface TodaySectionProps {
  summary: SummaryMetrics;
  productRows: ProductSummaryRow[];
  bundleRows: BundleSummaryRow[];
}

export function TodaySection({
  summary,
  productRows,
  bundleRows,
}: TodaySectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard title="今日總覽" subtitle="以下統計來自目前瀏覽器內的本地銷售資料。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MetricCard label="單品件數" value={summary.productQuantity.toString()} />
          <MetricCard label="組合包組數" value={summary.bundleQuantity.toString()} />
          <MetricCard
            label="組合包帶動件數"
            value={summary.bundleDrivenProductQuantity.toString()}
          />
          <MetricCard label="營收" value={formatMoney(summary.revenueCents)} />
          <MetricCard label="淨利" value={formatMoney(summary.profitCents)} />
        </div>
      </SectionCard>

      <SectionCard
        title="商品統計"
        subtitle="可同時看到單品直售與被組合包帶動的累計件數。"
      >
        <div className="space-y-3">
          {productRows.map((row) => (
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

      <SectionCard title="組合包統計" subtitle="顯示各組合包目前累積的銷量與金額。">
        <div className="space-y-3">
          {bundleRows.map((row) => (
            <div
              key={row.bundleId}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-black text-zinc-50">{row.name}</p>
                <p className="text-xl font-black text-zinc-50">{row.quantity} 組</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <MetricCard label="營收" value={formatMoney(row.revenueCents)} />
                <MetricCard label="成本" value={formatMoney(row.costCents)} />
                <MetricCard label="淨利" value={formatMoney(row.profitCents)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
