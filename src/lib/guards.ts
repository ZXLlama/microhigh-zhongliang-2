import type {
  BackupPayload,
  Bundle,
  BundleComponent,
  Catalog,
  CatalogImportPayload,
  LocalState,
  Product,
  SaleEvent,
  SpreadsheetSnapshot,
  SummaryMetrics,
  SyncBatch,
  SyncLogRow,
} from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    isString(value.productId) &&
    isString(value.name) &&
    isNumber(value.priceCents) &&
    isNumber(value.costCents) &&
    isNumber(value.profitCents) &&
    isString(value.category) &&
    isBoolean(value.isActive) &&
    isNumber(value.sortOrder)
  );
}

function isBundle(value: unknown): value is Bundle {
  return (
    isRecord(value) &&
    isString(value.bundleId) &&
    isString(value.bundleName) &&
    isNumber(value.bundlePriceCents) &&
    isNumber(value.bundleCostCents) &&
    isNumber(value.bundleProfitCents) &&
    isBoolean(value.isActive) &&
    isNumber(value.sortOrder)
  );
}

function isBundleComponent(value: unknown): value is BundleComponent {
  return (
    isRecord(value) &&
    isString(value.bundleId) &&
    isString(value.productId) &&
    isNumber(value.quantity)
  );
}

function isCatalog(value: unknown): value is Catalog {
  return (
    isRecord(value) &&
    isRecord(value.metadata) &&
    isString(value.metadata.source) &&
    isString(value.metadata.versionId) &&
    isString(value.metadata.lastImportedAt) &&
    Array.isArray(value.products) &&
    value.products.every(isProduct) &&
    Array.isArray(value.bundles) &&
    value.bundles.every(isBundle) &&
    Array.isArray(value.bundleComponents) &&
    value.bundleComponents.every(isBundleComponent)
  );
}

function isSaleEvent(value: unknown): value is SaleEvent {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.timestamp) &&
    (value.itemType === "product" || value.itemType === "bundle") &&
    isString(value.itemId) &&
    isString(value.itemNameSnapshot) &&
    isNumber(value.unitPriceSnapshot) &&
    isNumber(value.unitCostSnapshot) &&
    isNumber(value.quantity) &&
    isNumber(value.revenueSnapshot) &&
    isNumber(value.costSnapshot) &&
    isNumber(value.profitSnapshot) &&
    Array.isArray(value.bundleComponentBreakdown) &&
    value.bundleComponentBreakdown.every(
      (component) =>
        isRecord(component) &&
        isString(component.productId) &&
        isString(component.productNameSnapshot) &&
        isNumber(component.quantity) &&
        isNumber(component.unitCostSnapshot) &&
        isNumber(component.totalCostSnapshot),
    ) &&
    (value.syncState === "pending" || value.syncState === "in_flight")
  );
}

function isSummaryMetrics(value: unknown): value is SummaryMetrics {
  return (
    isRecord(value) &&
    isNumber(value.saleCount) &&
    isNumber(value.productSaleCount) &&
    isNumber(value.bundleSaleCount) &&
    isNumber(value.productQuantity) &&
    isNumber(value.bundleQuantity) &&
    isNumber(value.bundleDrivenProductQuantity) &&
    isNumber(value.totalProductUnits) &&
    isNumber(value.revenueCents) &&
    isNumber(value.costCents) &&
    isNumber(value.profitCents)
  );
}

function isSyncLogRow(value: unknown): value is SyncLogRow {
  return (
    isRecord(value) &&
    isString(value.batchId) &&
    isString(value.deviceId) &&
    isString(value.sessionId) &&
    isString(value.checksum) &&
    isNumber(value.saleCount) &&
    isString(value.status) &&
    isString(value.processedAt) &&
    isString(value.note)
  );
}

export function isSpreadsheetSnapshot(value: unknown): value is SpreadsheetSnapshot {
  return (
    isRecord(value) &&
    isString(value.fetchedAt) &&
    isSummaryMetrics(value.summary) &&
    Array.isArray(value.productSummaries) &&
    value.productSummaries.every(
      (row) =>
        isRecord(row) &&
        isString(row.productId) &&
        isString(row.name) &&
        isString(row.category) &&
        isNumber(row.directQuantity) &&
        isNumber(row.bundleDrivenQuantity) &&
        isNumber(row.totalQuantity) &&
        isNumber(row.revenueCents) &&
        isNumber(row.costCents) &&
        isNumber(row.profitCents),
    ) &&
    Array.isArray(value.bundleSummaries) &&
    value.bundleSummaries.every(
      (row) =>
        isRecord(row) &&
        isString(row.bundleId) &&
        isString(row.name) &&
        isNumber(row.quantity) &&
        isNumber(row.revenueCents) &&
        isNumber(row.costCents) &&
        isNumber(row.profitCents),
    ) &&
    Array.isArray(value.syncLogs) &&
    value.syncLogs.every(isSyncLogRow)
  );
}

