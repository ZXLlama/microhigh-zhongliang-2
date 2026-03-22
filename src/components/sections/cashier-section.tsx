"use client";

import { CheckCircle2, ShoppingCart } from "lucide-react";

import { EmptyPanel, SectionCard } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type { Bundle, BundleComponent, ItemType, Product } from "@/lib/types";
import { cn, itemKey } from "@/lib/utils";

interface CashierSectionProps {
  products: Product[];
  bundles: Bundle[];
  productMap: Map<string, Product>;
  bundleComponentsMap: Map<string, BundleComponent[]>;
  productSoldMap: Map<string, number>;
  bundleSoldMap: Map<string, number>;
  lastAddedKey: string | null;
  onAddToCart: (itemType: ItemType, itemId: string) => void;
}

function toneClass(itemType: ItemType, isActive: boolean) {
  if (itemType === "bundle") {
    return isActive
      ? "border-amber-400/55 bg-[linear-gradient(180deg,rgba(251,191,36,0.22),rgba(251,191,36,0.10))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_42px_rgba(251,191,36,0.12)]"
      : "border-amber-500/25 bg-amber-500/10";
  }

  return isActive
    ? "border-sky-400/55 bg-[linear-gradient(180deg,rgba(56,189,248,0.20),rgba(56,189,248,0.08))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_42px_rgba(56,189,248,0.12)]"
    : "border-sky-500/25 bg-sky-500/10";
}

function badgeClass(itemType: ItemType) {
  return itemType === "bundle"
    ? "bg-amber-400/20 text-amber-50 ring-1 ring-amber-300/20"
    : "bg-sky-400/20 text-sky-50 ring-1 ring-sky-300/20";
}

export function CashierSection({
  products,
  bundles,
  productMap,
  bundleComponentsMap,
  productSoldMap,
  bundleSoldMap,
  lastAddedKey,
  onAddToCart,
}: CashierSectionProps) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="單品"
        subtitle="整張卡片都可以直接點擊加入購物車。藍色是單品。"
      >
        {products.length === 0 ? (
          <EmptyPanel
            title="目前沒有啟用中的單品"
            description="請到商品設定確認商品是否已啟用。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {products.map((product) => {
              const currentKey = itemKey("product", product.productId);
              const justAdded = lastAddedKey === currentKey;

              return (
                <button
                  key={product.productId}
                  type="button"
                  onClick={() => onAddToCart("product", product.productId)}
                  className={cn(
                    "w-full rounded-3xl border p-4 text-left transition duration-150 active:scale-[0.99]",
                    toneClass("product", justAdded),
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.12em]",
                          badgeClass("product"),
                        )}
                      >
                        單品
                      </span>
                      <p className="mt-2 text-lg font-black text-zinc-50">{product.name}</p>
                      <p className="mt-1 text-sm text-zinc-300">
                        {product.category} / 已售 {productSoldMap.get(product.productId) ?? 0} 件
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">單價</p>
                      <p className="text-2xl font-black text-sky-50">
                        {formatMoney(product.priceCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                      ID: {product.productId}
                    </div>
                    <div
                      className={cn(
                        "inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-black",
                        justAdded
                          ? "bg-emerald-400 text-zinc-950"
                          : "bg-sky-300 text-zinc-950",
                      )}
                    >
                      {justAdded ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          已加入購物車
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          點一下加入
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="組合包"
        subtitle="橘色是組合包，售出後會同時帶動內容物件數。"
      >
        {bundles.length === 0 ? (
          <EmptyPanel
            title="目前沒有啟用中的組合包"
            description="請到組合包設定確認是否已有啟用中的組合包。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bundles.map((bundle) => {
              const currentKey = itemKey("bundle", bundle.bundleId);
              const justAdded = lastAddedKey === currentKey;

              return (
                <button
                  key={bundle.bundleId}
                  type="button"
                  onClick={() => onAddToCart("bundle", bundle.bundleId)}
                  className={cn(
                    "w-full rounded-3xl border p-4 text-left transition duration-150 active:scale-[0.99]",
                    toneClass("bundle", justAdded),
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.12em]",
                          badgeClass("bundle"),
                        )}
                      >
                        組合包
                      </span>
                      <p className="mt-2 text-lg font-black text-zinc-50">
                        {bundle.bundleName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        已售 {bundleSoldMap.get(bundle.bundleId) ?? 0} 組
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">售價</p>
                      <p className="text-2xl font-black text-amber-50">
                        {formatMoney(bundle.bundlePriceCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(bundleComponentsMap.get(bundle.bundleId) ?? []).map((component) => (
                      <span
                        key={`${bundle.bundleId}-${component.productId}`}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300"
                      >
                        {(productMap.get(component.productId)?.name ?? component.productId) +
                          ` x${component.quantity}`}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                      ID: {bundle.bundleId}
                    </div>
                    <div
                      className={cn(
                        "inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-black",
                        justAdded
                          ? "bg-emerald-400 text-zinc-950"
                          : "bg-amber-300 text-zinc-950",
                      )}
                    >
                      {justAdded ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          已加入購物車
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          點一下加入
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
