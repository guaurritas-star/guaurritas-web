"use client";

const SESSION_KEY = "guaurritas-spei-admin-session";

export function readAdminSession() {
  try { return window.sessionStorage.getItem(SESSION_KEY) || ""; }
  catch { return ""; }
}

export function writeAdminSession(secret: string) {
  try {
    if (secret) window.sessionStorage.setItem(SESSION_KEY, secret);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // A verified session can remain in memory when browser storage is blocked.
  }
}

export function scheduleDraftKey(order: {
  id: string;
  scheduledAt: string | null;
  deliveryDate: string | null;
  deliveryTime: string;
  deliveryType: string;
  deliveryPoint: string;
  operationalNote: string;
}) {
  return JSON.stringify([
    order.id, order.scheduledAt, order.deliveryDate, order.deliveryTime,
    order.deliveryType, order.deliveryPoint, order.operationalNote,
  ]);
}
