import { NextRequest, NextResponse } from "next/server";

import { parseCatalogImportPayload } from "@/lib/csv";
import { assertCatalogImportPayload } from "@/lib/guards";

export async function POST(request: NextRequest) {
  try {
    const payload = assertCatalogImportPayload(await request.json());
    const result = parseCatalogImportPayload(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        catalog: null,
        issues: [
          {
            file: "products",
            row: 1,
            column: "csv",
            severity: "error",
            message: error instanceof Error ? error.message : "CSV 匯入失敗",
          },
        ],
      },
      {
        status: 400,
      },
    );
  }
}
