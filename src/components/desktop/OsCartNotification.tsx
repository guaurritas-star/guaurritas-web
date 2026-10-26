"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { withBasePath } from "@/lib/base-path";
import { OS_CART_NOTIFICATION_EVENT } from "@/lib/os-notification-events";

const DISMISS_AFTER_MS = 4200;

/** Branded, non-blocking mini-window; keep cart behaviour and mobile feedback intact. */
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

  // Keep product name, variant and quantity rather than repeating the same status twice.
  const productSummary = message.replace(/\s*se agregó al carrito\.?$/i, "").replace(/[.\s]+$/, "").trim();

  return (
    <aside className="os-cart-notification" aria-label="Aviso de Guaurritas OS">
      <div className="os-cart-notification-titlebar">
        <span className="os-cart-notification-title-icon" aria-hidden="true">✦</span>
        <span>Guaurritas OS</span>
        <span className="os-cart-notification-title-section">/ Carrito</span>
        <button
          type="button"
          className="os-cart-notification-close"
          aria-label="Cerrar aviso del carrito"
          onClick={dismiss}
        >×</button>
      </div>
      <div className="os-cart-notification-body">
        <span className="os-cart-notification-mascot" aria-hidden="true">
          <Image
            src={withBasePath("/icons/desktop/guaurritas-mascot-hd.webp")}
            alt=""
            width={62}
            height={62}
            unoptimized
            className="os-cart-notification-mascot-image"
          />
        </span>
        <div className="os-cart-notification-copy">
          <span className="os-cart-notification-eyebrow">
            <span aria-hidden="true">✓</span> LISTO PARA CONSENTIR
          </span>
          <p className="os-cart-notification-heading">¡Ya quedó en tu carrito!</p>
          <p className="os-cart-notification-product">{productSummary || message}</p>
        </div>
      </div>
      <div className="os-cart-notification-actions">
        <span className="os-cart-notification-hint">Puedes seguir explorando</span>
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
