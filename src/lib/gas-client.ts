type GasEnvelope = {
  ok?: boolean;
  message?: string;
  data?: unknown;
};

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
    throw new Error(payload?.message || `GAS 請求失敗 (${response.status})`);
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
    throw new Error(envelope.message || `GAS 動作 ${action} 執行失敗`);
  }

  return envelope.data as T;
}

export function isGasConfigured(): boolean {
  return Boolean(process.env.GAS_WEBAPP_URL?.trim());
}
