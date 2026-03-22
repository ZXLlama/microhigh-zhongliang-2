import type { Bundle, BundleComponent, Product } from "@/lib/types";

export const SAMPLE_PRODUCTS: Product[] = [
  {
    productId: "rice-ball",
    name: "飯糰",
    priceCents: 5500,
    costCents: 2800,
    profitCents: 2700,
    category: "主食",
    isActive: true,
    sortOrder: 10,
  },
  {
    productId: "soy-milk",
    name: "豆漿",
    priceCents: 3000,
    costCents: 1200,
    profitCents: 1800,
    category: "飲料",
    isActive: true,
    sortOrder: 20,
  },
  {
    productId: "tea-egg",
    name: "茶葉蛋",
    priceCents: 1800,
    costCents: 800,
    profitCents: 1000,
    category: "小食",
    isActive: true,
    sortOrder: 30,
  },
  {
    productId: "brownie",
    name: "布朗尼",
    priceCents: 4500,
    costCents: 1800,
    profitCents: 2700,
    category: "點心",
    isActive: true,
    sortOrder: 40,
  },
  {
    productId: "lemon-tea",
    name: "檸檬紅茶",
    priceCents: 4000,
    costCents: 1500,
    profitCents: 2500,
    category: "飲料",
    isActive: true,
    sortOrder: 50,
  },
];

export const SAMPLE_BUNDLES: Bundle[] = [
  {
    bundleId: "breakfast-set",
    bundleName: "早餐套餐",
    bundlePriceCents: 7500,
    bundleCostCents: 4000,
    bundleProfitCents: 3500,
    isActive: true,
    sortOrder: 10,
  },
  {
    bundleId: "dessert-tea-set",
    bundleName: "點心飲料組",
    bundlePriceCents: 7200,
    bundleCostCents: 3300,
    bundleProfitCents: 3900,
    isActive: true,
    sortOrder: 20,
  },
  {
    bundleId: "double-egg-set",
    bundleName: "雙蛋豆漿組",
    bundlePriceCents: 6000,
    bundleCostCents: 2800,
    bundleProfitCents: 3200,
    isActive: true,
    sortOrder: 30,
  },
];

export const SAMPLE_BUNDLE_COMPONENTS: BundleComponent[] = [
  {
    bundleId: "breakfast-set",
    productId: "rice-ball",
    quantity: 1,
  },
  {
    bundleId: "breakfast-set",
    productId: "soy-milk",
    quantity: 1,
  },
  {
    bundleId: "dessert-tea-set",
    productId: "brownie",
    quantity: 1,
  },
  {
    bundleId: "dessert-tea-set",
    productId: "lemon-tea",
    quantity: 1,
  },
  {
    bundleId: "double-egg-set",
    productId: "tea-egg",
    quantity: 2,
  },
  {
    bundleId: "double-egg-set",
    productId: "soy-milk",
    quantity: 1,
  },
];
