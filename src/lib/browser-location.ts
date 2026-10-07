"use client";

import { useSyncExternalStore } from "react";

const LOCATION_EVENT = "guaurritas:location-change";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(LOCATION_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(LOCATION_EVENT, listener);
  };
}

export function notifyLocationChange() {
  window.dispatchEvent(new Event(LOCATION_EVENT));
}

export function useBrowserSearch() {
  return useSyncExternalStore(subscribe, () => window.location.search, () => "");
}

export function useBrowserReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
