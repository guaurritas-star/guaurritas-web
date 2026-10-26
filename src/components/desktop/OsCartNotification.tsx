"use client";

import { useEffect, useRef, useState } from "react";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { OS_CART_NOTIFICATION_EVENT } from "@/lib/os-notification-events";

const DISMISS_AFTER_MS = 4200;

/** Non-blocking notification above the desktop taskbar; mobile keeps inline feedback. */
export default function OsCartNotification() {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dismiss = () => setMessage(null);
    const show = (event: Event) => {
      const notice = (event as CustomEvent<string>).detail;
      if (typeof notice !== "string" || !notice.trim()) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(notice.slice(0, 180));
      timeoutRef.current = setTimeout(dismiss, DISMISS_AFTER_MS);
    };

    window.addEventListener(OS_CART_NOTIFICATION_EVENT, show);
    return () => {
      window.removeEventListener(OS_CART_NOTIFICATION_EVENT, show);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!message) return null;

  const dismiss = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(null);
  };

  return (
    <aside className="os-cart-notification" aria-label="Aviso del carrito">
      <div className="os-cart-notification-titlebar">
        <span aria-hidden="true">▣</span>
        <span>Guaurritas OS · Carrito</span>
        <button
          type="button"
          className="os-cart-notification-close"
          aria-label="Cerrar aviso del carrito"
          onClick={dismiss}
        >×</button>
      </div>
      <div className="os-cart-notification-body">
        <span className="os-cart-notification-check" aria-hidden="true">✓</span>
        <p>{message}</p>
      </div>
      <div className="os-cart-notification-actions">
        <button
          type="button"
          onClick={() => {
            dismiss();
            requestSystemCartOpen();
          }}
        >Ver carrito <span aria-hidden="true">→</span></button>
      </div>
    </aside>
  );
}
