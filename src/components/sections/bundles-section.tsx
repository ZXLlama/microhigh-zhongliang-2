"use client";

import { MetricCard, SectionCard, StatusPill } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type { Bundle, BundleComponent, Product } from "@/lib/types";

interface BundlesSectionProps {
  bundles: Bundle[];
  bundleComponentsMap: Map<string, BundleComponent[]>;
  productMap: Map<string, Product>;
}

export function BundlesSection({
  bundles,
  bundleComponentsMap,
  productMap,
}: BundlesSectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard title="組合包主檔" subtitle={`目前共有 ${bundles.length} 個組合包。`}>
        <div className="space-y-3">
          {bundles.map((bundle) => (
            <div
              key={bundle.bundleId}
              className="rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-zinc-50">{bundle.bundleName}</p>
                  <p className="mt-1 text-sm text-zinc-400">{bundle.bundleId}</p>
                </div>
                <StatusPill
                  label={bundle.isActive ? "啟用" : "停用"}
                  status={bundle.isActive ? "success" : "idle"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(bundleComponentsMap.get(bundle.bundleId) ?? []).map((component) => (
                  <span
                    key={`${bundle.bundleId}-${component.productId}`}
                    className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300"
                  >
                    {(productMap.get(component.productId)?.name ?? component.productId) +
                      ` x${component.quantity}`}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <MetricCard label="售價" value={formatMoney(bundle.bundlePriceCents)} />
                <MetricCard label="成本" value={formatMoney(bundle.bundleCostCents)} />
                <MetricCard label="淨利" value={formatMoney(bundle.bundleProfitCents)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
