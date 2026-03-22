import { describe, expect, it } from "vitest";

import { parseCatalogImportPayload } from "../src/lib/csv";

describe("parseCatalogImportPayload", () => {
  it("imports valid csv and derives bundle cost/profit", () => {
    const result = parseCatalogImportPayload({
      productsCsv: `product_id,name,price,cost,profit,category,is_active,sort_order
rice-ball,飯糰,55,28,27,主食,true,10
soy-milk,豆漿,30,12,18,飲料,true,20`,
      bundlesCsv: `bundle_id,bundle_name,bundle_price,is_active,sort_order
breakfast-set,早餐套餐,75,true,10`,
      bundleComponentsCsv: `bundle_id,product_id,quantity
breakfast-set,rice-ball,1
breakfast-set,soy-milk,1`,
    });

    expect(result.catalog).not.toBeNull();
    expect(
      result.issues.filter((issue) => issue.severity === "error"),
    ).toHaveLength(0);
    expect(result.catalog?.bundles[0].bundleCostCents).toBe(4000);
    expect(result.catalog?.bundles[0].bundleProfitCents).toBe(3500);
  });

  it("reports duplicate ids as errors", () => {
    const result = parseCatalogImportPayload({
      productsCsv: `product_id,name,price,cost,profit,category,is_active,sort_order
tea-egg,茶葉蛋,18,8,10,小食,true,10
tea-egg,雙份茶葉蛋,18,8,10,小食,true,20`,
      bundlesCsv: `bundle_id,bundle_name,bundle_price,is_active,sort_order
double-egg-set,雙蛋組,36,true,10`,
      bundleComponentsCsv: `bundle_id,product_id,quantity
double-egg-set,tea-egg,2`,
    });

    expect(result.catalog).toBeNull();
    expect(
      result.issues.some(
        (issue) =>
          issue.severity === "error" && issue.message.includes("重複的 product_id"),
      ),
    ).toBe(true);
  });
});
