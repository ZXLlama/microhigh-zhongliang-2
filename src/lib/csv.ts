import Papa from "papaparse";

import { createCatalog, validateCatalogIntegrity } from "@/lib/config";
import { parseMoneyInputToCents } from "@/lib/money";
import type {
  Bundle,
  BundleComponent,
  Catalog,
  CatalogImportPayload,
  CatalogValidationResult,
  CsvFileKind,
  CsvImportIssue,
  Product,
} from "@/lib/types";

type CsvRow = Record<string, string>;

const PRODUCT_COLUMNS = [
  "product_id",
  "name",
  "price",
  "cost",
  "profit",
  "category",
  "is_active",
  "sort_order",
] as const;

const BUNDLE_COLUMNS = [
  "bundle_id",
  "bundle_name",
  "bundle_price",
  "is_active",
  "sort_order",
] as const;

const BUNDLE_COMPONENT_COLUMNS = [
  "bundle_id",
  "product_id",
  "quantity",
] as const;

function pushIssue(
  issues: CsvImportIssue[],
  file: CsvFileKind,
  row: number,
  column: string,
  message: string,
  severity: "error" | "warning" = "error",
) {
  issues.push({
    file,
    row,
    column,
    message,
    severity,
  });
}

function parseCsvRows(
  csvText: string,
  file: CsvFileKind,
  expectedColumns: readonly string[],
): { rows: CsvRow[]; issues: CsvImportIssue[] } {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });
  const issues: CsvImportIssue[] = [];

  for (const error of parsed.errors) {
    pushIssue(
      issues,
      file,
      (error.row ?? 0) + 1,
      "csv",
      `CSV 解析失敗: ${error.message}`,
    );
  }

  const headers = parsed.meta.fields ?? [];
  for (const column of expectedColumns) {
    if (!headers.includes(column)) {
      pushIssue(issues, file, 1, column, `缺少必要欄位 ${column}`);
    }
  }

  return {
    rows: parsed.data,
    issues,
  };
}

function parseBooleanCell(
  value: string,
  issues: CsvImportIssue[],
  file: CsvFileKind,
  row: number,
  column: string,
): boolean {
  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  pushIssue(issues, file, row, column, "布林值需為 true/false、1/0、yes/no");
  return false;
}

function parseIntegerCell(
  value: string,
  issues: CsvImportIssue[],
  file: CsvFileKind,
  row: number,
  column: string,
  options?: { min?: number },
): number {
  if (value === "") {
    pushIssue(issues, file, row, column, "此欄位不可空白");
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    pushIssue(issues, file, row, column, "需為整數");
    return 0;
  }

  if (options?.min !== undefined && parsed < options.min) {
    pushIssue(issues, file, row, column, `需大於或等於 ${options.min}`);
  }

  return parsed;
}

function parseMoneyCell(
  value: string,
  issues: CsvImportIssue[],
  file: CsvFileKind,
  row: number,
  column: string,
): number {
  if (value === "") {
    pushIssue(issues, file, row, column, "金額不可空白");
    return 0;
  }

  try {
    return parseMoneyInputToCents(value);
  } catch (error) {
    pushIssue(
      issues,
      file,
      row,
      column,
      error instanceof Error ? error.message : "金額格式錯誤",
    );
    return 0;
  }
}

function parseProductsCsv(csvText: string): { products: Product[]; issues: CsvImportIssue[] } {
  const { rows, issues } = parseCsvRows(csvText, "products", PRODUCT_COLUMNS);
  const products: Product[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const productId = row.product_id?.trim() ?? "";
    const name = row.name?.trim() ?? "";
    const category = row.category?.trim() ?? "未分類";
    const priceCents = parseMoneyCell(row.price ?? "", issues, "products", rowNumber, "price");
    const costCents = parseMoneyCell(row.cost ?? "", issues, "products", rowNumber, "cost");
    const sortOrder = parseIntegerCell(
      row.sort_order ?? "",
      issues,
      "products",
      rowNumber,
      "sort_order",
      { min: 0 },
    );
    const isActive = parseBooleanCell(
      row.is_active ?? "",
      issues,
      "products",
      rowNumber,
      "is_active",
    );

    if (!productId) {
      pushIssue(issues, "products", rowNumber, "product_id", "product_id 不可空白");
    }

    if (!name) {
      pushIssue(issues, "products", rowNumber, "name", "商品名稱不可空白");
    }

    if (row.profit) {
      try {
        const profitCents = parseMoneyInputToCents(row.profit);
        const derived = priceCents - costCents;
        if (profitCents !== derived) {
          pushIssue(
            issues,
            "products",
            rowNumber,
            "profit",
            "profit 欄位與 price - cost 不一致，系統會以自動計算結果為準",
            "warning",
          );
        }
      } catch {
        pushIssue(
          issues,
          "products",
          rowNumber,
          "profit",
          "profit 欄位格式錯誤，系統會以自動計算結果為準",
          "warning",
        );
      }
    }

    products.push({
      productId,
      name,
      priceCents,
      costCents,
      profitCents: priceCents - costCents,
      category,
      isActive,
      sortOrder,
    });
  });

  return { products, issues };
}

