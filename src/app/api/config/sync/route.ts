import { NextRequest, NextResponse } from "next/server";

import { getCatalogCounts } from "@/lib/sales";
import { assertCatalog } from "@/lib/guards";
import { callGasAction } from "@/lib/gas-client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { catalog?: unknown };
    const catalog = assertCatalog(body.catalog);
    const result = (await callGasAction("syncCatalog", {
      catalog,
    })) as {
      message?: string;
      productCount?: number;
      bundleCount?: number;
      bundleComponentCount?: number;
    };
    const counts = getCatalogCounts(catalog);

    return NextResponse.json({
      ok: true,
      message: result.message ?? "設定已同步到試算表",
      productCount: result.productCount ?? counts.productCount,
      bundleCount: result.bundleCount ?? counts.bundleCount,
      bundleComponentCount:
        result.bundleComponentCount ?? counts.bundleComponentCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "設定同步失敗",
      },
      {
        status: 500,
      },
    );
  }
}
