import { describe, expect, it } from "vitest";

import { buildSpreadsheetSnapshot, createBundleSaleEvent } from "../src/lib/sales";
import { createInitialLocalState, localStateReducer } from "../src/lib/state";
import { getNextSyncCandidate } from "../src/lib/sync";

describe("sync flow", () => {
  it("counts bundle-driven quantities and resets after successful upload", () => {
    const initial = createInitialLocalState("device_test", "2026-03-22T10:00:00.000Z");
    const bundle = initial.catalog.bundles.find(
      (item) => item.bundleId === "double-egg-set",
    );

    if (!bundle) {
      throw new Error("sample bundle not found");
    }

    const sale = createBundleSaleEvent({
      bundle,
      catalog: initial.catalog,
      now: "2026-03-22T10:05:00.000Z",
    });
    const withSale = localStateReducer(initial, {
      type: "addSale",
      payload: sale,
    });
    const batch = getNextSyncCandidate(withSale);

    if (!batch) {
      throw new Error("expected sync batch");
    }

    expect(batch.totals.bundleQuantity).toBe(1);
    expect(batch.totals.bundleDrivenProductQuantity).toBe(3);
    expect(batch.totals.totalProductUnits).toBe(3);

    const prepared = localStateReducer(withSale, {
      type: "prepareBatch",
      payload: batch,
    });
    const snapshot = buildSpreadsheetSnapshot({
      catalog: initial.catalog,
      sales: [sale],
    });
    const completed = localStateReducer(prepared, {
      type: "completeBatch",
      payload: {
        batchId: batch.batchId,
        now: "2026-03-22T11:00:00.000Z",
        snapshot,
      },
    });

    expect(completed.sales).toHaveLength(0);
    expect(completed.outbox).toHaveLength(0);
    expect(completed.syncInfo.status).toBe("reset");
    expect(completed.spreadsheetSnapshot?.summary.bundleQuantity).toBe(1);
  });
});
