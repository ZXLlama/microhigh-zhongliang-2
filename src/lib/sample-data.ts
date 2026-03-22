import type { Bundle, BundleComponent, Product } from "@/lib/types";

export const SAMPLE_PRODUCTS: Product[] = [
  {
    productId: "galaxy-sprite",
    name: "星空冷飲",
    priceCents: 7000,
    costCents: 1000,
    profitCents: 6000,
    category: "飲料",
    isActive: true,
    sortOrder: 10,
  },
  {
    productId: "sprite",
    name: "雪碧",
    priceCents: 3000,
    costCents: 500,
    profitCents: 2500,
    category: "飲料",
    isActive: true,
    sortOrder: 20,
  },
  {
    productId: "black-tea",
    name: "紅茶",
    priceCents: 3000,
    costCents: 500,
    profitCents: 2500,
    category: "飲料",
    isActive: true,
    sortOrder: 30,
  },
  {
    productId: "winter-melon-tea",
    name: "冬瓜茶",
    priceCents: 3000,
    costCents: 500,
    profitCents: 2500,
    category: "飲料",
    isActive: true,
    sortOrder: 40,
  },
  {
    productId: "popcorn",
    name: "爆米花",
    priceCents: 2000,
    costCents: 500,
    profitCents: 1500,
    category: "點心",
    isActive: true,
    sortOrder: 50,
  },
];

export const SAMPLE_BUNDLES: Bundle[] = [
  {
    bundleId: "A-set",
    bundleName: "星空冷飲+爆米花",
    bundlePriceCents: 8000,
    bundleCostCents: 1500,
    bundleProfitCents: 6500,
    isActive: true,
    sortOrder: 10,
  },
  {
    bundleId: "B-set",
    bundleName: "紅茶+爆米花",
    bundlePriceCents: 4000,
    bundleCostCents: 1000,
    bundleProfitCents: 3000,
    isActive: true,
    sortOrder: 20,
  },
  {
    bundleId: "C-set",
    bundleName: "冬瓜茶+爆米花",
    bundlePriceCents: 4000,
    bundleCostCents: 1500,
    bundleProfitCents: 2500,
    isActive: true,
    sortOrder: 30,
  },
];

export const SAMPLE_BUNDLE_COMPONENTS: BundleComponent[] = [
  {
    bundleId: "A-set",
    productId: "galaxy-sprite",
    quantity: 1,
  },
  {
    bundleId: "A-set",
    productId: "popcorn",
    quantity: 1,
  },
  {
    bundleId: "B-set",
    productId: "black-tea",
    quantity: 1,
  },
  {
    bundleId: "B-set",
    productId: "popcorn",
    quantity: 1,
  },
  {
    bundleId: "C-set",
    productId: "winter-melon-tea",
    quantity: 2,
  },
  {
    bundleId: "C-set",
    productId: "popcorn",
    quantity: 1,
  },
];
