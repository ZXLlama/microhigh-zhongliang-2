import { getBundleComponentsMap, getBundleMap, getProductMap } from "@/lib/config";
import type {
  Bundle,
  BundleComponentBreakdownItem,
  BundleSummaryRow,
  Catalog,
  LocalSession,
  Product,
  ProductSummaryRow,
  SaleEvent,
  SpreadsheetSnapshot,
  SummaryMetrics,
  SyncLogRow,
} from "@/lib/types";
import { createId, itemKey } from "@/lib/utils";

function emptySummaryMetrics(): SummaryMetrics {
  return {
    saleCount: 0,
    productSaleCount: 0,
    bundleSaleCount: 0,
    productQuantity: 0,
    bundleQuantity: 0,
    bundleDrivenProductQuantity: 0,
    totalProductUnits: 0,
    revenueCents: 0,
    costCents: 0,
    profitCents: 0,
  };
}

export function summarizeSales(sales: SaleEvent[]): SummaryMetrics {
  return sales.reduce<SummaryMetrics>((summary, sale) => {
    summary.saleCount += 1;
    summary.revenueCents += sale.revenueSnapshot;
    summary.costCents += sale.costSnapshot;
    summary.profitCents += sale.profitSnapshot;

    if (sale.itemType === "product") {
      summary.productSaleCount += 1;
      summary.productQuantity += sale.quantity;
      summary.totalProductUnits += sale.quantity;
      return summary;
    }

    summary.bundleSaleCount += 1;
    summary.bundleQuantity += sale.quantity;

    const bundleDriven = sale.bundleComponentBreakdown.reduce(
      (total, component) => total + component.quantity,
      0,
    );
    summary.bundleDrivenProductQuantity += bundleDriven;
    summary.totalProductUnits += bundleDriven;

    return summary;
  }, emptySummaryMetrics());
}

export function createProductSaleEvent(params: {
  product: Product;
  quantity?: number;
  now?: string;
}): SaleEvent {
  const quantity = params.quantity ?? 1;
  const now = params.now ?? new Date().toISOString();
  const revenueSnapshot = params.product.priceCents * quantity;
  const costSnapshot = params.product.costCents * quantity;

  return {
    id: createId("sale"),
    timestamp: now,
    itemType: "product",
    itemId: params.product.productId,
    itemNameSnapshot: params.product.name,
    unitPriceSnapshot: params.product.priceCents,
    unitCostSnapshot: params.product.costCents,
    quantity,
    revenueSnapshot,
    costSnapshot,
    profitSnapshot: revenueSnapshot - costSnapshot,
    bundleComponentBreakdown: [],
    syncState: "pending",
  };
}

function buildBundleBreakdown(
  bundle: Bundle,
  catalog: Catalog,
  quantity: number,
): BundleComponentBreakdownItem[] {
  const productMap = getProductMap(catalog);
  const components = getBundleComponentsMap(catalog).get(bundle.bundleId) ?? [];

  return components.map((component) => {
    const product = productMap.get(component.productId);
    const componentQuantity = component.quantity * quantity;
    const unitCostSnapshot = product?.costCents ?? 0;
    const totalCostSnapshot = unitCostSnapshot * componentQuantity;

    return {
      productId: component.productId,
      productNameSnapshot: product?.name ?? component.productId,
      quantity: componentQuantity,
      unitCostSnapshot,
      totalCostSnapshot,
    };
  });
}

export function createBundleSaleEvent(params: {
  bundle: Bundle;
  catalog: Catalog;
  quantity?: number;
  now?: string;
}): SaleEvent {
  const quantity = params.quantity ?? 1;
  const now = params.now ?? new Date().toISOString();
  const breakdown = buildBundleBreakdown(params.bundle, params.catalog, quantity);
  const revenueSnapshot = params.bundle.bundlePriceCents * quantity;
  const costSnapshot = params.bundle.bundleCostCents * quantity;

  return {
    id: createId("sale"),
    timestamp: now,
    itemType: "bundle",
    itemId: params.bundle.bundleId,
    itemNameSnapshot: params.bundle.bundleName,
    unitPriceSnapshot: params.bundle.bundlePriceCents,
    unitCostSnapshot: params.bundle.bundleCostCents,
    quantity,
    revenueSnapshot,
    costSnapshot,
    profitSnapshot: revenueSnapshot - costSnapshot,
    bundleComponentBreakdown: breakdown,
    syncState: "pending",
  };
}

