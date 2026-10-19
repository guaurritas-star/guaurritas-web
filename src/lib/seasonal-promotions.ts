// All customer-facing Halloween prices share the same MXN rounding and dates.
export function halloweenIsActive(now = new Date()) {
  return now.getTime() >= Date.parse("2026-10-16T00:00:00-06:00") &&
    now.getTime() < Date.parse("2026-11-01T00:00:00-06:00");
}
export function halloweenRate(productId: string, now = new Date()) {
  if (!halloweenIsActive(now)) return 0;
  if (["dognuts", "happy-bag", "guaurricookies-kit"].includes(productId)) return 0.15;
  return productId === "bandana" ? 0.10 : 0;
}
export function halloweenPrice(productId: string, basePrice: number, now = new Date()) {
  return Math.round((basePrice * (1 - halloweenRate(productId, now)) + Number.EPSILON) * 100) / 100;
}
