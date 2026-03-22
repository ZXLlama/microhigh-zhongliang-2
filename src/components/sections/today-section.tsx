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
      <SectionCard title="今日摘要" subtitle="以下數字完全來自本地 IndexedDB。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MetricCard label="單品數量" value={summary.productQuantity.toString()} />
          <MetricCard label="組合包數量" value={summary.bundleQuantity.toString()} />
          <MetricCard
            label="組合包帶動"
            value={summary.bundleDrivenProductQuantity.toString()}
          />
          <MetricCard label="營收" value={formatMoney(summary.revenueCents)} />
          <MetricCard label="淨利" value={formatMoney(summary.profitCents)} />
        </div>
      </SectionCard>

      <SectionCard
        title="商品累計"
        subtitle="direct 代表單品直售；bundle-driven 代表被組合包帶動。"
      >
        <div className="space-y-3">
          {productRows.map((row) => (
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
                  label="被組合包帶動"
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

      <SectionCard title="組合包累計" subtitle="組合包收入與成本獨立統計。">
        <div className="space-y-3">
          {bundleRows.map((row) => (
            <div
              key={row.bundleId}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-black text-zinc-950">{row.name}</p>
                <p className="text-xl font-black text-zinc-950">{row.quantity} 組</p>
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
