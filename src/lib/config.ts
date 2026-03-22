import { sumCents } from "@/lib/money";
import type {
  Bundle,
  BundleComponent,
  Catalog,
  CatalogMetadata,
  CatalogSource,
  CsvImportIssue,
  Product,
} from "@/lib/types";

function hashText(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createCatalogMetadata(
  source: CatalogSource,
  seed: string,
  now = new Date().toISOString(),
): CatalogMetadata {
  return {
    source,
    lastImportedAt: now,
    versionId: `${source}_${hashText(seed)}_${now.replace(/[:.]/g, "-")}`,
  };
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    productId: product.productId.trim(),
    name: product.name.trim(),
    category: product.category.trim() || "未分類",
    priceCents: Math.trunc(product.priceCents),
    costCents: Math.trunc(product.costCents),
    profitCents: Math.trunc(product.priceCents) - Math.trunc(product.costCents),
    isActive: Boolean(product.isActive),
    sortOrder: Number.isFinite(product.sortOrder) ? Math.trunc(product.sortOrder) : 0,
  };
}

function normalizeBundle(bundle: Bundle): Bundle {
  return {
    ...bundle,
    bundleId: bundle.bundleId.trim(),
    bundleName: bundle.bundleName.trim(),
    bundlePriceCents: Math.trunc(bundle.bundlePriceCents),
    bundleCostCents: Math.trunc(bundle.bundleCostCents),
    bundleProfitCents:
      Math.trunc(bundle.bundlePriceCents) - Math.trunc(bundle.bundleCostCents),
    isActive: Boolean(bundle.isActive),
    sortOrder: Number.isFinite(bundle.sortOrder) ? Math.trunc(bundle.sortOrder) : 0,
  };
}

function normalizeBundleComponent(component: BundleComponent): BundleComponent {
  return {
    ...component,
    bundleId: component.bundleId.trim(),
    productId: component.productId.trim(),
    quantity: Math.trunc(component.quantity),
  };
}

function sortProducts(products: Product[]): Product[] {
  return [...products].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name, "zh-Hant");
  });
}

function sortBundles(bundles: Bundle[]): Bundle[] {
  return [...bundles].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.bundleName.localeCompare(right.bundleName, "zh-Hant");
  });
}

export function getProductMap(catalog: Catalog): Map<string, Product> {
  return new Map(catalog.products.map((product) => [product.productId, product]));
}

export function getBundleMap(catalog: Catalog): Map<string, Bundle> {
  return new Map(catalog.bundles.map((bundle) => [bundle.bundleId, bundle]));
}

export function getBundleComponentsMap(catalog: Catalog): Map<string, BundleComponent[]> {
  const map = new Map<string, BundleComponent[]>();

  for (const component of catalog.bundleComponents) {
    const current = map.get(component.bundleId) ?? [];
    current.push(component);
    map.set(component.bundleId, current);
  }

  return map;
}

export function calculateBundleCostCents(
  bundleId: string,
  components: BundleComponent[],
  productMap: Map<string, Product>,
): number {
  const matchedComponents = components.filter((component) => component.bundleId === bundleId);

  return sumCents(
    matchedComponents.map((component) => {
      const product = productMap.get(component.productId);

      if (!product) {
        return 0;
      }

      return product.costCents * component.quantity;
    }),
  );
}

