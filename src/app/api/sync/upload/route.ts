import { NextRequest, NextResponse } from "next/server";

import { assertSpreadsheetSnapshot, assertSyncBatch } from "@/lib/guards";
import { callGasAction } from "@/lib/gas-client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { batch?: unknown };
    const batch = assertSyncBatch(body.batch);
    const result = (await callGasAction("uploadSalesBatch", {
      batch,
    })) as {
      alreadyProcessed?: boolean;
      batchId?: string;
      message?: string;
      snapshot?: unknown;
    };
    const snapshot = assertSpreadsheetSnapshot(result.snapshot);

    return NextResponse.json({
      ok: true,
      alreadyProcessed: Boolean(result.alreadyProcessed),
      batchId: result.batchId ?? batch.batchId,
      message: result.message ?? "同步完成",
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "同步上傳失敗",
      },
      {
        status: 500,
      },
    );
  }
}
