import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import {
  LOCAL_DB_KEY,
  LOCAL_DB_NAME,
  LOCAL_DB_STORE,
} from "@/lib/constants";
import { assertBackupPayload } from "@/lib/guards";
import type { BackupPayload, LocalState } from "@/lib/types";
import { safeJsonParse } from "@/lib/utils";

interface PosDb extends DBSchema {
  [LOCAL_DB_STORE]: {
    key: string;
    value: LocalState;
  };
}

let databasePromise: Promise<IDBPDatabase<PosDb>> | null = null;

async function getDatabase() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("IndexedDB 僅能在瀏覽器環境使用");
  }

  if (!databasePromise) {
    databasePromise = openDB<PosDb>(LOCAL_DB_NAME, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(LOCAL_DB_STORE)) {
          database.createObjectStore(LOCAL_DB_STORE);
        }
      },
    });
  }

  return databasePromise;
}

export async function loadPersistedState(): Promise<LocalState | null> {
  const database = await getDatabase();
  return (await database.get(LOCAL_DB_STORE, LOCAL_DB_KEY)) ?? null;
}

export async function savePersistedState(state: LocalState): Promise<void> {
  const database = await getDatabase();
  await database.put(LOCAL_DB_STORE, state, LOCAL_DB_KEY);
}

export async function clearPersistedState(): Promise<void> {
  const database = await getDatabase();
  await database.delete(LOCAL_DB_STORE, LOCAL_DB_KEY);
}

export function buildBackupPayload(state: LocalState): BackupPayload {
  return {
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function serializeBackupPayload(state: LocalState): string {
  return JSON.stringify(buildBackupPayload(state), null, 2);
}

export function parseBackupPayload(jsonText: string): BackupPayload {
  const parsed = safeJsonParse<unknown>(jsonText);

  if (!parsed) {
    throw new Error("備份 JSON 解析失敗");
  }

  return assertBackupPayload(parsed);
}
