import type { CartItem } from "@/lib/cart-store";

export const NATIONAL_SHIPPING_PROMO = {
  discountThreshold: 499,
  freeShippingThreshold: 799,
  discountAmount: 30,
  maxWeightKg: 3,
  nearWeightLimitKg: 2.6,
} as const;

export type NationalShippingPromoState =
  | "standard"
  | "discount"
  | "free"
  | "overweight";

const SKYDROPX_FALLBACK_PRODUCT_WEIGHT_KG = 1;

function positiveNumber(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Mirrors the weights currently configured in Wix/SkydropX for Cuisine.
 *
 * Important: products without a reliable catalog weight deliberately fall back
 * to 1 kg because that is the backup product weight configured in SkydropX.
 * This keeps the storefront conservative and prevents promising a promotion
 * that SkydropX may reject at checkout.
 */
export function getCartItemShippingWeightKg(item: CartItem) {
  const parts = item.id.split(":");
  if (parts[0] !== "cuisine") return SKYDROPX_FALLBACK_PRODUCT_WEIGHT_KG;

  const productKey = parts[1];

  if (productKey === "guaurricookies") {
    const grams = positiveNumber(parts[2]);
    return grams ? grams / 1000 : SKYDROPX_FALLBACK_PRODUCT_WEIGHT_KG;
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

  return SKYDROPX_FALLBACK_PRODUCT_WEIGHT_KG;
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
  } else if (cartValue >= NATIONAL_SHIPPING_PROMO.freeShippingThreshold) {
    state = "free";
  } else if (cartValue >= NATIONAL_SHIPPING_PROMO.discountThreshold) {
    state = "discount";
  }

  return {
    state,
    weightKg,
    withinWeightLimit,
    nearWeightLimit:
      withinWeightLimit &&
      weightKg >= NATIONAL_SHIPPING_PROMO.nearWeightLimitKg,
    amountToDiscount: Math.max(
      0,
      NATIONAL_SHIPPING_PROMO.discountThreshold - cartValue,
    ),
    amountToFreeShipping: Math.max(
      0,
      NATIONAL_SHIPPING_PROMO.freeShippingThreshold - cartValue,
    ),
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
