import { NextResponse } from "next/server";

import { APP_NAME } from "@/lib/constants";
import { isGasConfigured } from "@/lib/gas-client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    serverTime: new Date().toISOString(),
    gasConfigured: isGasConfigured(),
    appName: APP_NAME,
  });
}
