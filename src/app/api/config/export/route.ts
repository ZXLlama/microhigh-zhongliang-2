import { NextResponse } from "next/server";

import { exportCatalogToCsv } from "@/lib/csv";
import { createCatalog } from "@/lib/config";
import {
  SAMPLE_BUNDLE_COMPONENTS,
  SAMPLE_BUNDLES,
  SAMPLE_PRODUCTS,
} from "@/lib/sample-data";

export async function GET() {
  const sampleCatalog = createCatalog({
    products: SAMPLE_PRODUCTS,
    bundles: SAMPLE_BUNDLES,
    bundleComponents: SAMPLE_BUNDLE_COMPONENTS,
    source: "sample",
  });
  const csvBundle = exportCatalogToCsv(sampleCatalog);

  return NextResponse.json({
    ok: true,
    ...csvBundle,
  });
}
