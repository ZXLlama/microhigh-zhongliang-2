"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { EmptyPanel, MetricCard, SectionCard } from "@/components/ui/shell-ui";
import { formatMoney } from "@/lib/money";
import type { CheckoutPreview, ItemType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CartSectionProps {
  cartPreview: CheckoutPreview;
  onIncreaseCartItem: (itemType: ItemType, itemId: string) => void;
  onDecreaseCartItem: (itemType: ItemType, itemId: string) => void;
  onRemoveCartItem: (itemType: ItemType, itemId: string) => void;
  onClearCart: () => void;
  onCheckoutCart: () => void;
  onGoCashier: () => void;
}

function toneClass(itemType: ItemType) {
  return itemType === "bundle"
    ? "border-amber-400/35 bg-amber-500/10"
    : "border-sky-400/35 bg-sky-500/10";
}

function badgeClass(itemType: ItemType) {
  return itemType === "bundle"
    ? "bg-amber-400/20 text-amber-50 ring-1 ring-amber-300/20"
    : "bg-sky-400/20 text-sky-50 ring-1 ring-sky-300/20";
}

export function CartSection({
  cartPreview,
  onIncreaseCartItem,
  onDecreaseCartItem,
  onRemoveCartItem,
  onClearCart,
  onCheckoutCart,
  onGoCashier,
}: CartSectionProps) {
  const hasCartItems = cartPreview.lines.length > 0;

  return (
    <div className="space-y-4">
      <SectionCard
        title="購物車"
        subtitle="先確認本輪商品與小計，再按確認收銀並累加。"
      >
        {!hasCartItems ? (
          <div className="space-y-4">
            <EmptyPanel
              title="購物車目前是空的"
              description="請先到收銀台點選商品或組合包，成功加入後會在這裡彙整。"
            />
            <button
              type="button"
              onClick={onGoCashier}
              className="min-h-12 rounded-2xl bg-zinc-100 px-4 text-sm font-black text-zinc-950"
            >
              前往收銀台加入商品
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
                  "rounded-3xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_36px_rgba(0,0,0,0.22)]",
                  toneClass(line.itemType),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-[0.12em]",
                        badgeClass(line.itemType),
                      )}
                    >
                      {line.badgeLabel}
                    </span>
                    <p className="mt-2 text-lg font-black text-zinc-50">{line.name}</p>
                    <p className="mt-1 text-sm text-zinc-300">{line.subtitle}</p>
                    {line.components.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {line.components.map((component) => (
                          <span
                            key={`${line.key}-${component}`}
                            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300"
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
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/12 px-4 text-sm font-bold text-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    移除
                  </button>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="品項數" value={cartPreview.summary.lineCount.toString()} />
              <MetricCard label="總件數" value={cartPreview.summary.totalQuantity.toString()} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onCheckoutCart}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-orange-400 px-4 text-sm font-black text-zinc-950"
              >
                <ShoppingCart className="h-4 w-4" />
                確認收銀並累加
              </button>
              <button
                type="button"
                onClick={onClearCart}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-100"
              >
                清空購物車
              </button>
              <button
                type="button"
                onClick={onGoCashier}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-100"
              >
                回收銀台繼續加商品
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
