export type ItemType = "product" | "bundle";

export type SaleSyncState = "pending" | "in_flight";

export type SyncUiStatus =
  | "idle"
  | "unsynced"
  | "syncing"
  | "success"
  | "error"
  | "reset";

export type CsvFileKind = "products" | "bundles" | "bundle_components";

export type CatalogSource = "sample" | "csv" | "backup";

export interface Product {
  productId: string;
  name: string;
  priceCents: number;
  costCents: number;
  profitCents: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Bundle {
  bundleId: string;
  bundleName: string;
  bundlePriceCents: number;
  bundleCostCents: number;
  bundleProfitCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface BundleComponent {
  bundleId: string;
  productId: string;
  quantity: number;
}

export interface CatalogMetadata {
  source: CatalogSource;
  versionId: string;
  lastImportedAt: string;
}

export interface Catalog {
  metadata: CatalogMetadata;
  products: Product[];
  bundles: Bundle[];
  bundleComponents: BundleComponent[];
}

export interface BundleComponentBreakdownItem {
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unitCostSnapshot: number;
  totalCostSnapshot: number;
}

export interface SaleEvent {
  id: string;
  timestamp: string;
  itemType: ItemType;
  itemId: string;
  itemNameSnapshot: string;
  unitPriceSnapshot: number;
  unitCostSnapshot: number;
  quantity: number;
  revenueSnapshot: number;
  costSnapshot: number;
  profitSnapshot: number;
  bundleComponentBreakdown: BundleComponentBreakdownItem[];
  syncState: SaleSyncState;
}

export interface SummaryMetrics {
  saleCount: number;
  productSaleCount: number;
  bundleSaleCount: number;
  productQuantity: number;
  bundleQuantity: number;
  bundleDrivenProductQuantity: number;
  totalProductUnits: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
}

export interface ProductSummaryRow {
  productId: string;
  name: string;
  category: string;
  directQuantity: number;
  bundleDrivenQuantity: number;
  totalQuantity: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
}

export interface BundleSummaryRow {
  bundleId: string;
  name: string;
  quantity: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
}

export type SyncLogStatus = "PROCESSED" | "DUPLICATE" | "FAILED" | "PROCESSING";

export interface SyncLogRow {
  batchId: string;
  deviceId: string;
  sessionId: string;
  checksum: string;
  saleCount: number;
  status: SyncLogStatus;
  processedAt: string;
  note: string;
}

export interface SpreadsheetSnapshot {
  fetchedAt: string;
  summary: SummaryMetrics;
  productSummaries: ProductSummaryRow[];
  bundleSummaries: BundleSummaryRow[];
  syncLogs: SyncLogRow[];
}

export interface LocalSession {
  sessionId: string;
  deviceId: string;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface SyncBatch {
  batchId: string;
  deviceId: string;
  sessionId: string;
  createdAt: string;
  checksum: string;
  saleIds: string[];
  sales: SaleEvent[];
  totals: SummaryMetrics;
  status: "ready" | "uploading" | "failed";
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface SyncInfo {
  status: SyncUiStatus;
  lastSyncAt?: string;
  lastError?: string;
  lastResetAt?: string;
  lastSuccessBatchId?: string;
  inFlightBatchId?: string;
}

export interface LocalState {
  schemaVersion: number;
  appName: string;
  deviceId: string;
  catalog: Catalog;
  sales: SaleEvent[];
  outbox: SyncBatch[];
  favorites: string[];
  recentItemKeys: string[];
  syncInfo: SyncInfo;
  spreadsheetSnapshot: SpreadsheetSnapshot | null;
  currentSession: LocalSession;
  lastUndoSaleId: string | null;
}

export interface BackupPayload {
  exportedAt: string;
  state: LocalState;
}

export interface CsvImportIssue {
  file: CsvFileKind;
  row: number;
  column: string;
  severity: "error" | "warning";
  message: string;
}

export interface CatalogImportPayload {
  productsCsv: string;
  bundlesCsv: string;
  bundleComponentsCsv: string;
}

export interface CatalogValidationResult {
  catalog: Catalog | null;
  issues: CsvImportIssue[];
}

export interface UploadBatchResponse {
  ok: boolean;
  alreadyProcessed: boolean;
  batchId: string;
  message: string;
  snapshot: SpreadsheetSnapshot;
}

export interface LatestSnapshotResponse {
  ok: boolean;
  snapshot: SpreadsheetSnapshot;
}

export interface ConfigSyncResponse {
  ok: boolean;
  message: string;
  productCount: number;
  bundleCount: number;
  bundleComponentCount: number;
}

export interface HealthResponse {
  ok: boolean;
  serverTime: string;
  gasConfigured: boolean;
  appName: string;
}
