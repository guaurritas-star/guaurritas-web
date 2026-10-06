"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";
import NationalCuisineStoreApp from "@/components/apps/NationalCuisineStoreApp";
import CoutureStoreApp from "@/components/apps/CoutureStoreApp";
import { getFulfillmentMode, setFulfillmentMode, type FulfillmentMode } from "@/lib/fulfillment-store";
import { useCart } from "@/lib/cart-store";
import { requestSystemCartOpen } from "@/lib/cart-events";
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
          <label className="flex min-w-0 flex-col gap-1 font-interface text-[10px] font-bold uppercase tracking-wider text-[#425b8c] sm:flex-row sm:items-center sm:gap-3">
            Entrega
            <select aria-label="Tipo de entrega" value={mode} onChange={(event) => chooseMode(event.target.value as FulfillmentMode)} className="min-h-11 max-w-full rounded-md border border-[#b9c8d8] bg-white px-2 font-interface text-xs font-semibold normal-case tracking-normal text-[#263650]">
              <option value="leon">Entrega en León</option>
              <option value="national">Envío nacional</option>
            </select>
          </label>
          <button type="button" onClick={() => requestSystemCartOpen()} aria-label={`Abrir carrito con ${count} ${count === 1 ? "artículo" : "artículos"}`} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#b9c8d8] bg-white px-3 font-interface text-[10px] font-bold text-[#425b8c]">
            <Image src={withBasePath("/icons/desktop/taskbar-cart.webp")} alt="" width={28} height={28} unoptimized />
            Carrito · {count}
          </button>
        </div>
        <div role="group" aria-label="Catálogo de la tienda" className="mt-3 flex gap-2">
          {([ ["cuisine", "Alimentos"], ["couture", "Accesorios"] ] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)} className={`min-h-11 flex-1 rounded-md border border-[#425b8c] px-4 font-interface text-xs font-bold sm:flex-none ${category === id ? "bg-[#425BBC] text-white" : "bg-white text-[#425b8c] hover:bg-[#dce4f2]"}`}>
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="store-catalog p-4 sm:p-6">
        {category === "couture" ? <CoutureStoreApp onBack={stayInStore} fulfillmentMode={mode} /> : mode === "national" ? <NationalCuisineStoreApp onBack={stayInStore} /> : <CuisineStoreApp onBack={stayInStore} fulfillmentMode="leon" />}
      </div>
    </section>
  );
}
