"use client";

import { Heart, Search } from "lucide-react";

import { EmptyPanel, SectionCard } from "@/components/ui/shell-ui";
import { getBundleMap } from "@/lib/config";
import { formatMoney } from "@/lib/money";
import type { BundleComponent, Bundle, Product } from "@/lib/types";
import { cn, itemKey, splitItemKey } from "@/lib/utils";

type ItemFilter = "all" | "product" | "bundle";

interface CashierSectionProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  itemFilter: ItemFilter;
  onItemFilterChange: (value: ItemFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  showInactive: boolean;
  onToggleShowInactive: () => void;
  categories: string[];
  quickKeys: string[];
  favorites: string[];
  products: Product[];
  bundles: Bundle[];
  productMap: Map<string, Product>;
  bundleComponentsMap: Map<string, BundleComponent[]>;
  productSoldMap: Map<string, number>;
  bundleSoldMap: Map<string, number>;
  onAddProductSale: (productId: string) => void;
  onAddBundleSale: (bundleId: string) => void;
  onToggleFavorite: (key: string) => void;
}

export function CashierSection({
  searchTerm,
  onSearchTermChange,
  itemFilter,
  onItemFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  showInactive,
  onToggleShowInactive,
  categories,
  quickKeys,
  favorites,
  products,
  bundles,
  productMap,
  bundleComponentsMap,
  productSoldMap,
  bundleSoldMap,
  onAddProductSale,
  onAddBundleSale,
  onToggleFavorite,
}: CashierSectionProps) {
  const bundleMap = getBundleMap({
    metadata: {
      source: "sample",
      versionId: "section",
      lastImportedAt: new Date().toISOString(),
    },
    products: [],
    bundles,
    bundleComponents: [],
  });

  return (
    <div className="space-y-4">
      <SectionCard
        title="快速收銀"
        subtitle="單手操作優先：先找商品，再點一次完成記錄。"
      >
        <div className="space-y-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="搜尋商品或組合包"
              className="min-h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-base font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(["all", "product", "bundle"] as ItemFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onItemFilterChange(value)}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-bold",
                  itemFilter === value
                    ? "bg-zinc-950 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700",
                )}
              >
                {value === "all" ? "全部" : value === "product" ? "單品" : "組合包"}
              </button>
            ))}
            <button
              type="button"
              onClick={onToggleShowInactive}
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-bold",
                showInactive
                  ? "bg-amber-100 text-amber-800"
                  : "border border-zinc-200 bg-white text-zinc-700",
              )}
            >
              {showInactive ? "顯示停用中" : "隱藏停用"}
            </button>
          </div>

          {itemFilter !== "bundle" ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryFilterChange(category)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-full px-4 text-sm font-bold",
                    categoryFilter === category
                      ? "bg-orange-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700",
                  )}
                >
                  {category === "all" ? "全部分類" : category}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="常用捷徑"
        subtitle="收藏與最近熱賣會排在前面，現場可減少搜尋。"
      >
        {quickKeys.length === 0 ? (
          <EmptyPanel
            title="尚未建立捷徑"
            description="點商品卡片右上角愛心可加入收藏，賣過的品項也會自動出現在最近常用。"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {quickKeys.map((key) => {
              const { itemType, itemId } = splitItemKey(key);
              const isFavorite = favorites.includes(key);

              if (itemType === "product") {
                const product = productMap.get(itemId);
                if (!product) {
                  return null;
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onAddProductSale(product.productId)}
                    className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-500">單品</p>
                        <p className="mt-1 text-lg font-black text-zinc-950">
                          {product.name}
                        </p>
                      </div>
                      <Heart
                        className={cn(
                          "h-5 w-5",
                          isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-300",
                        )}
                      />
                    </div>
                    <p className="mt-3 text-2xl font-black text-orange-600">
                      {formatMoney(product.priceCents)}
                    </p>
                  </button>
                );
              }

              const bundle = bundleMap.get(itemId);
              if (!bundle) {
                return null;
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAddBundleSale(bundle.bundleId)}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-500">組合包</p>
                      <p className="mt-1 text-lg font-black text-zinc-950">
                        {bundle.bundleName}
                      </p>
                    </div>
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-300",
                      )}
                    />
                  </div>
                  <p className="mt-3 text-2xl font-black text-emerald-600">
                    {formatMoney(bundle.bundlePriceCents)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {(itemFilter === "all" || itemFilter === "bundle") && (
        <SectionCard title="組合包" subtitle="組合包會同時計入內含商品數量。">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bundles.map((bundle) => (
              <div
                key={bundle.bundleId}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-zinc-950">{bundle.bundleName}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      今日售出 {bundleSoldMap.get(bundle.bundleId) ?? 0} 組
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(itemKey("bundle", bundle.bundleId))}
                    className="rounded-full p-2"
                    aria-label="切換收藏"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        favorites.includes(itemKey("bundle", bundle.bundleId))
                          ? "fill-rose-500 text-rose-500"
                          : "text-zinc-300",
                      )}
                    />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                  {(bundleComponentsMap.get(bundle.bundleId) ?? []).map((component) => (
                    <span
                      key={`${bundle.bundleId}-${component.productId}`}
                      className="rounded-full bg-white px-3 py-1"
                    >
                      {(productMap.get(component.productId)?.name ?? component.productId) +
                        ` x${component.quantity}`}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">售價</p>
                    <p className="text-2xl font-black text-emerald-600">
                      {formatMoney(bundle.bundlePriceCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddBundleSale(bundle.bundleId)}
                    className="min-h-14 rounded-2xl bg-zinc-950 px-5 text-base font-bold text-white"
                  >
                    快速加購
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {(itemFilter === "all" || itemFilter === "product") && (
        <SectionCard title="單品" subtitle="大按鈕操作，點一下即完成記錄。">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.productId}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-zinc-950">{product.name}</p>
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-bold text-orange-700">
                        {product.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      今日售出 {productSoldMap.get(product.productId) ?? 0} 份
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(itemKey("product", product.productId))}
                    className="rounded-full p-2"
                    aria-label="切換收藏"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        favorites.includes(itemKey("product", product.productId))
                          ? "fill-rose-500 text-rose-500"
                          : "text-zinc-300",
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">售價</p>
                    <p className="text-2xl font-black text-orange-600">
                      {formatMoney(product.priceCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddProductSale(product.productId)}
                    className="min-h-14 rounded-2xl bg-zinc-950 px-5 text-base font-bold text-white"
                  >
                    快速加購
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
