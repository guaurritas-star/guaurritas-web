"use client";

export type FulfillmentMode = "national" | "leon";

const STORAGE_KEY = "guaurritas-fulfillment-mode";
let currentMode: FulfillmentMode = "leon";
let hydrated = false;

function isFulfillmentMode(value: unknown): value is FulfillmentMode {
  return value === "national" || value === "leon";
}

function hydrateMode() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isFulfillmentMode(stored)) currentMode = stored;
  } catch {
    // The delivery selector still works for this session without storage.
  }
}

export function getFulfillmentMode(): FulfillmentMode {
  hydrateMode();
  return currentMode;
}

export function setFulfillmentMode(mode: FulfillmentMode) {
  currentMode = mode;
  hydrated = true;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Preserve the selected mode in memory if persistence is blocked.
    }
  }
}

export function fulfillmentLabel(mode: FulfillmentMode) {
  return mode === "national" ? "Envío nacional" : "Entrega en León";
}
