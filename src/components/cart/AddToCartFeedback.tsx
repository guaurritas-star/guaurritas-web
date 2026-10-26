"use client";

import { useEffect, useRef } from "react";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { announceCartAddition } from "@/lib/os-notification-events";

export default function AddToCartFeedback({ message, onContinue, blocked = false }: {
  message: string;
  blocked?: boolean;
  onContinue: () => void;
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

  return (
    <div className={`mt-4 rounded-lg border p-4 font-interface text-xs ${blocked ? "border-[#d8c0c8] bg-[#fff4f4] text-[#8a4545]" : "border-[#89a79a] bg-[#edf6f0] text-[#446454]"}`}>
      <p role={blocked ? "alert" : "status"} className="font-semibold">{blocked ? "" : "✓ "}{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onContinue} className="min-h-11 rounded-md border border-[#446454] bg-white px-4 font-bold">Seguir comprando</button>
        <button type="button" onClick={() => requestSystemCartOpen()} className="min-h-11 rounded-md bg-[#425b8c] px-4 font-bold text-white">Ver carrito</button>
      </div>
    </div>
  );
}
