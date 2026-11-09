"use client";

import "./cart-checkout-ux.css";
import { leonCheckoutErrors } from "@/lib/checkout-ux";
import ProductPrice from "@/components/ui/ProductPrice";
import { ShoppingButton } from "@/components/ui/ShoppingControls";
import { getCartRegularPrice } from "@/lib/national-pricing";
import SystemIcon from "@/components/ui/SystemIcon";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  changeCartQuantity,
  hydrateCart,
  removeCartItem,
  useCart,
  type CartItem,
} from "@/lib/cart-store";
import { withBasePath } from "@/lib/base-path";
import { requestWixCheckout } from "@/lib/wix-checkout-bridge";
import { buildProtectedUnitPrices } from "@/lib/payment-pricing";
import {
  NATIONAL_SHIPPING_PROMO,
  getNationalShippingPromoState,
} from "@/lib/shipping-promotions";
import {
  EMPTY_LEON_ORDER_PREFERENCES,
  deliveryMethodLabel,
  isLeonOrderPreferencesComplete,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";
import SpeiPaymentFlow from "@/components/cart/SpeiPaymentFlow";
import LeonOrderPreferencesForm from "@/components/cart/LeonOrderPreferences";
import { OPEN_SYSTEM_CART_EVENT } from "@/lib/cart-events";

type LeonPaymentMethod = "spei" | "online";
type CartView = "cart" | "leon-checkout";

const CHECKOUT_RETRY_MS = 8000;

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function itemTotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
}

