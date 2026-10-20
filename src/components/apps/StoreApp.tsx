"use client";

import { halloweenIsActive } from "@/lib/seasonal-promotions";
import { ShoppingButton } from "@/components/ui/ShoppingControls";
import { useCart } from "@/lib/cart-store";
import { requestSystemCartOpen } from "@/lib/cart-events";
import SystemIcon from "@/components/ui/SystemIcon";
import { useEffect, useState } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";
import NationalCuisineStoreApp from "@/components/apps/NationalCuisineStoreApp";
import CoutureStoreApp from "@/components/apps/CoutureStoreApp";
import { getFulfillmentMode, setFulfillmentMode, type FulfillmentMode } from "@/lib/fulfillment-store";
import { NATIONAL_SHIPPING_PROMO } from "@/lib/shipping-promotions";

const stayInStore = () => {};

export default function StoreApp() {
  const cart = useCart();
  const [category, setCategory] = useState<"cuisine" | "couture">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("world") === "couture" ? "couture" : "cuisine",
  );
  const [mode, setMode] = useState<FulfillmentMode>(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fulfillment") : null;
    return requested === "national" || requested === "leon" ? requested : getFulfillmentMode();
  });

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
    <section className="store-app flex h-auto min-h-0 flex-col bg-white sm:h-full">
      <header className="shopping-navigation">
        <div className="shopping-navigation-row">
          <fieldset className="shopping-location">
            <legend>¿Dónde recibes tu pedido?</legend>
            <div role="group" aria-label="Ubicación de compra">
              {(["leon", "national"] as const).map(delivery => (
                <ShoppingButton key={delivery} onClick={() => chooseMode(delivery)} aria-pressed={mode === delivery}>
                  <SystemIcon name={delivery === "leon" ? "pin" : "box"} />
                  {delivery === "leon" ? "León, Gto." : "Todo México"}
                </ShoppingButton>
              ))}
            </div>
          </fieldset>
          <ShoppingButton className="shopping-store-cart" onClick={() => requestSystemCartOpen()} aria-label={`Abrir carrito con ${cart.count} ${cart.count === 1 ? "artículo" : "artículos"}`}>
            <SystemIcon name="cart" /> <span className="shopping-store-cart-label">Carrito</span> <span className="shopping-cart-count">{cart.count}</span>
          </ShoppingButton>
        </div>
        <div role="group" aria-label="Catálogo de la tienda" className="shopping-catalog-tabs">
          {([["cuisine", "Cuisine", "Premios y repostería"], ["couture", "Couture", "Bandanas y accesorios"]] as const).map(([id, label, detail]) => (
            <ShoppingButton key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>
              <strong>{label}</strong><span className="sr-only">{detail}</span>
            </ShoppingButton>
          ))}
        </div>
      <details className="store-delivery-details">
        <summary>{mode === "national" ? `Pedido mínimo $${NATIONAL_SHIPPING_PROMO.minimumOrder} · envío $${NATIONAL_SHIPPING_PROMO.standardRate} · gratis desde $${NATIONAL_SHIPPING_PROMO.freeShippingThreshold}` : "León · elige fecha y horario antes de pagar"} · Ver detalles de entrega</summary>
        {mode === "national" ? (
          <p>Envío nacional: pedido mínimo ${NATIONAL_SHIPPING_PROMO.minimumOrder}. Envío ${NATIONAL_SHIPPING_PROMO.standardRate}; gratis desde ${NATIONAL_SHIPPING_PROMO.freeShippingThreshold} para pedidos de hasta {NATIONAL_SHIPPING_PROMO.maxWeightKg} kg. El plazo y el total se confirman en el checkout.</p>
        ) : (
          <p>En León eliges fecha y horario antes de pagar. Confirmamos por WhatsApp el horario y el punto de entrega; Uber tiene costo adicional. El total con SPEI y tarjeta se muestra en el carrito.</p>
        )}
      </details>
      </header>
      {halloweenIsActive() && <aside className="halloween-store-announcement" aria-label="Promociones de Halloween"><strong>Halloween</strong><span>15 % en Dognuts y Guaurricookies empacadas · 10 % en bandanas</span><small>Hasta el 31 de octubre</small></aside>}
      <div className="store-catalog min-h-0 flex-none overflow-visible overscroll-auto p-4 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain sm:p-6">
        {category === "couture" ? <CoutureStoreApp embeddedInStore onBack={stayInStore} fulfillmentMode={mode} /> : mode === "national" ? <NationalCuisineStoreApp embeddedInStore onBack={stayInStore} /> : <CuisineStoreApp embeddedInStore onBack={stayInStore} fulfillmentMode="leon" />}
      </div>
    </section>
  );
}
