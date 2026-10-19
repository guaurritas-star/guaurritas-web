import { halloweenPrice } from "@/lib/seasonal-promotions";
import type { FulfillmentMode } from "@/lib/fulfillment-store";

export const NATIONAL_COMMERCE = {
  minimumOrderMxn: 299,
  minimumOrderGraceMxn: 5,
  standardShippingMxn: 79,
  freeShippingThresholdMxn: 899,
  maxStandardWeightKg: 4.9,
} as const;

const NATIONAL_OPTION_PRICES: Record<string, readonly number[]> = {
  "happy-bag": [99, 99, 99, 99],
  sazonadores: [139, 139],
  sticks: [95],
  "happy-box": [185, 239],
  gorrito: [59],
  velitas: [15, 49],
  pancarta: [95],
};

const NATIONAL_COOKIE_PRICES = new Map<number, number>([
  [300, 209],
  [400, 269],
  [500, 349],
  [600, 409],
  [700, 469],
  [800, 539],
  [900, 599],
  [1000, 679],
  [1100, 749],
  [1200, 809],
  [1300, 879],
  [1400, 949],
  [1500, 1009],
  [1600, 1079],
  [1700, 1149],
  [1800, 1219],
  [1900, 1279],
  [2000, 1279],
  [2100, 1349],
  [2200, 1409],
  [2300, 1469],
  [2400, 1539],
  [2500, 1599],
  [2600, 1669],
  [2700, 1729],
  [2800, 1789],
  [2900, 1859],
  [3000, 1919],
  [3100, 1979],
  [3200, 2049],
  [3300, 2109],
  [3400, 2179],
  [3500, 2239],
  [3600, 2299],
  [3700, 2369],
  [3800, 2429],
  [3900, 2499],
  [4000, 2559],
  [4100, 2619],
  [4200, 2689],
  [4300, 2749],
  [4400, 2809],
  [4500, 2879],
  [4600, 2939],
  [4700, 3009],
  [4800, 3069],
  [4900, 3129],
]);

export function getNationalCookiePrice(grams: number, fallbackPrice: number) {
  return NATIONAL_COOKIE_PRICES.get(grams) ?? fallbackPrice;
}

export function getCuisineRegularOptionPrice(
  productId: string,
  optionIndex: number,
  localPrice: number,
  fulfillment: FulfillmentMode,
) {
  if (productId === "guaurricookies") {
    const grams = [300, 400, 500, 1000][optionIndex];
    return getCuisineCookiePrice(grams, localPrice, fulfillment);
  }
  return fulfillment === "national" ? NATIONAL_OPTION_PRICES[productId]?.[optionIndex] ?? localPrice : localPrice;
}

export function getCuisineOptionPrice(productId: string, optionIndex: number, localPrice: number, fulfillment: FulfillmentMode) {
  return halloweenPrice(productId, getCuisineRegularOptionPrice(productId, optionIndex, localPrice, fulfillment));
}

export function getCuisineCookiePrice(
  grams: number,
  localPrice: number,
  fulfillment: FulfillmentMode,
) {
  return fulfillment === "national" ? getNationalCookiePrice(grams, localPrice) : Math.round(grams * 0.6 * 100) / 100;
}

export function getNationalPriceForCartItemId(id: string, fallbackPrice: number) {
  const parts = id.split(":");
  if (parts[0] !== "cuisine") return fallbackPrice;

  const productId = parts[1];

  if (productId === "guaurricookies") {
    const grams = Number(parts[2]);
    return Number.isFinite(grams)
      ? getNationalCookiePrice(grams, fallbackPrice)
      : fallbackPrice;
  }

  if (productId === "gorrito") {
    return NATIONAL_OPTION_PRICES.gorrito[0] ?? fallbackPrice;
  }

  const optionIndex = Number(parts[2]);
  if (!Number.isInteger(optionIndex) || optionIndex < 0) return fallbackPrice;

  const basePrice = NATIONAL_OPTION_PRICES[productId]?.[optionIndex];
  return basePrice === undefined ? fallbackPrice : halloweenPrice(productId, basePrice);
}

/** Regular catalogue price for before/after labels and persisted cart refresh. */
export function getCartRegularPrice(id: string, localBase: number, savedPrice: number, fulfillment: FulfillmentMode) {
  const parts = id.split(":");
  if (parts[0] === "couture") {
    const index = ["mini", "chica", "mediana", "grande", "xl"].indexOf(parts[3]);
    return index < 0 ? savedPrice : (fulfillment === "national" ? [249, 309, 359, 409, 479] : [219, 279, 329, 379, 439])[index];
  }
  if (parts[0] !== "cuisine") return savedPrice;
  if (parts[1] === "guaurricookies") return getCuisineCookiePrice(Number(parts[2]), localBase, fulfillment);
  if (parts[1] === "guaurricookies-kit") return 299;
  if (parts[1] === "gorrito" && fulfillment === "national") return NATIONAL_OPTION_PRICES.gorrito[0];
  return getCuisineRegularOptionPrice(parts[1], Number(parts[2]), localBase, fulfillment);
}

/** Refresh saved items without changing quantity, configuration or delivery. */
export function getCurrentCartPrice(id: string, localBase: number, savedPrice: number, fulfillment: FulfillmentMode) {
  const parts = id.split(":");
  return halloweenPrice(parts[0] === "couture" ? "bandana" : parts[1], getCartRegularPrice(id, localBase, savedPrice, fulfillment));
}
