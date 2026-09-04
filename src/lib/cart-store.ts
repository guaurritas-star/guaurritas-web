"use client";

import { useSyncExternalStore } from "react";
import {
  resolveCuisineWixBinding,
  type WixCartBinding,
} from "@/lib/wix-commerce-map";
import {
  getFulfillmentMode,
  type FulfillmentMode,
} from "@/lib/fulfillment-store";

export type CartItem = {
  id: string;
  name: string;
  detail: string;
  personalization?: string;
  unitPrice: number;
  image: string;
  quantity: number;
  fulfillment: FulfillmentMode;
  wix: WixCartBinding;
};

type NewCartItem = Omit<CartItem, "quantity" | "wix" | "fulfillment"> & {
  fulfillment?: FulfillmentMode;
};
type StoredCartItem = Omit<CartItem, "wix" | "fulfillment"> & {
  fulfillment?: FulfillmentMode;
  wix?: WixCartBinding;
};

type CartSnapshot = {
  items: CartItem[];
  count: number;
  total: number;
};

const STORAGE_KEY = "guaurritas-os-cart";
const listeners = new Set<() => void>();
let items: CartItem[] = [];
let hydrated = false;
let snapshot: CartSnapshot = { items, count: 0, total: 0 };

function rebuildSnapshot() {
  snapshot = {
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    total: items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    ),
  };
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function emit() {
  rebuildSnapshot();
  persist();
  listeners.forEach((listener) => listener());
}

function normalizeFulfillment(value: unknown): FulfillmentMode {
  return value === "national" || value === "leon" ? value : "leon";
}

function enrichCartItem(item: StoredCartItem): CartItem {
  const wix = resolveCuisineWixBinding(item);

  return {
    id: item.id,
    name: item.name,
    detail: item.detail,
    personalization:
      typeof item.personalization === "string" ? item.personalization : "",
    // Cuisine is the source of truth for the public price. Wix IDs remain
    // the source of truth for catalog identity, not for overriding our margin.
    unitPrice: item.unitPrice,
    image: item.image,
    quantity: item.quantity,
    fulfillment: normalizeFulfillment(item.fulfillment),
    wix,
  };
}

export function hydrateCart() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(stored)) {
      items = stored
        .filter(
          (item): item is StoredCartItem =>
            typeof item?.id === "string" &&
            typeof item?.name === "string" &&
            typeof item?.detail === "string" &&
            typeof item?.unitPrice === "number" &&
            typeof item?.image === "string" &&
            Number.isInteger(item?.quantity) &&
            item.quantity > 0,
        )
        .map(enrichCartItem);
    }
  } catch {
    items = [];
  }

  emit();
}

export function addCartItem(item: NewCartItem) {
  const fulfillment = item.fulfillment ?? getFulfillmentMode();
  const enriched = enrichCartItem({ ...item, fulfillment, quantity: 1 });
  const existing = items.find(
    (current) =>
      current.id === item.id && current.fulfillment === fulfillment,
  );

  items = existing
    ? items.map((current) =>
        current.id === item.id && current.fulfillment === fulfillment
          ? {
              ...current,
              unitPrice: enriched.unitPrice,
              personalization: enriched.personalization,
              wix: enriched.wix,
              quantity: current.quantity + 1,
            }
          : current,
      )
    : [...items, enriched];

  emit();
}

export function changeCartQuantity(
  id: string,
  delta: -1 | 1,
  fulfillment?: FulfillmentMode,
) {
  items = items
    .map((item) =>
      item.id === id && (!fulfillment || item.fulfillment === fulfillment)
        ? { ...item, quantity: item.quantity + delta }
        : item,
    )
    .filter((item) => item.quantity > 0);
  emit();
}

export function removeCartItem(id: string, fulfillment?: FulfillmentMode) {
  items = items.filter(
    (item) =>
      !(item.id === id && (!fulfillment || item.fulfillment === fulfillment)),
  );
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

const emptySnapshot: CartSnapshot = { items: [], count: 0, total: 0 };

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
}