function parseBundlesCsv(csvText: string): { bundles: Bundle[]; issues: CsvImportIssue[] } {
  const { rows, issues } = parseCsvRows(csvText, "bundles", BUNDLE_COLUMNS);
  const bundles: Bundle[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const bundleId = row.bundle_id?.trim() ?? "";
    const bundleName = row.bundle_name?.trim() ?? "";
    const bundlePriceCents = parseMoneyCell(
      row.bundle_price ?? "",
      issues,
      "bundles",
      rowNumber,
      "bundle_price",
    );
    const sortOrder = parseIntegerCell(
      row.sort_order ?? "",
      issues,
      "bundles",
      rowNumber,
      "sort_order",
      { min: 0 },
    );
    const isActive = parseBooleanCell(
      row.is_active ?? "",
      issues,
      "bundles",
      rowNumber,
      "is_active",
    );

    if (!bundleId) {
      pushIssue(issues, "bundles", rowNumber, "bundle_id", "bundle_id 不可空白");
    }

    if (!bundleName) {
      pushIssue(issues, "bundles", rowNumber, "bundle_name", "組合包名稱不可空白");
    }

    bundles.push({
      bundleId,
      bundleName,
      bundlePriceCents,
      bundleCostCents: 0,
      bundleProfitCents: bundlePriceCents,
      isActive,
      sortOrder,
    });
  });

  return { bundles, issues };
}

function parseBundleComponentsCsv(
  csvText: string,
): { bundleComponents: BundleComponent[]; issues: CsvImportIssue[] } {
  const { rows, issues } = parseCsvRows(
    csvText,
    "bundle_components",
    BUNDLE_COMPONENT_COLUMNS,
  );
  const bundleComponents: BundleComponent[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const bundleId = row.bundle_id?.trim() ?? "";
    const productId = row.product_id?.trim() ?? "";
    const quantity = parseIntegerCell(
      row.quantity ?? "",
      issues,
      "bundle_components",
      rowNumber,
      "quantity",
      { min: 1 },
    );

    if (!bundleId) {
      pushIssue(
        issues,
        "bundle_components",
        rowNumber,
        "bundle_id",
        "bundle_id 不可空白",
      );
    }

    if (!productId) {
      pushIssue(
        issues,
        "bundle_components",
        rowNumber,
        "product_id",
        "product_id 不可空白",
      );
    }

    bundleComponents.push({
      bundleId,
      productId,
      quantity,
    });
  });

  return { bundleComponents, issues };
}

export function parseCatalogImportPayload(
  payload: CatalogImportPayload,
): CatalogValidationResult {
  const productResult = parseProductsCsv(payload.productsCsv);
  const bundleResult = parseBundlesCsv(payload.bundlesCsv);
  const bundleComponentResult = parseBundleComponentsCsv(payload.bundleComponentsCsv);
  const issues = [
    ...productResult.issues,
    ...bundleResult.issues,
    ...bundleComponentResult.issues,
  ];
  const catalog = createCatalog({
    products: productResult.products,
    bundles: bundleResult.bundles,
    bundleComponents: bundleComponentResult.bundleComponents,
    source: "csv",
  });

  issues.push(...validateCatalogIntegrity(catalog));

  const hasErrors = issues.some((issue) => issue.severity === "error");

  return {
    catalog: hasErrors ? null : catalog,
    issues,
  };
}

function booleanToCsv(value: boolean): string {
  return value ? "true" : "false";
}

export function exportCatalogToCsv(catalog: Catalog): {
  productsCsv: string;
  bundlesCsv: string;
  bundleComponentsCsv: string;
} {
  return {
    productsCsv: Papa.unparse(
      catalog.products.map((product) => ({
        product_id: product.productId,
        name: product.name,
        price: product.priceCents / 100,
        cost: product.costCents / 100,
        profit: product.profitCents / 100,
        category: product.category,
        is_active: booleanToCsv(product.isActive),
        sort_order: product.sortOrder,
      })),
      { columns: [...PRODUCT_COLUMNS] },
    ),
    bundlesCsv: Papa.unparse(
      catalog.bundles.map((bundle) => ({
        bundle_id: bundle.bundleId,
        bundle_name: bundle.bundleName,
        bundle_price: bundle.bundlePriceCents / 100,
        is_active: booleanToCsv(bundle.isActive),
        sort_order: bundle.sortOrder,
      })),
      { columns: [...BUNDLE_COLUMNS] },
    ),
    bundleComponentsCsv: Papa.unparse(
      catalog.bundleComponents.map((component) => ({
        bundle_id: component.bundleId,
        product_id: component.productId,
        quantity: component.quantity,
      })),
      { columns: [...BUNDLE_COMPONENT_COLUMNS] },
    ),
  };
}
