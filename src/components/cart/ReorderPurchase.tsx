"use client";

import { useEffect, useRef, useState } from "react";
import { addReorderItems, type CartItem } from "@/lib/cart-store";
import { getFulfillmentMode, fulfillmentLabel, type FulfillmentMode } from "@/lib/fulfillment-store";
import { requestSystemCartOpen } from "@/lib/cart-events";

type PreparedItem = Omit<CartItem, "wix">;
type State =
  | { kind: "idle" | "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: PreparedItem[] }
  | { kind: "added" };

const money = (amount: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

export default function ReorderPurchase({ orderId, onOpenStore }: {
  orderId: string;
  onOpenStore?: () => void;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [mode, setMode] = useState<FulfillmentMode>("leon");
  const request = useRef<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (event.source !== window.parent ||
          !["guaurritas-embed", "guaurritas-wix"].includes(data?.source) ||
          data?.type !== "guaurritas:purchase-history" ||
          data?.action !== "prepare-reorder" || data.requestId !== request.current) return;
      if (timeout.current) clearTimeout(timeout.current);
      request.current = null;
      if (!data.ok || !Array.isArray(data.items) || !data.items.length) {
        setState({ kind: "error", message: data.message || "No pudimos preparar este pedido. Inténtalo nuevamente." });
        return;
      }
      setState({ kind: "ready", items: data.items });
    };
    window.addEventListener("message", receive);
    return () => {
      window.removeEventListener("message", receive);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const prepare = (fulfillment: FulfillmentMode) => {
    setMode(fulfillment);
    setState({ kind: "loading" });
    if (timeout.current) clearTimeout(timeout.current);
    request.current = crypto.randomUUID();
    window.parent.postMessage({
      source: "guaurritas-web", type: "guaurritas:purchase-history-request",
      action: "prepare-reorder", orderId, fulfillment, requestId: request.current,
    }, "*");
    timeout.current = setTimeout(() => {
      request.current = null;
      setState({ kind: "error", message: "La tienda tardó en responder. Inténtalo nuevamente." });
    }, 20000);
  };

  const add = () => {
    if (state.kind !== "ready") return;
    try {
      addReorderItems(state.items);
      setState({ kind: "added" });
      requestSystemCartOpen();
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "No pudimos agregar el pedido." });
    }
  };

  return (
    <div className="sm:col-span-3 font-interface text-sm">
      {state.kind === "idle" ? (
        <button type="button" onClick={() => prepare(getFulfillmentMode())} className="min-h-11 border border-[#425b8c] bg-white px-4 font-bold text-[#425b8c] hover:bg-[#edf2fa]">Volver a pedir</button>
      ) : state.kind === "added" ? (
        <div role="status" className="border border-[#89a79a] bg-[#edf6f0] p-3 text-[#446454]">
          Pedido agregado. Conservamos los artículos que ya tenías.
          <button type="button" onClick={() => requestSystemCartOpen()} className="ml-3 min-h-11 underline">Ver carrito</button>
        </div>
      ) : (
        <div className="border border-[#b8c5df] bg-white p-4">
          <p className="font-bold">Repetir con las opciones de tu pedido</p>
          <div className="my-3 flex flex-wrap gap-2" aria-label="Entrega del pedido">
            {(["leon", "national"] as const).map(value => (
              <button key={value} type="button" aria-pressed={mode === value} onClick={() => prepare(value)} className={`min-h-11 border border-[#425b8c] px-3 ${mode === value ? "bg-[#425b8c] text-white" : "bg-white text-[#425b8c]"}`}>{fulfillmentLabel(value)}</button>
            ))}
          </div>
          {state.kind === "loading" && <p role="status">Revisando precios y disponibilidad…</p>}
          {state.kind === "error" && <>
            <p role="alert" className="text-[#8a4545]">{state.message}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => prepare(mode)} className="min-h-11 underline">Intentar de nuevo</button>
              <button type="button" onClick={onOpenStore} className="min-h-11 underline">Ir a Tienda</button>
            </div>
          </>}
          {state.kind === "ready" && <>
            <ul className="divide-y divide-[#dce4f2]">
              {state.items.map((item, index) => <li key={`${item.id}-${index}`} className="py-2">
                <p>{item.quantity} × {item.name} — {money(item.unitPrice * item.quantity)}</p>
                {item.detail && <p className="mt-1 text-xs text-[#53627a]">{item.detail}</p>}
              </li>)}
            </ul>
            <p className="mt-3 font-bold">Productos: {money(state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}</p>
            <p className="mt-1 text-xs text-[#53627a]">Precios actuales. El envío y el total según tu forma de pago se muestran en el carrito. Podrás elegir una nueva fecha de entrega.</p>
            <button type="button" onClick={add} className="mt-3 min-h-11 bg-[#425b8c] px-4 font-bold text-white">Agregar al carrito</button>
          </>}
          <button type="button" onClick={() => {
            request.current = null;
            if (timeout.current) clearTimeout(timeout.current);
            setState({ kind: "idle" });
          }} className="mt-3 min-h-11 text-xs underline">Cancelar</button>
        </div>
      )}
    </div>
  );
}