export function isSyncBatch(value: unknown): value is SyncBatch {
  return (
    isRecord(value) &&
    isString(value.batchId) &&
    isString(value.deviceId) &&
    isString(value.sessionId) &&
    isString(value.createdAt) &&
    isString(value.checksum) &&
    Array.isArray(value.saleIds) &&
    value.saleIds.every(isString) &&
    Array.isArray(value.sales) &&
    value.sales.every(isSaleEvent) &&
    isSummaryMetrics(value.totals) &&
    (value.status === "ready" || value.status === "uploading" || value.status === "failed") &&
    isNumber(value.attempts) &&
    (value.lastAttemptAt === undefined || isString(value.lastAttemptAt)) &&
    (value.lastError === undefined || isString(value.lastError))
  );
}

export function isCatalogImportPayload(value: unknown): value is CatalogImportPayload {
  return (
    isRecord(value) &&
    isString(value.productsCsv) &&
    isString(value.bundlesCsv) &&
    isString(value.bundleComponentsCsv)
  );
}

export function isLocalState(value: unknown): value is LocalState {
  const legacyLastUndoSaleId =
    isRecord(value) && (value.lastUndoSaleId === null || isString(value.lastUndoSaleId));
  const lastUndoSaleIdsValid =
    isRecord(value) &&
    ((value.lastUndoSaleIds === undefined && legacyLastUndoSaleId) ||
      isStringArray(value.lastUndoSaleIds));

  return (
    isRecord(value) &&
    isNumber(value.schemaVersion) &&
    isString(value.appName) &&
    isString(value.deviceId) &&
    isCatalog(value.catalog) &&
    Array.isArray(value.sales) &&
    value.sales.every(isSaleEvent) &&
    Array.isArray(value.outbox) &&
    value.outbox.every(isSyncBatch) &&
    (value.favorites === undefined || isStringArray(value.favorites)) &&
    (value.recentItemKeys === undefined || isStringArray(value.recentItemKeys)) &&
    isRecord(value.syncInfo) &&
    isString(value.syncInfo.status) &&
    (value.syncInfo.lastSyncAt === undefined || isString(value.syncInfo.lastSyncAt)) &&
    (value.syncInfo.lastError === undefined || isString(value.syncInfo.lastError)) &&
    (value.syncInfo.lastResetAt === undefined || isString(value.syncInfo.lastResetAt)) &&
    (value.syncInfo.lastSuccessBatchId === undefined ||
      isString(value.syncInfo.lastSuccessBatchId)) &&
    (value.syncInfo.inFlightBatchId === undefined ||
      isString(value.syncInfo.inFlightBatchId)) &&
    (value.spreadsheetSnapshot === null ||
      value.spreadsheetSnapshot === undefined ||
      isSpreadsheetSnapshot(value.spreadsheetSnapshot)) &&
    isRecord(value.currentSession) &&
    isString(value.currentSession.sessionId) &&
    isString(value.currentSession.deviceId) &&
    isString(value.currentSession.startedAt) &&
    isString(value.currentSession.lastUpdatedAt) &&
    lastUndoSaleIdsValid
  );
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  return isRecord(value) && isString(value.exportedAt) && isLocalState(value.state);
}

export function assertSyncBatch(value: unknown): SyncBatch {
  if (!isSyncBatch(value)) {
    throw new Error("同步批次資料格式不正確");
  }

  return value;
}

export function assertCatalogImportPayload(value: unknown): CatalogImportPayload {
  if (!isCatalogImportPayload(value)) {
    throw new Error("CSV 匯入資料格式不正確");
  }

  return value;
}

export function assertCatalog(value: unknown): Catalog {
  if (!isCatalog(value)) {
    throw new Error("商品設定資料格式不正確");
  }

  return value;
}

export function assertSpreadsheetSnapshot(value: unknown): SpreadsheetSnapshot {
  if (!isSpreadsheetSnapshot(value)) {
    throw new Error("試算表快照資料格式不正確");
  }

  return value;
}

export function assertBackupPayload(value: unknown): BackupPayload {
  if (!isBackupPayload(value)) {
    throw new Error("備份檔格式不正確");
  }

  return value;
}

export function assertLocalState(value: unknown): LocalState {
  if (!isLocalState(value)) {
    throw new Error("本地狀態資料格式不正確");
  }

  return value;
}
