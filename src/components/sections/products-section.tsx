"use client";

import { EmptyPanel, MetricCard, SectionCard, StatusPill } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type { CsvImportIssue, Product } from "@/lib/types";

type CsvFileMap = {
  products: File | null;
  bundles: File | null;
  bundleComponents: File | null;
};

interface ProductsSectionProps {
  csvFiles: CsvFileMap;
  onCsvFilesChange: (next: CsvFileMap) => void;
  importIssues: CsvImportIssue[];
  isImportingCsv: boolean;
  onImportCsv: () => Promise<void>;
  products: Product[];
}

export function ProductsSection({
  csvFiles,
  onCsvFilesChange,
  importIssues,
  isImportingCsv,
  onImportCsv,
  products,
}: ProductsSectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="CSV 匯入"
        subtitle="請依序上傳 products.csv、bundles.csv、bundle_components.csv。"
        action={
          <button
            type="button"
            onClick={() => void onImportCsv()}
            disabled={isImportingCsv}
            className="min-h-11 rounded-2xl bg-zinc-100 px-4 text-sm font-black text-zinc-950 disabled:opacity-40"
          >
            {isImportingCsv ? "匯入中..." : "開始匯入"}
          </button>
        }
      >
        <div className="space-y-3">
          {[
            ["products", "products.csv"],
            ["bundles", "bundles.csv"],
            ["bundleComponents", "bundle_components.csv"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="block rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <span className="mb-2 block text-sm font-bold text-zinc-200">{label}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  onCsvFilesChange({
                    ...csvFiles,
                    [key]: event.currentTarget.files?.[0] ?? null,
                  } as CsvFileMap)
                }
                className="block w-full text-sm text-zinc-400 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-zinc-100"
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="匯入結果"
        subtitle="有 warning 可以先檢查；有 error 則不會套用新設定。"
      >
        {importIssues.length === 0 ? (
          <EmptyPanel
            title="尚未產生匯入結果"
            description="上傳三個 CSV 後按開始匯入，系統會在這裡列出錯誤與警告。"
          />
        ) : (
          <div className="space-y-2">
            {importIssues.map((issue, index) => (
              <div
                key={`${issue.file}-${issue.row}-${index}`}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  issue.severity === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-100"
                }`}
              >
                <p className="font-black">
                  {issue.severity.toUpperCase()} / {issue.file} / 第 {issue.row} 列 /{" "}
                  {issue.column}
                </p>
                <p className="mt-1">{issue.message}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="商品主檔" subtitle={`目前共有 ${products.length} 個商品。`}>
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-zinc-50">{product.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {product.productId} / {product.category}
                  </p>
                </div>
                <StatusPill
                  label={product.isActive ? "啟用" : "停用"}
                  status={product.isActive ? "success" : "idle"}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <MetricCard label="售價" value={formatMoney(product.priceCents)} />
                <MetricCard label="成本" value={formatMoney(product.costCents)} />
                <MetricCard label="淨利" value={formatMoney(product.profitCents)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
