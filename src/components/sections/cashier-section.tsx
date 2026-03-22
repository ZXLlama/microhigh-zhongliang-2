"use client";

import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { EmptyPanel, MetricCard, SectionCard } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type {
  Bundle,
  BundleComponent,
  CheckoutPreview,
  ItemType,
  Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  products: Product[];
  bundles: Bundle[];
  productMap: Map<string, Product>;
  bundleComponentsMap: Map<string, BundleComponent[]>;
  productSoldMap: Map<string, number>;
  bundleSoldMap: Map<string, number>;
  cartPreview: CheckoutPreview;
  isReviewingCart: boolean;
  onAddToCart: (itemType: ItemType, itemId: string) => void;
  onIncreaseCartItem: (itemType: ItemType, itemId: string) => void;
  onDecreaseCartItem: (itemType: ItemType, itemId: string) => void;
  onRemoveCartItem: (itemType: ItemType, itemId: string) => void;
  onClearCart: () => void;
  onReviewCart: () => void;
  onBackToCart: () => void;
  onCheckoutCart: () => void;
}

function cartTone(itemType: ItemType) {
  return itemType === "bundle"
    ? "border-amber-500/25 bg-amber-500/10"
    : "border-sky-500/25 bg-sky-500/10";
}

function badgeTone(itemType: ItemType) {
  return itemType === "bundle"
    ? "bg-amber-500/20 text-amber-100"
    : "bg-sky-500/20 text-sky-100";
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
  products,
  bundles,
  productMap,
  bundleComponentsMap,
  productSoldMap,
  bundleSoldMap,
  cartPreview,
  isReviewingCart,
  onAddToCart,
  onIncreaseCartItem,
  onDecreaseCartItem,
  onRemoveCartItem,
  onClearCart,
  onReviewCart,
  onBackToCart,
  onCheckoutCart,
}: CashierSectionProps) {
  const hasCartItems = cartPreview.lines.length > 0;

  return (
    <div className="space-y-4">
      <SectionCard
        title={isReviewingCart ? "確認本輪收銀" : "本輪購物車"}
        subtitle={
          isReviewingCart
            ? "確認商品、件數與小計後，再正式累加到今日營收。"
            : "先把本輪要賣的單品與組合包加入購物車，再進入確認收銀。"
        }
      >
        {!hasCartItems ? (
          <EmptyPanel
            title="購物車目前是空的"
            description="操作流程：加入購物車 -> 確認本輪內容與小計 -> 確認收銀並累加。"
          />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="品項數"
                value={cartPreview.summary.lineCount.toString()}
              />
              <MetricCard
                label="總件數"
                value={cartPreview.summary.totalQuantity.toString()}
              />
              <MetricCard
                label="本輪小計"
                value={formatMoney(cartPreview.summary.revenueCents)}
              />
              <MetricCard
                label="本輪淨利"
                value={formatMoney(cartPreview.summary.profitCents)}
              />
            </div>

            {cartPreview.lines.map((line) => (
              <div
                key={line.key}
                className={cn(
                  "rounded-3xl border p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]",
                  cartTone(line.itemType),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.12em]",
                        badgeTone(line.itemType),
                      )}
                    >
                      {line.badgeLabel}
                    </span>
                    <p className="mt-2 text-lg font-black text-zinc-50">{line.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{line.subtitle}</p>
                    {line.components.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {line.components.map((component) => (
                          <span
                            key={`${line.key}-${component}`}
                            className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300"
                          >
                            {component}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm text-zinc-400">小計</p>
                    <p className="text-2xl font-black text-zinc-50">
                      {formatMoney(line.subtotalCents)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      單價 {formatMoney(line.unitPriceCents)}
                    </p>
                  </div>
                </div>

                {!isReviewingCart ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-black/20 p-1">
                      <button
                        type="button"
                        onClick={() => onDecreaseCartItem(line.itemType, line.itemId)}
                        className="grid h-11 w-11 place-items-center rounded-xl text-zinc-200"
                        aria-label={`減少 ${line.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-10 text-center text-base font-black text-zinc-50">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onIncreaseCartItem(line.itemType, line.itemId)}
                        className="grid h-11 w-11 place-items-center rounded-xl text-zinc-200"
                        aria-label={`增加 ${line.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveCartItem(line.itemType, line.itemId)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 text-sm font-bold text-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      移除
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              {isReviewingCart ? (
                <>
                  <button
                    type="button"
                    onClick={onBackToCart}
                    className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-100"
                  >
                    返回修改購物車
                  </button>
                  <button
                    type="button"
                    onClick={onCheckoutCart}
                    className="min-h-12 rounded-2xl bg-orange-500 px-4 text-sm font-black text-zinc-950"
                  >
                    確認收銀並累加
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onReviewCart}
                    className="min-h-12 rounded-2xl bg-zinc-100 px-4 text-sm font-black text-zinc-950"
                  >
                    確認購物車
                  </button>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200"
                  >
                    清空購物車
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {isReviewingCart ? null : (
        <>
          <SectionCard
            title="加入商品"
            subtitle="先用搜尋與篩選找到商品，再加入本輪購物車。"
          >
            <div className="space-y-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchTerm}
                  onChange={(event) => onSearchTermChange(event.target.value)}
                  placeholder="搜尋商品名稱或 ID"
                  className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base font-medium text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-orange-400"
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
                        ? "bg-zinc-100 text-zinc-950"
                        : "border border-white/10 bg-white/5 text-zinc-300",
                    )}
                  >
                    {value === "all"
                      ? "全部"
                      : value === "product"
                        ? "單品"
                        : "組合包"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={onToggleShowInactive}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm font-bold",
                    showInactive
                      ? "bg-orange-500/20 text-orange-100"
                      : "border border-white/10 bg-white/5 text-zinc-300",
                  )}
                >
                  {showInactive ? "顯示停用中" : "只看啟用中"}
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
                          ? "bg-sky-500 text-white"
                          : "border border-white/10 bg-white/5 text-zinc-300",
                      )}
                    >
                      {category === "all" ? "全部分類" : category}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </SectionCard>

          {(itemFilter === "all" || itemFilter === "product") && (
            <SectionCard title="單品" subtitle="藍色卡片是單品，加入後會直接累加到商品銷量。">
              {products.length === 0 ? (
                <EmptyPanel
                  title="沒有符合條件的單品"
                  description="請調整搜尋、分類或啟用狀態篩選。"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {products.map((product) => (
                    <div
                      key={product.productId}
                      className="rounded-3xl border border-sky-500/25 bg-sky-500/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-sky-100">
                            單品
                          </span>
                          <p className="mt-2 text-lg font-black text-zinc-50">{product.name}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {product.category} / 已售 {productSoldMap.get(product.productId) ?? 0}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">單價</p>
                          <p className="text-2xl font-black text-sky-100">
                            {formatMoney(product.priceCents)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-zinc-300">
                          ID: {product.productId}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart("product", product.productId)}
                          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-sky-400 px-4 text-sm font-black text-zinc-950"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          加入購物車
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {(itemFilter === "all" || itemFilter === "bundle") && (
            <SectionCard title="組合包" subtitle="橘色卡片是組合包，售出後會同時帶動內容物數量。">
              {bundles.length === 0 ? (
                <EmptyPanel
                  title="沒有符合條件的組合包"
                  description="請調整搜尋或啟用狀態篩選。"
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {bundles.map((bundle) => (
                    <div
                      key={bundle.bundleId}
                      className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-black tracking-[0.12em] text-amber-100">
                            組合包
                          </span>
                          <p className="mt-2 text-lg font-black text-zinc-50">
                            {bundle.bundleName}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            已售 {bundleSoldMap.get(bundle.bundleId) ?? 0} 組
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">售價</p>
                          <p className="text-2xl font-black text-amber-100">
                            {formatMoney(bundle.bundlePriceCents)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
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

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="rounded-2xl bg-black/20 px-3 py-2 text-sm text-zinc-300">
                          ID: {bundle.bundleId}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart("bundle", bundle.bundleId)}
                          className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-amber-400 px-4 text-sm font-black text-zinc-950"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          加入購物車
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
