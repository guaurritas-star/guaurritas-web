"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingButton, ShoppingWindow, ShoppingWindowHeader } from "@/components/ui/ShoppingControls";
import SystemIcon from "@/components/ui/SystemIcon";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { OS_CART_NOTIFICATION_EVENT } from "@/lib/os-notification-events";

// Tiempo suficiente para ver el aviso y tocar "Ver carrito".
const DISMISS_AFTER_MS = 7000;
const COPYING_MS = 950;

/** Native Store mini-window. Visual confirmation only; never mutates the cart. */
export default function OsCartNotification() {
  const [message, setMessage] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dismiss = () => setMessage(null);
    const show = (event: Event) => {
      const notice = (event as CustomEvent<string>).detail;
      if (typeof notice !== "string" || !notice.trim()) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (copyingRef.current) clearTimeout(copyingRef.current);
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      setCopying(!reduceMotion);
      setMessage(notice.slice(0, 180));
      if (!reduceMotion) copyingRef.current = setTimeout(() => setCopying(false), COPYING_MS);
      timeoutRef.current = setTimeout(dismiss, DISMISS_AFTER_MS);
    };

    window.addEventListener(OS_CART_NOTIFICATION_EVENT, show);
    return () => {
      window.removeEventListener(OS_CART_NOTIFICATION_EVENT, show);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (copyingRef.current) clearTimeout(copyingRef.current);
    };
  }, []);

  if (!message) return null;

  const dismiss = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(null);
  };

  const productSummary = message.replace(/\s*se agregó al carrito\.?$/i, "").replace(/[.\s]+$/, "").trim();

  return (
    <ShoppingWindow className="os-cart-notification shopping-window" role="status" aria-label="Producto añadido al carrito">
      <ShoppingWindowHeader className="os-cart-notification-titlebar shopping-window-header retro-window-titlebar">
        <p className="os-cart-notification-caption retro-window-caption">
          <span className="os-cart-notification-caption-icon" aria-hidden="true"><SystemIcon name="cart" /></span>
          Carrito.exe
        </p>
        <ShoppingButton
          type="button"
          className="os-cart-notification-close shopping-window-control retro-window-control retro-window-close"
          aria-label="Cerrar aviso del carrito"
          onClick={dismiss}
        ><span aria-hidden="true">×</span></ShoppingButton>
      </ShoppingWindowHeader>
      <div className="os-cart-notification-client">
        {/* El cuerpo y la acción existen siempre (la acción es usable desde el
            primer instante); durante la copia solo cambia el contenido. */}
        <div className="os-cart-notification-body">
          {copying ? (
            <div className="os-cart-copying">
              <p className="os-cart-copying-label">Copiando a Carrito.exe…</p>
              <p className="os-cart-copying-file">{(productSummary || message).slice(0, 60)}</p>
              <span className="os-cart-copying-bar" aria-hidden="true"><span /></span>
            </div>
          ) : (
            <>
              <span className="os-cart-notification-success" aria-hidden="true">✓</span>
              <div className="os-cart-notification-copy">
                <p className="os-cart-notification-heading">Se agregó a tu carrito</p>
                <p className="os-cart-notification-product">{productSummary || message}</p>
              </div>
            </>
          )}
        </div>
        <div className="os-cart-notification-actions">
          <ShoppingButton
            $tone="peach"
            className="os-cart-notification-open"
            onClick={() => {
              dismiss();
              requestSystemCartOpen();
            }}
          >Ver carrito <span aria-hidden="true">→</span></ShoppingButton>
        </div>
      </div>
    </ShoppingWindow>
  );
}
