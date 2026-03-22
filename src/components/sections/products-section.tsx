"use client";

import { SectionCard, EmptyPanel, MetricCard, StatusPill } from "@/components/ui/shell-ui";
import type { CsvImportIssue, Product } from "@/lib/types";
import { formatMoney } from "@/lib/money";

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
        subtitle="請依序選擇 products.csv、bundles.csv、bundle_components.csv，再按驗證與套用。"
        action={
          <button
            type="button"
            onClick={() => void onImportCsv()}
            disabled={isImportingCsv}
            className="min-h-11 rounded-2xl bg-zinc-950 px-4 text-sm font-bold text-white"
          >
            {isImportingCsv ? "驗證中..." : "驗證並套用"}
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
              className="block rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  onCsvFilesChange({
                    ...csvFiles,
                    [key]: event.currentTarget.files?.[0] ?? null,
                  } as CsvFileMap)
                }
                className="block w-full text-sm text-zinc-600"
              />
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="CSV 驗證結果"
        subtitle="warning 會提示你資料不一致；error 會阻止匯入。"
      >
        {importIssues.length === 0 ? (
          <EmptyPanel
            title="尚無匯入訊息"
            description="選好三份 CSV 並驗證後，這裡會顯示錯誤列與警告列。"
          />
        ) : (
          <div className="space-y-2">
            {importIssues.map((issue, index) => (
              <div
                key={`${issue.file}-${issue.row}-${index}`}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  issue.severity === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
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

      <SectionCard title="商品主檔" subtitle={`目前共 ${products.length} 個商品。`}>
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-zinc-950">{product.name}</p>
                  <p className="mt-1 text-sm text-zinc-500">
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
