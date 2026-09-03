"use client";

import { useEffect } from "react";

const BRIDGE_SOURCE = "guaurritas-web";
const SCROLL_LOCK_MESSAGE = "guaurritas:scroll-lock";

export default function CartPersistenceGuard() {
  useEffect(() => {
    const keepOpenWhileBrowsing = (event: PointerEvent) => {
      const panel = document.getElementById("taskbar-cart-panel");
      if (!panel) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      const shell = panel.closest(".taskbar-cart-shell");
      if (!shell || shell.contains(target)) return;

      // El carrito permanece abierto mientras se navega por el OS. Solo la X o
      // el propio control del carrito deben cerrarlo.
      event.stopPropagation();
    };

    let lastLocked: boolean | null = null;

    const syncCheckoutScrollLock = () => {
      const locked = Boolean(
        document.querySelector("#taskbar-cart-panel.taskbar-cart-panel--checkout"),
      );

      if (locked === lastLocked) return;
      lastLocked = locked;

      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: SCROLL_LOCK_MESSAGE,
          locked,
        },
        "*",
      );
    };

    document.addEventListener("pointerdown", keepOpenWhileBrowsing);

    const observer = new MutationObserver(syncCheckoutScrollLock);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    syncCheckoutScrollLock();

    return () => {
      document.removeEventListener("pointerdown", keepOpenWhileBrowsing);
      observer.disconnect();
      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: SCROLL_LOCK_MESSAGE,
          locked: false,
        },
        "*",
      );
    };
  }, []);

  return null;
}
