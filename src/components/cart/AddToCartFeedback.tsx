"use client";

import { useEffect, useRef } from "react";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { announceCartAddition } from "@/lib/os-notification-events";

export default function AddToCartFeedback({ message, onContinue, blocked = false, image }: {
  message: string;
  blocked?: boolean;
  onContinue: () => void;
  /** Miniatura opcional del producto agregado (solo visual). */
  image?: string;
}) {
  const lastAnnounced = useRef<string | null>(null);

  useEffect(() => {
    // Only successful additions produce a retro toast, not blocked
    // carts or large wholesale enquiries that require confirmation.
    if (blocked || !/se agregó al carrito/i.test(message)) return;
    if (lastAnnounced.current === message) return;
    lastAnnounced.current = message;
    announceCartAddition(message);
  }, [blocked, message]);

  const added = !blocked && /se agregó al carrito/i.test(message);
  const detail = added
    ? message.replace(/\s*se agregó al carrito\.?\s*$/i, "").trim()
    : message;

  return (
    <div data-added={added ? "true" : undefined} className={`add-to-cart-feedback mt-4 rounded-lg border p-3 font-interface text-xs ${blocked ? "border-[#d8c0c8] bg-[#fff4f4] text-[#8a4545]" : "border-[#89a79a] bg-[#edf6f0] text-[#446454]"}`}>
      <div className="add-to-cart-feedback-summary">
        {added && image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="add-to-cart-feedback-thumb" />
        )}
        <p role={blocked ? "alert" : "status"} className="add-to-cart-feedback-text">
          {added ? (
            <>
              <strong>✓ Agregado a tu carrito</strong>
              <span>{detail}</span>
            </>
          ) : (
            <span>{message}</span>
          )}
        </p>
      </div>
      <div className="add-to-cart-feedback-actions">
        <button type="button" onClick={onContinue} className="add-to-cart-feedback-continue">Seguir comprando</button>
        <button type="button" onClick={() => requestSystemCartOpen()} className="add-to-cart-feedback-open">Ver carrito <span aria-hidden="true">→</span></button>
      </div>
    </div>
  );
}
