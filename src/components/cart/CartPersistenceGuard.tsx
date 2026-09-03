"use client";

import { useEffect } from "react";

export default function CartPersistenceGuard() {
  useEffect(() => {
    const keepOpenWhileBrowsing = (event: PointerEvent) => {
      const panel = document.getElementById("taskbar-cart-panel");
      if (!panel) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      const shell = panel.closest(".taskbar-cart-shell");
      if (!shell || shell.contains(target)) return;

      // TaskbarCart escucha pointerdown en window para cerrar al tocar afuera.
      // Frenarlo aquí (después de que el elemento tocado recibió el evento)
      // permite seguir usando el escritorio sin desaparecer el carrito.
      event.stopPropagation();
    };

    document.addEventListener("pointerdown", keepOpenWhileBrowsing);
    return () =>
      document.removeEventListener("pointerdown", keepOpenWhileBrowsing);
  }, []);

  return null;
}