export function validateCatalogIntegrity(catalog: Catalog): CsvImportIssue[] {
  const issues: CsvImportIssue[] = [];
  const seenProductIds = new Set<string>();
  const seenBundleIds = new Set<string>();
  const seenComponents = new Set<string>();

  for (const product of catalog.products) {
    if (seenProductIds.has(product.productId)) {
      issues.push({
        file: "products",
        row: 0,
        column: "product_id",
        severity: "error",
        message: `重複的 product_id: ${product.productId}`,
      });
    }

    seenProductIds.add(product.productId);

    if (!product.productId || !product.name) {
      issues.push({
        file: "products",
        row: 0,
        column: !product.productId ? "product_id" : "name",
        severity: "error",
        message: "商品 ID 與名稱不可空白",
      });
    }

    if (product.priceCents < 0 || product.costCents < 0) {
      issues.push({
        file: "products",
        row: 0,
        column: product.priceCents < 0 ? "price" : "cost",
        severity: "error",
        message: `商品 ${product.productId} 的售價或成本不得為負數`,
      });
    }
  }

  for (const bundle of catalog.bundles) {
    if (seenBundleIds.has(bundle.bundleId)) {
      issues.push({
        file: "bundles",
        row: 0,
        column: "bundle_id",
        severity: "error",
        message: `重複的 bundle_id: ${bundle.bundleId}`,
      });
    }

    seenBundleIds.add(bundle.bundleId);

    if (!bundle.bundleId || !bundle.bundleName) {
      issues.push({
        file: "bundles",
        row: 0,
        column: !bundle.bundleId ? "bundle_id" : "bundle_name",
        severity: "error",
        message: "組合包 ID 與名稱不可空白",
      });
    }

    if (bundle.bundlePriceCents < 0) {
      issues.push({
        file: "bundles",
        row: 0,
        column: "bundle_price",
        severity: "error",
        message: `組合包 ${bundle.bundleId} 的售價不得為負數`,
      });
    }
  }

  const productMap = getProductMap(catalog);
  const bundleComponentsMap = getBundleComponentsMap(catalog);

  for (const component of catalog.bundleComponents) {
    const componentKey = `${component.bundleId}::${component.productId}`;

    if (seenComponents.has(componentKey)) {
      issues.push({
        file: "bundle_components",
        row: 0,
        column: "bundle_id,product_id",
        severity: "error",
        message: `重複的組合包內容: ${component.bundleId} / ${component.productId}`,
      });
    }

    seenComponents.add(componentKey);

    if (!seenBundleIds.has(component.bundleId)) {
      issues.push({
        file: "bundle_components",
        row: 0,
        column: "bundle_id",
        severity: "error",
        message: `bundle_components 指向不存在的 bundle_id: ${component.bundleId}`,
      });
    }

    if (!productMap.has(component.productId)) {
      issues.push({
        file: "bundle_components",
        row: 0,
        column: "product_id",
        severity: "error",
        message: `bundle_components 指向不存在的 product_id: ${component.productId}`,
      });
    }

    if (component.quantity <= 0) {
      issues.push({
        file: "bundle_components",
        row: 0,
        column: "quantity",
        severity: "error",
        message: `組合包內容數量必須大於 0: ${component.bundleId} / ${component.productId}`,
      });
    }
  }

  for (const bundle of catalog.bundles) {
    if ((bundleComponentsMap.get(bundle.bundleId) ?? []).length === 0) {
      issues.push({
        file: "bundle_components",
        row: 0,
        column: "bundle_id",
        severity: "error",
        message: `組合包 ${bundle.bundleId} 沒有任何內容物`,
      });
    }
  }

  return issues;
}

export function createCatalog(params: {
  products: Product[];
  bundles: Bundle[];
  bundleComponents: BundleComponent[];
  source: CatalogSource;
  now?: string;
}): Catalog {
  const now = params.now ?? new Date().toISOString();
  const normalizedProducts = params.products.map(normalizeProduct);
  const normalizedComponents = params.bundleComponents.map(normalizeBundleComponent);
  const productMap = new Map(
    normalizedProducts.map((product) => [product.productId, product]),
  );
  const normalizedBundles = params.bundles.map((bundle) =>
    normalizeBundle({
      ...bundle,
      bundleCostCents: calculateBundleCostCents(
        bundle.bundleId,
        normalizedComponents,
        productMap,
      ),
    }),
  );
  const seed = JSON.stringify({
    products: normalizedProducts,
    bundles: normalizedBundles,
    bundleComponents: normalizedComponents,
  });

  return {
    metadata: createCatalogMetadata(params.source, seed, now),
    products: sortProducts(normalizedProducts),
    bundles: sortBundles(normalizedBundles),
    bundleComponents: [...normalizedComponents].sort((left, right) => {
      if (left.bundleId !== right.bundleId) {
        return left.bundleId.localeCompare(right.bundleId, "en");
      }

      return left.productId.localeCompare(right.productId, "en");
    }),
  };
}
