"use client";

import { halloweenIsActive } from "@/lib/seasonal-promotions";
import { ShoppingButton } from "@/components/ui/ShoppingControls";
import { useCart } from "@/lib/cart-store";
import { requestSystemCartOpen } from "@/lib/cart-events";
import SystemIcon from "@/components/ui/SystemIcon";
import { useEffect, useRef, useState } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";
import NationalCuisineStoreApp from "@/components/apps/NationalCuisineStoreApp";
import CoutureStoreApp from "@/components/apps/CoutureStoreApp";
import { getFulfillmentMode, setFulfillmentMode, type FulfillmentMode } from "@/lib/fulfillment-store";
import { NATIONAL_SHIPPING_PROMO } from "@/lib/shipping-promotions";

const stayInStore = () => {};

type StoreCategory = "cuisine" | "couture";
type StoreAppProps = {
  onBack?: () => void;
  /** Guaurriverse already chose a world; show that exact catalogue without category tabs. */
  lockedCategory?: StoreCategory;
  initialFulfillmentMode?: FulfillmentMode;
  onFulfillmentChange?: (mode: FulfillmentMode) => void;
};

export default function StoreApp({
  onBack = stayInStore,
  lockedCategory,
  initialFulfillmentMode,
  onFulfillmentChange,
}: StoreAppProps) {
  const cart = useCart();
  const [category, setCategory] = useState<StoreCategory>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("world") === "couture" ? "couture" : "cuisine",
  );
  const activeCategory = lockedCategory ?? category;
  const [mode, setMode] = useState<FulfillmentMode>(() => {
    if (initialFulfillmentMode) return initialFulfillmentMode;
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("fulfillment") : null;
    return requested === "national" || requested === "leon" ? requested : getFulfillmentMode();
  });

  useEffect(() => {
    setFulfillmentMode(mode);
  }, [mode]);

  const [nationalNoticeOpen, setNationalNoticeOpen] = useState(false);
  const nationalNoticeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (nationalNoticeOpen) nationalNoticeRef.current?.focus();
  }, [nationalNoticeOpen]);

  const applyMode = (next: FulfillmentMode) => {
    setFulfillmentMode(next);
    setMode(next);
    onFulfillmentChange?.(next);
    // Keep deep links consistent when the delivery choice is edited.
    const url = new URL(window.location.href);
    url.searchParams.set("fulfillment", next);
    window.history.replaceState(window.history.state, "", url);
  };

  // De León a Todo México cambian productos y precios: se avisa antes.
  const chooseMode = (next: FulfillmentMode) => {
    if (next === mode) return;
    if (next === "national") {
      setNationalNoticeOpen(true);
      return;
    }
    setNationalNoticeOpen(false);
    applyMode(next);
  };

  const cartButton = (
    <ShoppingButton className="shopping-store-cart" onClick={() => requestSystemCartOpen()} aria-label={`Abrir carrito con ${cart.count} ${cart.count === 1 ? "artículo" : "artículos"}`}>
      <SystemIcon name="cart" /> <span className="shopping-store-cart-label">Carrito</span> <span className="shopping-cart-count">{cart.count}</span>
    </ShoppingButton>
  );

  return (
    <section className={`store-app flex h-auto min-h-0 flex-col bg-white sm:h-full${lockedCategory ? " store-app--world" : ""}`}>
      {/* Un solo encabezado para Tienda.exe y para los mundos de Guaurriverse:
          la única fila que cambia es la de contexto (pestañas o miga del mundo). */}
      <header className={`shopping-navigation shopping-navigation--compact${lockedCategory ? " shopping-navigation--world" : ""}`}>
            <div className="shopping-navigation-row">
              <fieldset className="shopping-location">
                <legend>¿Dónde recibes tu pedido?</legend>
                <div role="group" aria-label="Ubicación de compra">
                  {(["leon", "national"] as const).map(delivery => (
                    <ShoppingButton key={delivery} onClick={() => chooseMode(delivery)} aria-pressed={mode === delivery}>
                      <SystemIcon name={delivery === "leon" ? "pin" : "box"} />
                      <span className="shopping-location-full">{delivery === "leon" ? "León, Gto." : "Todo México"}</span>
                    </ShoppingButton>
                  ))}
                </div>
              </fieldset>
              {cartButton}
            </div>
            {nationalNoticeOpen && (
              <section className="store-zone-notice" role="alertdialog" aria-labelledby="store-zone-notice-title" onKeyDown={event => { if (event.key === "Escape") setNationalNoticeOpen(false); }}>
                <h2 id="store-zone-notice-title">¿Cambiar a envío nacional?</h2>
                <ul>
                  <li><SystemIcon name="paw" /> No incluye repostería fresca: Petcakes, cupcakes ni antojería.</li>
                  <li><SystemIcon name="box" /> Los precios cambian respecto a León.</li>
                  <li><SystemIcon name="truck" /> Pedido mínimo ${NATIONAL_SHIPPING_PROMO.minimumOrder} · envío gratis desde ${NATIONAL_SHIPPING_PROMO.freeShippingThreshold}.</li>
                  {cart.items.some(item => item.fulfillment === "leon") && (
                    <li><SystemIcon name="cart" /> Ya tienes productos de León en el carrito: termina ese pedido antes de agregar productos nacionales.</li>
                  )}
                </ul>
                <div className="store-zone-notice-actions">
                  <button ref={nationalNoticeRef} type="button" className="store-zone-primary" onClick={() => { setNationalNoticeOpen(false); applyMode("national"); }}>
                    Ver catálogo nacional
                  </button>
                  <button type="button" className="store-zone-secondary" onClick={() => setNationalNoticeOpen(false)}>
                    Seguir en León
                  </button>
                </div>
              </section>
            )}
            {lockedCategory ? (
              <nav className="shopping-world-context" aria-label="Sección elegida en Guaurriverse">
                <ShoppingButton className="shopping-world-back" onClick={onBack} aria-label="Volver a los mundos del Guaurriverse">
                  <span aria-hidden="true">←</span> Mundos
                </ShoppingButton>
                <p className="shopping-world-crumb">
                  <span className="shopping-world-crumb-parent">Guaurriverse <span aria-hidden="true">›</span></span>
                  <strong aria-current="page">{lockedCategory === "cuisine" ? "Cuisine" : "Couture"}</strong>
                </p>
              </nav>
            ) : (
              <div role="group" aria-label="Catálogo de la tienda" className="shopping-catalog-tabs">
                {([["cuisine", "Cuisine", "Premios y repostería"], ["couture", "Couture", "Bandanas y accesorios"]] as const).map(([id, label, detail]) => (
                  <ShoppingButton key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>
                    <strong>{label}</strong><span className="shopping-catalog-description"><span className="shopping-catalog-sep" aria-hidden="true"> · </span>{detail}</span>
                  </ShoppingButton>
                ))}
              </div>
            )}
        <details className="store-delivery-details">
          <summary>
            <span className="store-delivery-long">{mode === "national" ? `Pedido mínimo $${NATIONAL_SHIPPING_PROMO.minimumOrder} · envío $${NATIONAL_SHIPPING_PROMO.standardRate} · gratis desde $${NATIONAL_SHIPPING_PROMO.freeShippingThreshold}` : "León · entregas L–V 6:00–9:00 p.m. · S–D 1:00–7:30 p.m."} · Ver detalles de entrega</span>
            <span className="store-delivery-short" aria-hidden="true">{mode === "national" ? `Envío gratis desde $${NATIONAL_SHIPPING_PROMO.freeShippingThreshold}` : "Entregas L–V 6–9 pm · S–D 1–7:30 pm"} <span className="store-delivery-info">ⓘ</span></span>
          </summary>
          {mode === "national" ? (
            <p>Envío nacional: pedido mínimo ${NATIONAL_SHIPPING_PROMO.minimumOrder}. Envío ${NATIONAL_SHIPPING_PROMO.standardRate}; gratis desde ${NATIONAL_SHIPPING_PROMO.freeShippingThreshold} para pedidos de hasta {NATIONAL_SHIPPING_PROMO.maxWeightKg} kg. El plazo y el total se confirman en el checkout.</p>
          ) : (
            <p>En León eliges día y hora: de lunes a viernes de 6:00 a 9:00 p.m. y sábado y domingo de 1:00 a 7:30 p.m., cada media hora y con 1 día de anticipación; el punto se confirma por WhatsApp y Uber tiene costo adicional. El total con SPEI y tarjeta se muestra en el carrito.</p>
          )}
        </details>
      </header>
      {halloweenIsActive() && <aside className="halloween-store-announcement" aria-label="Promociones de Halloween"><strong>Halloween</strong><span>15 % en Dognuts y Guaurricookies empacadas · 10 % en bandanas</span><small>Hasta el 31 de octubre</small></aside>}
      <div className="store-catalog min-h-0 flex-none overflow-visible overscroll-auto p-4 sm:flex-1 sm:overflow-y-auto sm:overscroll-contain sm:p-6">
        {activeCategory === "couture" ? <CoutureStoreApp embeddedInStore onBack={onBack} fulfillmentMode={mode} /> : mode === "national" ? <NationalCuisineStoreApp embeddedInStore onBack={onBack} /> : <CuisineStoreApp embeddedInStore onBack={onBack} fulfillmentMode="leon" />}
      </div>
      <footer className="store-statusbar" aria-hidden="true">
        <span>{activeCategory === "couture" ? "Couture" : "Cuisine"}</span>
        <span>{mode === "leon" ? "León, Gto." : "Todo México"}</span>
        <span>{cart.count} {cart.count === 1 ? "artículo" : "artículos"} en carrito</span>
        <span className="store-statusbar-fill" />
      </footer>
    </section>
  );
}
