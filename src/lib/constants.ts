export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "微high忠糧 2.0";

export const LOCAL_DB_NAME = "microhigh-zhongliang-2-db";
export const LOCAL_DB_STORE = "app-state";
export const LOCAL_DB_KEY = "local-state";
export const LOCAL_SCHEMA_VERSION = 2;
export const BACKUP_FILE_PREFIX = "microhigh-zhongliang-2-backup";
export const MAX_RECENT_ITEMS = 8;
export const MAX_SYNC_LOGS = 20;

export const TAB_ITEMS = [
  { id: "cashier", label: "收銀台" },
  { id: "products", label: "商品設定" },
  { id: "bundles", label: "組合包" },
  { id: "today", label: "今日統計" },
  { id: "spreadsheet", label: "試算表" },
  { id: "sync", label: "同步" },
] as const;

export type TabId = (typeof TAB_ITEMS)[number]["id"];

export const CSV_TEMPLATE_FILENAMES = {
  products: "products.csv",
  bundles: "bundles.csv",
  bundleComponents: "bundle_components.csv",
} as const;
