import { summarizeSales } from "@/lib/sales";
import type { LocalState, SaleEvent, SyncBatch } from "@/lib/types";

function stableSerializeSales(sales: SaleEvent[]): string {
  return JSON.stringify(
    [...sales]
      .sort((left, right) => left.id.localeCompare(right.id, "en"))
      .map((sale) => ({
        id: sale.id,
        timestamp: sale.timestamp,
        itemType: sale.itemType,
        itemId: sale.itemId,
        itemNameSnapshot: sale.itemNameSnapshot,
        unitPriceSnapshot: sale.unitPriceSnapshot,
        unitCostSnapshot: sale.unitCostSnapshot,
        quantity: sale.quantity,
        revenueSnapshot: sale.revenueSnapshot,
        costSnapshot: sale.costSnapshot,
        profitSnapshot: sale.profitSnapshot,
        bundleComponentBreakdown: [...sale.bundleComponentBreakdown].sort((left, right) =>
          `${left.productId}-${left.quantity}`.localeCompare(
            `${right.productId}-${right.quantity}`,
            "en",
          ),
        ),
      })),
  );
}

function hashText(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createBatchChecksum(sales: SaleEvent[]): string {
  return hashText(stableSerializeSales(sales));
}

export function createSyncBatch(
  state: LocalState,
  sales: SaleEvent[],
  now = new Date().toISOString(),
): SyncBatch {
  const checksum = createBatchChecksum(sales);
  const compactTimestamp = now.replace(/[-:.TZ]/g, "").slice(0, 14);

  return {
    batchId: `batch_${state.deviceId}_${compactTimestamp}_${checksum}`,
    deviceId: state.deviceId,
    sessionId: state.currentSession.sessionId,
    createdAt: now,
    checksum,
    saleIds: sales.map((sale) => sale.id),
    sales,
    totals: summarizeSales(sales),
    status: "ready",
    attempts: 0,
  };
}

export function getNextSyncCandidate(state: LocalState): SyncBatch | null {
  if (state.outbox.length > 0) {
    return state.outbox[0];
  }

  const pendingSales = state.sales.filter((sale) => sale.syncState === "pending");

  if (pendingSales.length === 0) {
    return null;
  }

  return createSyncBatch(state, pendingSales);
}

export function hasPendingLocalChanges(state: LocalState): boolean {
  return (
    state.sales.some((sale) => sale.syncState === "pending") || state.outbox.length > 0
  );
}
