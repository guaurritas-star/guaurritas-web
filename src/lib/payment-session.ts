import type { CartItem } from "@/lib/cart-store";
import type { LeonOrderPreferences } from "@/lib/order-preferences";

export type SpeiCustomer = { name: string; phone: string; email: string };

export function paymentSessionKey(items: CartItem[], preferences: LeonOrderPreferences) {
  const lines = items.map((item) => JSON.stringify([
    item.id, item.quantity, item.fulfillment, item.unitPrice,
    item.detail, item.personalization ?? "",
    item.wix.supported ? item.wix.catalogReference : null,
  ])).sort();
  return JSON.stringify([lines, preferences]);
}

let lastRequestId = 0;

/** Request IDs stay unique even when a payment component is remounted. */
export class SpeiRequestTracker {
  private pending = new Map<string, number>();

  issue(responseType: string) {
    lastRequestId = Math.max(Date.now(), lastRequestId + 1);
    this.pending.set(responseType, lastRequestId);
    return lastRequestId;
  }

  accept(responseType: string, requestId: unknown) {
    if (this.pending.get(responseType) !== requestId || typeof requestId !== "number") return false;
    this.pending.delete(responseType);
    return true;
  }

  acceptError(requestId: unknown) {
    for (const [type, id] of this.pending) {
      if (id === requestId) return this.accept(type, requestId);
    }
    return false;
  }
}
