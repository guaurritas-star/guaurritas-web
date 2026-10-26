"use client";

/** Visual-only desktop notifications; the shopping flow remains unchanged. */
export const OS_CART_NOTIFICATION_EVENT = "guaurritas:os-cart-notification";

export function announceCartAddition(message: string) {
  if (typeof window === "undefined") return;
  const safeMessage = message.trim().slice(0, 180);
  if (!safeMessage) return;
  window.dispatchEvent(
    new CustomEvent<string>(OS_CART_NOTIFICATION_EVENT, { detail: safeMessage }),
  );
}
