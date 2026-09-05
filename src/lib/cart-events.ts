"use client";

export const OPEN_SYSTEM_CART_EVENT = "guaurritas:open-system-cart";

export type CartViewport = { top: number; height: number };

export function requestSystemCartOpen(viewport?: CartViewport) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(OPEN_SYSTEM_CART_EVENT, { detail: { viewport } }));
}