export function buildProductSummaries(
  catalog: Catalog,
  sales: SaleEvent[],
): ProductSummaryRow[] {
  const seedRows = new Map<string, ProductSummaryRow>(
    catalog.products.map((product) => [
      product.productId,
      {
        productId: product.productId,
        name: product.name,
        category: product.category,
        directQuantity: 0,
        bundleDrivenQuantity: 0,
        totalQuantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      },
    ]),
  );

  for (const sale of sales) {
    if (sale.itemType === "product") {
      const existing = seedRows.get(sale.itemId) ?? {
        productId: sale.itemId,
        name: sale.itemNameSnapshot,
        category: "未分類",
        directQuantity: 0,
        bundleDrivenQuantity: 0,
        totalQuantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      };

      existing.directQuantity += sale.quantity;
      existing.totalQuantity += sale.quantity;
      existing.revenueCents += sale.revenueSnapshot;
      existing.costCents += sale.costSnapshot;
      existing.profitCents += sale.profitSnapshot;
      seedRows.set(existing.productId, existing);
      continue;
    }

    for (const component of sale.bundleComponentBreakdown) {
      const existing = seedRows.get(component.productId) ?? {
        productId: component.productId,
        name: component.productNameSnapshot,
        category: "未分類",
        directQuantity: 0,
        bundleDrivenQuantity: 0,
        totalQuantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      };

      existing.bundleDrivenQuantity += component.quantity;
      existing.totalQuantity += component.quantity;
      seedRows.set(existing.productId, existing);
    }
  }

  return [...seedRows.values()].sort((left, right) => {
    if (left.totalQuantity !== right.totalQuantity) {
      return right.totalQuantity - left.totalQuantity;
    }

    return left.name.localeCompare(right.name, "zh-Hant");
  });
}

export function buildBundleSummaries(
  catalog: Catalog,
  sales: SaleEvent[],
): BundleSummaryRow[] {
  const seedRows = new Map<string, BundleSummaryRow>(
    catalog.bundles.map((bundle) => [
      bundle.bundleId,
      {
        bundleId: bundle.bundleId,
        name: bundle.bundleName,
        quantity: 0,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0,
      },
    ]),
  );

  for (const sale of sales) {
    if (sale.itemType !== "bundle") {
      continue;
    }

    const existing = seedRows.get(sale.itemId) ?? {
      bundleId: sale.itemId,
      name: sale.itemNameSnapshot,
      quantity: 0,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
    };

    existing.quantity += sale.quantity;
    existing.revenueCents += sale.revenueSnapshot;
    existing.costCents += sale.costSnapshot;
    existing.profitCents += sale.profitSnapshot;
    seedRows.set(existing.bundleId, existing);
  }

  return [...seedRows.values()].sort((left, right) => {
    if (left.quantity !== right.quantity) {
      return right.quantity - left.quantity;
    }

    return left.name.localeCompare(right.name, "zh-Hant");
  });
}

export function buildSpreadsheetSnapshot(params: {
  catalog: Catalog;
  sales: SaleEvent[];
  syncLogs?: SyncLogRow[];
  fetchedAt?: string;
}): SpreadsheetSnapshot {
  return {
    fetchedAt: params.fetchedAt ?? new Date().toISOString(),
    summary: summarizeSales(params.sales),
    productSummaries: buildProductSummaries(params.catalog, params.sales),
    bundleSummaries: buildBundleSummaries(params.catalog, params.sales),
    syncLogs: params.syncLogs ?? [],
  };
}

export function getRecommendedItemKeys(catalog: Catalog, sales: SaleEvent[]): string[] {
  const counts = new Map<string, number>();

  for (const sale of sales) {
    const key = itemKey(sale.itemType, sale.itemId);
    counts.set(key, (counts.get(key) ?? 0) + sale.quantity);
  }

  const fallback = [
    ...catalog.products
      .filter((product) => product.isActive)
      .map((product) => itemKey("product", product.productId)),
    ...catalog.bundles
      .filter((bundle) => bundle.isActive)
      .map((bundle) => itemKey("bundle", bundle.bundleId)),
  ];

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key)
    .concat(fallback)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 8);
}

export function createNextSession(deviceId: string, now = new Date().toISOString()): LocalSession {
  return {
    sessionId: createId("session"),
    deviceId,
    startedAt: now,
    lastUpdatedAt: now,
  };
}

export function getCatalogCounts(catalog: Catalog) {
  return {
    productCount: catalog.products.length,
    bundleCount: catalog.bundles.length,
    bundleComponentCount: catalog.bundleComponents.length,
  };
}

export function findProduct(catalog: Catalog, productId: string): Product | undefined {
  return getProductMap(catalog).get(productId);
}

export function findBundle(catalog: Catalog, bundleId: string): Bundle | undefined {
  return getBundleMap(catalog).get(bundleId);
}
