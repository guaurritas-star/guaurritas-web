import type { CartItem } from "@/lib/cart-store";

// Stripe México estándar asumido para el flujo online:
// 3.6% + $3 MXN por transacción, más IVA sobre la comisión.
// Se mantiene centralizado para poder ajustarlo si cambia el proveedor o la tarifa.
export const ONLINE_PROCESSING = {
  percentRate: 0.036,
  fixedFeeMxn: 3,
  vatRate: 0.16,
  roundToMxn: 5,
} as const;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateProtectedOnlineTotal(baseTotal: number) {
  if (!Number.isFinite(baseTotal) || baseTotal <= 0) return 0;

  const effectivePercent =
    ONLINE_PROCESSING.percentRate * (1 + ONLINE_PROCESSING.vatRate);
  const fixedWithVat =
    ONLINE_PROCESSING.fixedFeeMxn * (1 + ONLINE_PROCESSING.vatRate);

  const exactGross = (baseTotal + fixedWithVat) / (1 - effectivePercent);
  const step = ONLINE_PROCESSING.roundToMxn;

  return Math.ceil(exactGross / step) * step;
}

export function buildProtectedUnitPrices(items: CartItem[]) {
  const baseTotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const protectedTotal = calculateProtectedOnlineTotal(baseTotal);
  const factor = baseTotal > 0 ? protectedTotal / baseTotal : 1;

  const unitPrices = new Map<string, number>();

  items.forEach((item) => {
    // Redondeamos siempre hacia arriba al centavo para nunca quedar debajo
    // del total protegido por diferencias de redondeo entre partidas.
    const protectedUnit = Math.ceil(item.unitPrice * factor * 100) / 100;
    unitPrices.set(`${item.fulfillment}:${item.id}`, roundMoney(protectedUnit));
  });

  // Los centavos que sobran por redondear cada partida hacia arriba se
  // descuentan de una partida de 1 unidad, para que el total con tarjeta sea
  // exactamente el total protegido (ej. $300.00 y no $300.01).
  const sumUnits = () => items.reduce((sum, item) => {
    const unit = unitPrices.get(`${item.fulfillment}:${item.id}`) ?? item.unitPrice;
    return sum + unit * item.quantity;
  }, 0);
  const excess = roundMoney(sumUnits() - protectedTotal);
  const balancing = items
    .filter((item) => item.quantity === 1)
    .sort((a, b) => b.unitPrice - a.unitPrice)[0];
  if (excess > 0 && balancing) {
    const key = `${balancing.fulfillment}:${balancing.id}`;
    const adjusted = roundMoney((unitPrices.get(key) ?? balancing.unitPrice) - excess);
    if (adjusted >= balancing.unitPrice) unitPrices.set(key, adjusted);
  }

  const allocatedTotal = sumUnits();

  return {
    baseTotal: roundMoney(baseTotal),
    protectedTotal: roundMoney(Math.max(protectedTotal, allocatedTotal)),
    unitPrices,
  };
}
