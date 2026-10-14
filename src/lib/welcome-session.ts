"use client";

import { useSyncExternalStore } from "react";

const KEY = "guaurritas-welcome-dismissed";
const listeners = new Set<() => void>();
let ready = false;
let dismissed = false;

export function isGeneralEntry(search: string, hash = "") {
  const params = new URLSearchParams(search);
  return !hash && params.get("welcome") !== "0" &&
    !["app", "world", "product", "fulfillment"].some(key => params.has(key)) &&
    !Array.from(params.keys()).some(key => /checkout|payment|order|return|thank.?you|transaction/i.test(key));
}

export function dismissWelcome() {
  dismissed = true;
  try { window.sessionStorage.setItem(KEY, "1"); } catch { /* Keep the dismissal in memory. */ }
  listeners.forEach(listener => listener());
}

export function markWelcomeReady() {
  ready = true;
  listeners.forEach(listener => listener());
}

function snapshot() {
  if (!ready) return false;
  try { dismissed ||= window.sessionStorage.getItem(KEY) === "1"; } catch { /* Session storage can be restricted. */ }
  return !dismissed;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useWelcomeAvailable() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