function itemUnits(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export default function TaskbarCart({ onShop }: { onShop: () => void }) {
  const [open, setOpen] = useState(false);
  const revealCartRef = useRef(false);
  const [view, setView] = useState<CartView>("cart");
  // León: el checkout se divide en dos pasos (entrega → pago). Solo navegación.
  const [leonStep, setLeonStep] = useState<"delivery" | "payment">("delivery");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [leonPaymentMethod, setLeonPaymentMethod] =
    useState<LeonPaymentMethod | null>(null);
  const [leonFulfillmentConfirmed, setLeonFulfillmentConfirmed] = useState(false);
  const [showLeonErrors, setShowLeonErrors] = useState(false);
  const [leonOrderPreferences, setLeonOrderPreferences] =
    useState<LeonOrderPreferences>({ ...EMPTY_LEON_ORDER_PREFERENCES });
  const [resolvedPaymentPreferences, setResolvedPaymentPreferences] =
    useState<LeonOrderPreferences | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const checkoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCart();

  const closeCart = useCallback(() => {
    setOpen(false);
    setView("cart");
    setLeonStep("delivery");
    setCheckoutStatus("");
    setLeonFulfillmentConfirmed(false);
  }, []);

  if (view === "leon-checkout" && !cart.items.some((item) => item.fulfillment === "leon")) {
    // The checkout has no order left to configure. Reset before rendering it.
    setView("cart");
  }

  useEffect(() => hydrateCart(), []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("guaurritas-system-cart-open", open);

    return () => {
      root.classList.remove("guaurritas-system-cart-open");
    };
  }, [open]);

  useEffect(() => {
    const openSystemCart = () => {
      revealCartRef.current =
        window.self !== window.top && window.matchMedia("(max-width: 639px)").matches;
      setView("cart");
      setCheckoutStatus("");
      setOpen(true);
    };

    window.addEventListener(OPEN_SYSTEM_CART_EVENT, openSystemCart);
    return () =>
      window.removeEventListener(OPEN_SYSTEM_CART_EVENT, openSystemCart);
  }, []);

  useEffect(() => {
    if (!open || !revealCartRef.current) return;
    let frame = 0;
    // Wait for the existing panel and the iframe height bridge to lay out.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        window.parent.postMessage({
          source: "guaurritas-web",
          type: "guaurritas:cart-navigation",
          action: "reveal",
          top: panel.getBoundingClientRect().top,
        }, "*");
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      revealCartRef.current = false;
      window.parent.postMessage({
        source: "guaurritas-web",
        type: "guaurritas:cart-navigation",
        action: "return",
      }, "*");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    const closeOutside = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) closeCart();
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, [open, closeCart]);

  useEffect(() => {
    const clearCheckoutLock = () => {
      if (checkoutTimeoutRef.current) {
        clearTimeout(checkoutTimeoutRef.current);
        checkoutTimeoutRef.current = null;
      }
      setCheckoutBusy(false);
      setCheckoutStatus("");
    };

    const onPageShow = () => clearCheckoutLock();
    const onFocus = () => {
      if (document.visibilityState === "visible") clearCheckoutLock();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      if (checkoutTimeoutRef.current) clearTimeout(checkoutTimeoutRef.current);
    };
  }, []);

  const nationalItems = useMemo(
    () => cart.items.filter((item) => item.fulfillment === "national"),
    [cart.items],
  );
  const leonItems = useMemo(
    () => cart.items.filter((item) => item.fulfillment === "leon"),
    [cart.items],
  );

  const mixedCart = nationalItems.length > 0 && leonItems.length > 0;
  const mixedCartMessage = "Tu carrito anterior contiene dos tipos de entrega. Retira los productos de León o los de envío nacional para continuar con un solo pedido.";

  const nationalBaseTotal = itemTotal(nationalItems);
  const leonTransferTotal = itemTotal(leonItems);
  // Los precios nacionales ya incluyen procesamiento + reserva logística.
  const nationalOnlineTotal = nationalBaseTotal;
  const leonOnlineTotal = buildProtectedUnitPrices(leonItems).protectedTotal;
  const nationalShippingPromo = getNationalShippingPromoState(
    nationalItems,
    nationalOnlineTotal,
  );
  const nationalCanCheckout =
    nationalShippingPromo.state === "standard" ||
    nationalShippingPromo.state === "free";
  const nationalShippingPromoMessage =
    nationalShippingPromo.state === "overweight"
      ? `Supera ${NATIONAL_SHIPPING_PROMO.maxWeightKg} kg · confirmamos tarifa especial antes del cobro.`
      : nationalShippingPromo.state === "free"
        ? "Envío nacional gratis desbloqueado"
        : nationalShippingPromo.state === "below_minimum"
          ? `Faltan ${money(nationalShippingPromo.amountToMinimumOrder)} para el mínimo de ${money(NATIONAL_SHIPPING_PROMO.minimumOrder)}.`
          : `Envío ${money(NATIONAL_SHIPPING_PROMO.standardRate)} · faltan ${money(nationalShippingPromo.amountToFreeShipping)} para envío gratis.`;
  const leonErrors = showLeonErrors ? leonCheckoutErrors(leonOrderPreferences) : undefined;

  const scrollPanelTop = () => {
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      panel?.scrollTo({ top: 0, behavior: "smooth" });
      // En Wix móvil desplaza la página real; el panel no tiene scroll propio.
      if (panel && window.self !== window.top) {
        window.parent.postMessage({
          source: "guaurritas-web",
          type: "guaurritas:cart-navigation",
          action: "reveal",
          top: panel.getBoundingClientRect().top,
        }, "*");
      }
    });
  };

  const goToLeonCheckout = () => {
    if (mixedCart) { setCheckoutStatus(mixedCartMessage); return; }
    setView("leon-checkout");
    setLeonStep("delivery");
    setCheckoutStatus("");
    setLeonPaymentMethod(null);
    setShowLeonErrors(false);
    scrollPanelTop();
  };

  // Paso Entrega → Pago: valida fecha, horario y forma de entrega con las
  // mismas reglas que ya usaba el pago. No cambia precios ni el puente de Wix.
  const continueToLeonPayment = () => {
    const resolved = readLeonPreferencesFromControls();
    setLeonOrderPreferences(resolved);
    if (!isLeonOrderPreferencesComplete(resolved)) {
      setShowLeonErrors(true);
      setCheckoutStatus("Revisa los campos señalados para continuar. Tu carrito se conserva.");
      requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setShowLeonErrors(false);
    setCheckoutStatus("");
    setLeonStep("payment");
    scrollPanelTop();
  };

  const backToLeonDelivery = () => {
    setLeonStep("delivery");
    setLeonPaymentMethod(null);
    setResolvedPaymentPreferences(null);
    setCheckoutStatus("");
    scrollPanelTop();
  };

  const goBackToCart = () => {
    setView("cart");
    setCheckoutStatus("");
    scrollPanelTop();
  };

  const proceedToCheckout = (
    items: CartItem[],
    label: string,
    preferences?: LeonOrderPreferences | null,
  ) => {
    if (mixedCart) { setCheckoutStatus(mixedCartMessage); return; }
    if (checkoutBusy) return;

    setCheckoutStatus("");
    setCheckoutBusy(true);

    const result = requestWixCheckout(items, preferences);

    if (!result.ok) {
      const unsupported = result.unsupportedNames?.length
        ? ` (${result.unsupportedNames.join(", ")})`
        : "";
      setCheckoutBusy(false);
      setCheckoutStatus(`${result.message}${unsupported}`);
      return;
    }

    setCheckoutStatus(`Preparando ${label}…`);

    if (checkoutTimeoutRef.current) {
      clearTimeout(checkoutTimeoutRef.current);
    }

    checkoutTimeoutRef.current = setTimeout(() => {
      setCheckoutBusy(false);
      setCheckoutStatus(
        "No se abrió el pago. Puedes intentarlo otra vez sin recargar la página.",
      );
      checkoutTimeoutRef.current = null;
    }, CHECKOUT_RETRY_MS);
  };

  const readLeonPreferencesFromControls = () => {
    const dateControl =
      panelRef.current?.querySelector<HTMLInputElement>("[data-leon-delivery-date]");
    const timeControl =
      panelRef.current?.querySelector<HTMLSelectElement>("[data-leon-preferred-time]");

    const next: LeonOrderPreferences = {
      ...leonOrderPreferences,
      deliveryDate: String(dateControl?.value || leonOrderPreferences.deliveryDate || "").trim(),
      preferredTime: String(timeControl?.value || leonOrderPreferences.preferredTime || "").trim(),
    };

    return next;
  };

  const chooseLeonPayment = (method: LeonPaymentMethod) => {
    setShowLeonErrors(true);
    const focusInvalidControl = () => requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
    if (!leonFulfillmentConfirmed) {
      setLeonPaymentMethod(null);
      setResolvedPaymentPreferences(null);
      setCheckoutStatus(
        "Confirma que este pedido se entregará o recogerá en León, Gto. Para otra ciudad usa Envío nacional.",
      );
      focusInvalidControl();
      return;
    }

    const resolved = readLeonPreferencesFromControls();

    if (!isLeonOrderPreferencesComplete(resolved)) {
      setLeonPaymentMethod(null);
      setResolvedPaymentPreferences(null);
      setLeonStep("delivery");
      setCheckoutStatus("Revisa los campos señalados para continuar. Tu carrito se conserva.");
      focusInvalidControl();
      return;
    }

    setLeonOrderPreferences(resolved);
    setResolvedPaymentPreferences(resolved);
    setLeonPaymentMethod(method);
    setCheckoutStatus("");
  };

  const updateLeonPreferences = (patch: Partial<LeonOrderPreferences>) => {
    setLeonPaymentMethod(null);
    setLeonOrderPreferences((current) => ({
      ...current,
      ...patch,
      whatsappConfirmed: false,
    }));
    setResolvedPaymentPreferences(null);
    setCheckoutStatus("");
  };

  const renderCartItems = () => (
    <div className="taskbar-cart-items">
      {cart.items.map((item) => (
        <article
          key={`${item.fulfillment}:${item.id}`}
          className="taskbar-cart-item"
        >
          <span className="taskbar-cart-item-image">
            <Image
              src={withBasePath(item.image)}
              alt=""
              fill
              unoptimized
              sizes="48px"
              className="object-contain"
            />
          </span>
          <span className="taskbar-cart-item-copy">
            <strong>{item.name}</strong>
            <small>{item.detail}</small>
            {item.personalization && <small className="cart-personalization">Personalización: {item.personalization}</small>}
            <small>{money(item.unitPrice)} por unidad{item.fulfillment === "leon" ? " · SPEI" : ""} · {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}</small>
            <small
              className={`mt-1 font-bold ${
                item.fulfillment === "national"
                  ? "text-[#487986]"
                  : "text-[#9a6070]"
              }`}
            >
              {item.fulfillment === "national"
                ? <><SystemIcon name="box" /> Envío nacional</>
                : <><SystemIcon name="pin" /> Entrega en León</>}
            </small>
            {!item.wix.supported && (
              <small className="mt-1 font-bold text-[#9f5860]">
                Pendiente de conectar a Wix
              </small>
            )}
          </span>
          <span
            className="taskbar-cart-quantity"
            aria-label={`Cantidad de ${item.name}`}
          >
            <ShoppingButton
              type="button"
              aria-label={`Quitar una unidad de ${item.name}`}
              onClick={() => {
                setCheckoutStatus("");
                changeCartQuantity(item.id, -1, item.fulfillment);
              }}
            >
              −
            </ShoppingButton>
            <b>{item.quantity}</b>
            <ShoppingButton
              type="button"
              aria-label={`Agregar otra unidad de ${item.name}`}
              onClick={() => {
                setCheckoutStatus("");
                changeCartQuantity(item.id, 1, item.fulfillment);
              }}
            >
              +
            </ShoppingButton>
          </span>
          <strong className="taskbar-cart-price">
            <ProductPrice price={item.unitPrice * item.quantity} original={getCartRegularPrice(item.id, item.wix.supported ? item.wix.wixUnitPrice : item.unitPrice, item.unitPrice, item.fulfillment) * item.quantity} />
          </strong>
          <button
            type="button"
            className="taskbar-cart-remove"
            aria-label={`Eliminar ${item.name} del carrito`}
            onClick={() => {
              setCheckoutStatus("");
              removeCartItem(item.id, item.fulfillment);
            }}
          >
            ×
          </button>
        </article>
      ))}
    </div>
  );

  return (
    <div ref={shellRef} className="taskbar-cart-shell">
      {open && (
        <section
          ref={panelRef}
          id="taskbar-cart-panel"
          className={`taskbar-cart-panel ${
            view === "leon-checkout" ? "taskbar-cart-panel--checkout" : ""
          } ${view === "cart" && nationalItems.length > 0 ? "taskbar-cart-panel--national" : ""}`}
          aria-label={view === "cart" ? "Artículos del carrito" : "Completar pedido"}
        >
          <header className="taskbar-cart-titlebar">
            {view === "leon-checkout" ? (
              <>
                <button
                  type="button"
                  aria-label={leonStep === "payment" ? "Volver a entrega" : "Volver al carrito"}
                  onClick={leonStep === "payment" ? backToLeonDelivery : goBackToCart}
                >
                  ‹
                </button>
                <span className="flex-1 px-2 text-center">{leonStep === "payment" ? "Pago" : "Entrega"}</span>
                <button type="button" aria-label="Cerrar carrito" onClick={closeCart}>
                  ×
                </button>
              </>
            ) : (
              <>
                <span>Carrito{cart.count > 0 ? ` · ${cart.count} ${cart.count === 1 ? "producto" : "productos"}` : ""}</span>
                <button type="button" aria-label="Cerrar carrito" onClick={closeCart}>
                  ×
                </button>
              </>
            )}
          </header>

          <div className="taskbar-cart-scroll-body">
          {cart.items.length === 0 ? (
            <div className="taskbar-cart-empty-message">
              <p>Tu carrito está esperando algo guarridelicioso.</p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  onShop();
                }}
              >
                Ir a la tienda
              </button>
            </div>
          ) : view === "cart" ? (
            <>
              {leonItems.length > 0 && !mixedCart && (
                <div className="checkout-progress" aria-hidden="true">
                  <span data-state="current"><i />Carrito</span><span><i />Entrega</span><span><i />Pago</span>
                </div>
              )}
              {mixedCart && <p role="alert" className="m-3 rounded-lg border border-[#d8c0c8] bg-[#fff4f4] p-3 font-interface text-xs text-[#8a4545]">{mixedCartMessage}</p>}
              {renderCartItems()}

              <footer className="taskbar-cart-footer !block space-y-3">
                {leonItems.length > 0 && (
                  <section className="cart-leon-summary min-w-0 rounded-lg border border-[#d8c0c8] bg-white/70 p-3 text-left">
                    <p className="cart-leon-location">
                      <SystemIcon name="pin" /> Entrega en León, Gto.
                    </p>
                    <dl className="shopping-payment-totals" aria-label="Total según forma de pago">
                      <div><dt>Transferencia SPEI</dt><dd>{money(leonTransferTotal)}</dd></div>
                      <div><dt>Tarjeta · incluye procesamiento</dt><dd>{money(leonOnlineTotal)}</dd></div>
                    </dl>
                    <p className="cart-payment-explanation">En el siguiente paso eliges fecha, horario y entrega.</p>
                    <div className="cart-leon-cta">
                      <p className="cart-leon-total"><span>Total con SPEI</span><strong>{money(leonTransferTotal)}</strong></p>
                      <ShoppingButton
                        type="button"
                        onClick={goToLeonCheckout}
                        disabled={mixedCart}
                        className="boutique-purchase cart-leon-continue"
                      >
                        Continuar pedido
                      </ShoppingButton>
                    </div>
                  </section>
                )}

                {nationalItems.length > 0 && (
                  <section className="taskbar-cart-national-summary hidden min-w-0 rounded-lg border border-[#9fc1cb] bg-[#eef7f9] p-3 text-left sm:block">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#487986]">
                          <SystemIcon name="box" /> Envío nacional
                        </p>
                        <p className="mt-1 text-[9px] leading-4 text-[#657287]">
                          {itemUnits(nationalItems)} {itemUnits(nationalItems) === 1 ? "producto" : "productos"} · {money(nationalOnlineTotal)}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={mixedCart || checkoutBusy || !nationalCanCheckout}
                        onClick={() =>
                          proceedToCheckout(nationalItems, "tu envío nacional")
                        }
                        className="boutique-purchase shrink-0 !px-3 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {checkoutBusy
                          ? "Preparando…"
                          : nationalShippingPromo.state === "overweight"
                            ? "Envío especial"
                            : nationalCanCheckout
                              ? "Pagar nacional"
                              : `Mín. ${money(NATIONAL_SHIPPING_PROMO.minimumOrder)}`}
                      </button>
                    </div>

                    <div className="mt-2 border-t border-[#c7dce1] pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`min-w-0 break-words text-[8px] font-semibold leading-4 ${
                            nationalShippingPromo.state === "overweight"
                              ? "text-[#9f5860]"
                              : nationalShippingPromo.state === "free"
                                ? "text-[#446454]"
                                : nationalShippingPromo.state === "below_minimum"
                                  ? "text-[#8a6a43]"
                                  : "text-[#53627a]"
                          }`}
                          aria-live="polite"
                        >
                          {nationalShippingPromoMessage}
                        </p>
                        <span className="shrink-0 text-[8px] text-[#657287]">
                          {money(nationalOnlineTotal)} / {money(NATIONAL_SHIPPING_PROMO.freeShippingThreshold)}
                        </span>
                      </div>

                      <div
                        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#dce7ea]"
                        role="progressbar"
                        aria-label="Progreso para envío gratis"
                        aria-valuemin={0}
                        aria-valuemax={NATIONAL_SHIPPING_PROMO.freeShippingThreshold}
                        aria-valuenow={Math.min(
                          nationalOnlineTotal,
                          NATIONAL_SHIPPING_PROMO.freeShippingThreshold,
                        )}
                      >
                        <span
                          className="block h-full rounded-full bg-[#425BBC] transition-[width] duration-200"
                          style={{
                            width: `${nationalShippingPromo.purchaseProgress * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {nationalItems.length > 0 && (
                  <section className="min-w-0 rounded-lg border border-[#9fc1cb] bg-[#eef7f9] p-3 text-left sm:hidden">
                    <p className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#487986]">
                      <SystemIcon name="box" /> Envío nacional
                    </p>

                    <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
                      <div className="min-w-0">
                        <small className="block text-[10px] text-[#657287]">
                          Productos
                        </small>
                        <strong className="text-base text-[#263650]">
                          {money(nationalOnlineTotal)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        disabled={mixedCart || checkoutBusy || !nationalCanCheckout}
                        onClick={() =>
                          proceedToCheckout(nationalItems, "tu envío nacional")
                        }
                        className="boutique-purchase !px-4 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {checkoutBusy
                          ? "Preparando…"
                          : nationalShippingPromo.state === "overweight"
                            ? "Envío especial"
                            : nationalCanCheckout
                              ? "Pagar nacional"
                              : `Mín. ${money(NATIONAL_SHIPPING_PROMO.minimumOrder)}`}
                      </button>
                    </div>

                    <div className="mt-3 rounded-lg border border-[#b8d2d9] bg-white/75 p-2.5">
                      <p
                        className={`break-words text-[10px] font-semibold leading-5 ${
                          nationalShippingPromo.state === "overweight"
                            ? "text-[#9f5860]"
                            : nationalShippingPromo.state === "free"
                              ? "text-[#446454]"
                              : nationalShippingPromo.state === "below_minimum"
                                ? "text-[#8a6a43]"
                                : "text-[#53627a]"
                        }`}
                        aria-live="polite"
                      >
                        {nationalShippingPromoMessage}
                      </p>

                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-semibold text-[#657287]">
                          <span>Envío gratis</span>
                          <span>
                            {money(nationalOnlineTotal)} /{" "}
                            {money(NATIONAL_SHIPPING_PROMO.freeShippingThreshold)}
                          </span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-[#dce7ea]"
                          role="progressbar"
                          aria-label="Progreso para envío gratis"
                          aria-valuemin={0}
                          aria-valuemax={NATIONAL_SHIPPING_PROMO.freeShippingThreshold}
                          aria-valuenow={Math.min(
                            nationalOnlineTotal,
                            NATIONAL_SHIPPING_PROMO.freeShippingThreshold,
                          )}
                        >
                          <span
                            className="block h-full rounded-full bg-[#425BBC]"
                            style={{
                              width: `${nationalShippingPromo.purchaseProgress * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {nationalItems.length > 0 && leonItems.length > 0 && (
                  <p className="break-words text-left text-[8px] leading-4 text-[#718093]">
                    Conserva una sola modalidad de entrega en este carrito para continuar.
                  </p>
                )}

                {checkoutStatus && (
                  <p
                    className="break-words rounded-md border border-[#d7dde8] bg-white/80 px-3 py-2 text-left text-[9px] font-semibold leading-4 text-[#53627a]"
                    aria-live="polite"
                  >
                    {checkoutStatus}
                  </p>
                )}

                {nationalItems.length > 0 && (
                  <section className="cart-order-review" aria-label="Desglose de envío nacional">
                    <dl>
                      <div><dt>Productos</dt><dd>{money(nationalOnlineTotal)}</dd></div>
                      <div><dt>Envío estimado</dt><dd>{nationalShippingPromo.shippingCharge === null ? "Por confirmar" : money(nationalShippingPromo.shippingCharge)}</dd></div>
                      {nationalShippingPromo.shippingCharge !== null && <div><dt>Total estimado</dt><dd>{money(nationalOnlineTotal + nationalShippingPromo.shippingCharge)}</dd></div>}
                    </dl>
                    <p className="cart-payment-explanation">Dirección, plazo y total final se revisan en el checkout seguro de Wix antes de pagar.</p>
                  </section>
                )}

                <div className={`cart-continue-row flex flex-wrap items-center justify-between gap-2 border-t border-[#d6dee5] pt-3${leonItems.length > 0 && nationalItems.length === 0 ? " is-leon" : ""}`}>
                  <strong>Total de productos{leonItems.length > 0 && nationalItems.length === 0 ? " · SPEI en León" : ""}: {money(cart.total)}</strong>
                  <button
                    type="button"
                    className="cart-continue-shopping"
                    onClick={() => {
                      closeCart();
                      onShop();
                    }}
                  >
                    Seguir comprando
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className={`taskbar-checkout-view checkout-step-view min-w-0 p-3 sm:p-4`} data-leon-step={leonStep}>
              <div className="taskbar-checkout-steps checkout-progress" aria-label="Progreso del pedido">
                <span data-state="done"><i />✓ Carrito</span>
                <span data-state={leonStep === "delivery" ? "current" : "done"}><i />1 · Entrega</span>
                <span data-state={leonStep === "payment" ? "current" : undefined}><i />2 · Pago</span>
              </div>

              <div className="checkout-step-main">
              {leonStep === "delivery" ? (
                <>
                  <p className="taskbar-checkout-guidance">Revisa tus productos, elige la entrega y después la forma de pago.</p>

                  <details className="cart-order-review" open>
                    <summary>Tu pedido · {itemUnits(leonItems)} {itemUnits(leonItems) === 1 ? "producto" : "productos"}</summary>
                    <ul>
                      {leonItems.map(item => <li key={item.id}>
                        <strong>{item.quantity} × {item.name}</strong>
                        <p>{item.detail}</p>
                        {item.personalization && <p>Personalización: {item.personalization}</p>}
                      </li>)}
                    </ul>
                    <button type="button" onClick={goBackToCart}>Editar cantidades o quitar productos</button>
                  </details>

                  <LeonOrderPreferencesForm
                    value={leonOrderPreferences}
                    onChange={updateLeonPreferences}
                    errors={leonErrors}
                  />
                </>
              ) : (
                <>
                  <button type="button" className="checkout-delivery-recap" onClick={backToLeonDelivery}>
                    <span>
                      <SystemIcon name="pin" /> {deliveryMethodLabel(leonOrderPreferences.deliveryMethod)}
                      {" · "}{leonOrderPreferences.deliveryDate} · {leonOrderPreferences.preferredTime}
                    </span>
                    <u>Editar entrega</u>
                  </button>

                  <section className="checkout-payment-step min-w-0 text-left">
                    <h3 className="checkout-step-heading">¿Cómo quieres pagar?</h3>
                    <div className="grid min-w-0 gap-2">
                      <button
                        type="button"
                        onClick={() => chooseLeonPayment("spei")}
                        aria-pressed={leonPaymentMethod === "spei"}
                        className="checkout-pay-option"
                      >
                        <span className="checkout-pay-dot" aria-hidden="true" />
                        <span className="min-w-0">
                          <strong>Transferencia SPEI <em className="checkout-pay-tag">Mejor precio</em></strong>
                          <small>Precio preferencial · te damos la CLABE al continuar</small>
                        </span>
                        <b>{money(leonTransferTotal)}</b>
                      </button>

                      <button
                        type="button"
                        onClick={() => chooseLeonPayment("online")}
                        aria-pressed={leonPaymentMethod === "online"}
                        className="checkout-pay-option"
                      >
                        <span className="checkout-pay-dot" aria-hidden="true" />
                        <span className="min-w-0">
                          <strong>Tarjeta / pago en línea</strong>
                          <small>Incluye procesamiento · pago seguro con Wix</small>
                        </span>
                        <b>{money(leonOnlineTotal)}</b>
                      </button>
                    </div>

                    <label className="checkout-leon-confirm">
                      <input
                        type="checkbox"
                        aria-invalid={showLeonErrors && !leonFulfillmentConfirmed}
                        aria-describedby={showLeonErrors && !leonFulfillmentConfirmed ? "leon-location-error" : undefined}
                        checked={leonFulfillmentConfirmed}
                        onChange={(event) => {
                          setLeonFulfillmentConfirmed(event.target.checked);
                          setLeonPaymentMethod(null);
                          setResolvedPaymentPreferences(null);
                          setCheckoutStatus("");
                        }}
                      />
                      <span>
                        Confirmo que lo recibo o recojo en <strong>León, Gto.</strong>
                        <small>¿Otra ciudad? Usa Envío nacional.</small>
                      </span>
                    </label>
                    {showLeonErrors && !leonFulfillmentConfirmed && <p id="leon-location-error" className="checkout-field-error">Confirma que recibirás el pedido en León, Gto.</p>}

                    <p className="checkout-pay-note">
                      <SystemIcon name="chat" /> Elegir la forma de pago todavía no realiza el cobro. Pago completo; fecha y horario se confirman por WhatsApp.
                    </p>

                    {leonPaymentMethod && resolvedPaymentPreferences && (
                      <section className="cart-order-review" aria-label="Revisa antes de pagar">
                        <h3>Revisa antes de pagar</h3>
                        <dl>
                          <div><dt>Entrega solicitada</dt><dd>{deliveryMethodLabel(resolvedPaymentPreferences.deliveryMethod)}</dd></div>
                          {resolvedPaymentPreferences.deliveryMethod === "pickup_point" && <div><dt>Punto medio</dt><dd>{resolvedPaymentPreferences.deliveryPoint}</dd></div>}
                          {["home_delivery", "uber_eats"].includes(resolvedPaymentPreferences.deliveryMethod) && <div><dt>Dirección</dt><dd>{resolvedPaymentPreferences.deliveryAddress}</dd></div>}
                          <div><dt>Fecha y horario solicitados</dt><dd>{resolvedPaymentPreferences.deliveryDate} · {resolvedPaymentPreferences.preferredTime}</dd></div>
                          <div><dt>Productos · {leonPaymentMethod === "online" ? "tarjeta con procesamiento" : "SPEI"}</dt><dd>{money(leonPaymentMethod === "online" ? leonOnlineTotal : leonTransferTotal)}</dd></div>
                        </dl>
                        <p>Disponibilidad pendiente de confirmar por WhatsApp. Si eliges Uber, su costo se cotiza aparte.</p>
                      </section>
                    )}

                    {leonPaymentMethod === "online" && resolvedPaymentPreferences && (
                      <button
                        type="button"
                        disabled={checkoutBusy}
                        onClick={() =>
                          proceedToCheckout(
                            leonItems,
                            "tu pago seguro en Wix",
                            readLeonPreferencesFromControls(),
                          )
                        }
                        className="checkout-primary-button"
                      >
                        {checkoutBusy
                          ? "Preparando pago…"
                          : `Pagar ${money(leonOnlineTotal)} con tarjeta`}
                      </button>
                    )}

                    {leonPaymentMethod === "spei" && resolvedPaymentPreferences && (
                      <div className="mt-3 min-w-0">
                        <SpeiPaymentFlow
                          items={leonItems}
                          preferences={resolvedPaymentPreferences}
                        />
                      </div>
                    )}
                  </section>
                </>
              )}

              {checkoutStatus && (
                <p
                  className="checkout-status mt-3 break-words rounded-lg border border-[#d7dde8] bg-white px-3 py-2 text-left font-semibold text-[#53627a]"
                  aria-live="polite"
                >
                  {checkoutStatus}
                </p>
              )}
              </div>

              <aside className="checkout-summary" aria-label="Resumen del pedido">
                <h3>Tu pedido</h3>
                <dl>
                  <div><dt>Productos</dt><dd>{itemUnits(leonItems)}</dd></div>
                  <div><dt>Entrega</dt><dd>León, Gto.</dd></div>
                  <div><dt>Día y hora</dt><dd>{leonOrderPreferences.deliveryDate && leonOrderPreferences.preferredTime ? `${leonOrderPreferences.deliveryDate} · ${leonOrderPreferences.preferredTime}` : "Por elegir"}</dd></div>
                </dl>
                <p className="checkout-summary-total">
                  <span>{leonStep === "payment" && leonPaymentMethod === "online" ? "Total con tarjeta" : "Total con SPEI"}</span>
                  <strong>{money(leonStep === "payment" && leonPaymentMethod === "online" ? leonOnlineTotal : leonTransferTotal)}</strong>
                </p>
                {leonStep === "delivery" ? (
                  <>
                    <button type="button" className="checkout-primary-button" onClick={continueToLeonPayment}>
                      Continuar al pago →
                    </button>
                    <button type="button" className="checkout-secondary-link" onClick={goBackToCart}>
                      ← Volver al carrito
                    </button>
                  </>
                ) : (
                  <button type="button" className="checkout-secondary-link" onClick={backToLeonDelivery}>
                    ← Editar entrega
                  </button>
                )}
              </aside>
            </div>
          )}
          </div>
        </section>
      )}

      <button
        type="button"
        className="taskbar-cart-tray"
        aria-label={`Carrito con ${cart.count} ${cart.count === 1 ? "artículo" : "artículos"}`}
        aria-expanded={open}
        aria-controls="taskbar-cart-panel"
        onClick={() => { if (open) closeCart(); else setOpen(true); }}
      >
        <span className="taskbar-cart-tray-image">
          <Image
            src={withBasePath("/icons/desktop/taskbar-cart.webp")}
            alt=""
            fill
            unoptimized
            sizes="44px"
            className="object-contain"
          />
        </span>
        {cart.count > 0 && <b className="taskbar-cart-badge">{cart.count}</b>}
        <span className="taskbar-dock-label" aria-hidden="true">Carrito</span>
      </button>
    </div>
  );
}
