import { NextResponse } from "next/server";

import { assertSpreadsheetSnapshot } from "@/lib/guards";
import { callGasAction } from "@/lib/gas-client";

export async function GET() {
  try {
    const snapshot = assertSpreadsheetSnapshot(
      await callGasAction("getLatestSnapshot", {}),
    );

    return NextResponse.json({
      ok: true,
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "無法抓取試算表資料",
      },
      {
        status: 500,
      },
    );
  }
}
