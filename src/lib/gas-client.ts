type GasEnvelope = {
  ok?: boolean;
  message?: string;
  data?: unknown;
};

function normalizeGasErrorMessage(message: string): string {
  if (
    message.includes("Cannot read properties of null (reading 'getSheetByName')") ||
    message.includes("No spreadsheet connected")
  ) {
    return (
      "GAS 尚未正確連到 Google 試算表。請將目前部署中的 Apps Script 更新為 repo 內最新版 gas/Code.gs；" +
      "若你使用的是獨立 GAS 專案，還需要在 Script Properties 設定 SPREADSHEET_ID，之後重新部署 Web App。"
    );
  }

  return message;
}

function getGasUrl(): string {
  const url = process.env.GAS_WEBAPP_URL?.trim();

  if (!url) {
    throw new Error("缺少環境變數 GAS_WEBAPP_URL");
  }

  return url;
}

async function parseGasEnvelope(response: Response): Promise<GasEnvelope> {
  const payload = (await response.json().catch(() => null)) as GasEnvelope | null;

  if (!response.ok) {
    throw new Error(
      normalizeGasErrorMessage(
        payload?.message || `GAS 請求失敗 (${response.status})`,
      ),
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("GAS 回傳格式不正確");
  }

  return payload;
}

export async function callGasAction<T>(action: string, payload: unknown): Promise<T> {
  const response = await fetch(getGasUrl(), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });
  const envelope = await parseGasEnvelope(response);

  if (!envelope.ok) {
    throw new Error(
      normalizeGasErrorMessage(
        envelope.message || `GAS 動作 ${action} 執行失敗`,
      ),
    );
  }

  return envelope.data as T;
}

export function isGasConfigured(): boolean {
  return Boolean(process.env.GAS_WEBAPP_URL?.trim());
}
