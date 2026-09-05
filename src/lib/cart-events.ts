"use client";

export const OPEN_SYSTEM_CART_EVENT = "guaurritas:open-system-cart";

export function requestSystemCartOpen() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(OPEN_SYSTEM_CART_EVENT));
}
