"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";
import NationalCuisineStoreApp from "@/components/apps/NationalCuisineStoreApp";
import CoutureStoreApp from "@/components/apps/CoutureStoreApp";
import { getFulfillmentMode, setFulfillmentMode, type FulfillmentMode } from "@/lib/fulfillment-store";
import { useCart } from "@/lib/cart-store";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { NATIONAL_SHIPPING_PROMO } from "@/lib/shipping-promotions";
import { withBasePath } from "@/lib/base-path";

const stayInStore = () => {};

export default function StoreApp() {
  const [category, setCategory] = useState<"cuisine" | "couture">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("world") === "couture" ? "couture" : "cuisine",
  );
  const [mode, setMode] = useState<FulfillmentMode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fulfillment") === "national" ? "national" : getFulfillmentMode(),
  );
  const { count } = useCart();

  useEffect(() => {
    setFulfillmentMode(mode);
  }, [mode]);

  const chooseMode = (next: FulfillmentMode) => {
    setFulfillmentMode(next);
    setMode(next);
    // Keep deep links consistent when the delivery choice is edited.
    const url = new URL(window.location.href);
    url.searchParams.set("fulfillment", next);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <section className="store-app -m-4 bg-white sm:-m-6">
      <header className="store-navigation sticky top-0 z-50 border-b-2 border-[#425b8c] bg-[#eef5f7] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="mb-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.13em] text-[#42516a] sm:text-[10px]">
              ¿Dónde estás comprando?
            </p>
            <div role="group" aria-label="Ubicación de compra" className="grid grid-cols-2 rounded-full border border-[#8494ad] bg-transparent p-1 sm:min-w-72">
              {(["leon", "national"] as const).map((delivery) => (
                <button
                  key={delivery}
                  type="button"
                  onClick={() => chooseMode(delivery)}
                  aria-pressed={mode === delivery}
                  className={`min-h-10 rounded-full px-2 py-2 font-interface text-[9px] font-bold uppercase tracking-[0.08em] transition sm:min-h-9 sm:px-4 ${mode === delivery ? "bg-[#263650] text-white shadow-sm" : "text-[#42516a] hover:bg-white/60"}`}
                >
                  {delivery === "leon" ? "📍 León" : "📦 Nacional"}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => requestSystemCartOpen()} aria-label={`Abrir carrito con ${count} ${count === 1 ? "artículo" : "artículos"}`} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#b9c8d8] bg-white px-3 font-interface text-[10px] font-bold text-[#425b8c]">
            <Image src={withBasePath("/icons/desktop/taskbar-cart.webp")} alt="" width={28} height={28} unoptimized />
            Carrito · {count}
          </button>
        </div>
        <div role="group" aria-label="Catálogo de la tienda" className="mt-3 flex gap-2">
          {([ ["cuisine", "Cuisine"], ["couture", "Couture"] ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)} className={`min-h-11 flex-1 rounded-md border border-[#425b8c] px-4 font-interface text-xs font-bold sm:flex-none ${category === id ? "bg-[#425BBC] text-white" : "bg-white text-[#425b8c] hover:bg-[#dce4f2]"}`}>
              <span className="block">{label}</span>
              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal">{id === "cuisine" ? "Premios y repostería" : "Bandanas y accesorios"}</span>
            </button>
          ))}
        </div>
      </header>
      <div className="border-b border-[#d4dce7] bg-[#f9fbff] px-4 py-3 font-interface text-xs leading-5 text-[#53627a] sm:px-6">
        {mode === "national" ? (
          <p>Envío nacional: pedido mínimo ${NATIONAL_SHIPPING_PROMO.minimumOrder}. Envío ${NATIONAL_SHIPPING_PROMO.standardRate}; gratis desde ${NATIONAL_SHIPPING_PROMO.freeShippingThreshold} para pedidos de hasta {NATIONAL_SHIPPING_PROMO.maxWeightKg} kg. El plazo y el total se confirman en el checkout.</p>
        ) : (
          <p>En León eliges fecha y horario antes de pagar. Confirmamos por WhatsApp el horario y el punto de entrega; Uber tiene costo adicional. El total con SPEI y tarjeta se muestra en el carrito.</p>
        )}
      </div>
      <div className="store-catalog p-4 sm:p-6">
        {category === "couture" ? <CoutureStoreApp onBack={stayInStore} fulfillmentMode={mode} /> : mode === "national" ? <NationalCuisineStoreApp onBack={stayInStore} /> : <CuisineStoreApp onBack={stayInStore} fulfillmentMode="leon" />}
      </div>
    </section>
  );
}
