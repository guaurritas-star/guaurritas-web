// Exact production origins. A caller-controlled referrer never extends this list.
export const WIX_PARENT_ORIGINS = ["https://www.guaurritas.com", "https://guaurritas.com"] as const;

export function isTrustedWixMessage(event: MessageEvent): boolean {
  return typeof window !== "undefined" && event.source === window.parent &&
    WIX_PARENT_ORIGINS.some(origin => origin === event.origin);
}

export function wixParentOrigin(): string {
  try {
    const origin = new URL(document.referrer).origin;
    if (WIX_PARENT_ORIGINS.some(allowed => allowed === origin)) return origin;
  } catch {
    // Referrer may be omitted by browser policy. Use the canonical site.
  }
  return WIX_PARENT_ORIGINS[0];
}

export function postToWixParent(payload: unknown): void {
  if (typeof window === "undefined") return;
  window.parent.postMessage(payload, wixParentOrigin());
}
