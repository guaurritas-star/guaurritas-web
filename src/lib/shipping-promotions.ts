import type { CartItem } from "@/lib/cart-store";
import { NATIONAL_COMMERCE } from "@/lib/national-pricing";

export const NATIONAL_SHIPPING_PROMO = {
  minimumOrder: NATIONAL_COMMERCE.minimumOrderMxn,
  minimumOrderGrace: NATIONAL_COMMERCE.minimumOrderGraceMxn,
  standardRate: NATIONAL_COMMERCE.standardShippingMxn,
  freeShippingThreshold: NATIONAL_COMMERCE.freeShippingThresholdMxn,
  maxWeightKg: NATIONAL_COMMERCE.maxStandardWeightKg,
  nearWeightLimitKg: 4.5,
} as const;

export type NationalShippingPromoState =
  | "below_minimum"
  | "standard"
  | "free"
  | "overweight";

const FALLBACK_PRODUCT_WEIGHT_KG = 1;

function positiveNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Shipping weights used by the national storefront.
 *
 * Unknown products deliberately fall back to 1 kg so the storefront never
 * promises a fixed/free rate for an item whose shipping weight is uncertain.
 */
export function getCartItemShippingWeightKg(item: CartItem) {
  const parts = item.id.split(":");
  if (parts[0] !== "cuisine") return FALLBACK_PRODUCT_WEIGHT_KG;

  const productKey = parts[1];

  if (productKey === "guaurricookies") {
    const grams = positiveNumber(parts[2]);
    return grams ? grams / 1000 : FALLBACK_PRODUCT_WEIGHT_KG;
  }

  if (productKey === "happy-bag") return 0.12;
  if (productKey === "sazonadores") return 0.08;
  if (productKey === "sticks") return 0.2;
  if (productKey === "gorrito") return 0.005;
  if (productKey === "pancarta") return 0.15;

  if (productKey === "velitas") {
    const optionIndex = Number(parts[2]);
    return optionIndex === 1 ? 0.05 : 0.003;
  }

  if (productKey === "happy-box") {
    const optionIndex = Number(parts[2]);
    return optionIndex === 1 ? 0.35 : 0.2;
  }

  return FALLBACK_PRODUCT_WEIGHT_KG;
}

export function getNationalCartShippingWeightKg(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + getCartItemShippingWeightKg(item) * item.quantity,
    0,
  );
}

export function getNationalShippingPromoState(
  items: CartItem[],
  cartValue: number,
) {
  const weightKg = getNationalCartShippingWeightKg(items);
  const withinWeightLimit =
    weightKg <= NATIONAL_SHIPPING_PROMO.maxWeightKg + Number.EPSILON;

  let state: NationalShippingPromoState = "standard";

  if (!withinWeightLimit) {
    state = "overweight";
  } else if (
    cartValue <
    NATIONAL_SHIPPING_PROMO.minimumOrder - NATIONAL_SHIPPING_PROMO.minimumOrderGrace
  ) {
    state = "below_minimum";
  } else if (cartValue >= NATIONAL_SHIPPING_PROMO.freeShippingThreshold) {
    state = "free";
  }

  return {
    state,
    weightKg,
    withinWeightLimit,
    nearWeightLimit:
      withinWeightLimit &&
      weightKg >= NATIONAL_SHIPPING_PROMO.nearWeightLimitKg,
    amountToMinimumOrder: Math.max(
      0,
      NATIONAL_SHIPPING_PROMO.minimumOrder - cartValue,
    ),
    amountToFreeShipping: Math.max(
      0,
      NATIONAL_SHIPPING_PROMO.freeShippingThreshold - cartValue,
    ),
    shippingCharge:
      state === "free"
        ? 0
        : state === "standard"
          ? NATIONAL_SHIPPING_PROMO.standardRate
          : null,
    purchaseProgress: Math.min(
      1,
      Math.max(0, cartValue / NATIONAL_SHIPPING_PROMO.freeShippingThreshold),
    ),
    weightProgress: Math.min(
      1,
      Math.max(0, weightKg / NATIONAL_SHIPPING_PROMO.maxWeightKg),
    ),
  };
}
