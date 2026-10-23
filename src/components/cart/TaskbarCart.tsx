"use client";

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
  const [leonCheckoutStep, setLeonCheckoutStep] = useState<"delivery" | "payment">("delivery");
  const [leonValidationAttempted, setLeonValidationAttempted] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [leonPaymentMethod, setLeonPaymentMethod] =
    useState<LeonPaymentMethod | null>(null);
  const [leonFulfillmentConfirmed, setLeonFulfillmentConfirmed] = useState(false);
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
    setLeonCheckoutStep("delivery");
    setLeonValidationAttempted(false);
    setLeonPaymentMethod(null);
    setResolvedPaymentPreferences(null);
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
      setLeonCheckoutStep("delivery");
      setLeonValidationAttempted(false);
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

  const scrollPanelTop = () => {
    requestAnimationFrame(() => {
      panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const goToLeonCheckout = () => {
    if (mixedCart) { setCheckoutStatus(mixedCartMessage); return; }
    setView("leon-checkout");
    setLeonCheckoutStep("delivery");
    setLeonValidationAttempted(false);
    setLeonFulfillmentConfirmed(false);
    setResolvedPaymentPreferences(null);
    setCheckoutStatus("");
    setLeonPaymentMethod(null);
    scrollPanelTop();
  };

  const goBackToCart = () => {
    setView("cart");
    setLeonCheckoutStep("delivery");
    setLeonValidationAttempted(false);
    setLeonPaymentMethod(null);
    setResolvedPaymentPreferences(null);
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
    if (!leonFulfillmentConfirmed) {
      setLeonPaymentMethod(null);
      setResolvedPaymentPreferences(null);
      setCheckoutStatus(
        "Confirma que este pedido se entregará o recogerá en León, Gto. Para otra ciudad usa Envío nacional.",
      );
      return;
    }

    const resolved = readLeonPreferencesFromControls();

    if (!isLeonOrderPreferencesComplete(resolved)) {
      setLeonPaymentMethod(null);
      setResolvedPaymentPreferences(null);
      setCheckoutStatus("Completa fecha, horario y los datos de la entrega elegida para continuar.");
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

  const continueToLeonPayment = () => {
    const resolved = readLeonPreferencesFromControls();
    const dateControl = panelRef.current?.querySelector<HTMLInputElement>("[data-leon-delivery-date]");
    const validDate = !dateControl || dateControl.checkValidity();
    if (!isLeonOrderPreferencesComplete(resolved) || !validDate) {
      setLeonValidationAttempted(true);
      setCheckoutStatus("Revisa los campos indicados para continuar.");
      requestAnimationFrame(() => {
        panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], input:invalid, select:invalid')?.focus();
      });
      return;
    }

    // The next-step CTA confirms a León-only order; guard both payment options.
    setLeonOrderPreferences(resolved);
    setLeonFulfillmentConfirmed(true);
    setLeonPaymentMethod(null);
    setResolvedPaymentPreferences(null);
    setLeonCheckoutStep("payment");
    setLeonValidationAttempted(false);
    setCheckoutStatus("");
    scrollPanelTop();
  };

  const editLeonDelivery = () => {
    setLeonCheckoutStep("delivery");
    setLeonPaymentMethod(null);
    setResolvedPaymentPreferences(null);
    setCheckoutStatus("");
    scrollPanelTop();
  };

  useEffect(() => {
    if (!open || view !== "leon-checkout") return;
    const frame = requestAnimationFrame(() => {
      const id = leonCheckoutStep === "payment" ? "#leon-payment-heading" : "#leon-delivery-heading";
      panelRef.current?.querySelector<HTMLElement>(id)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, view, leonCheckoutStep]);

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
                  aria-label="Volver al carrito"
                  onClick={goBackToCart}
                >
                  ‹
                </button>
                <span className="flex-1 px-2 text-center">Completar pedido</span>
                <button type="button" aria-label="Cerrar carrito" onClick={closeCart}>
                  ×
                </button>
              </>
            ) : (
              <>
                <span>Carrito</span>
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
              {mixedCart && <p role="alert" className="m-3 rounded-lg border border-[#d8c0c8] bg-[#fff4f4] p-3 font-interface text-xs text-[#8a4545]">{mixedCartMessage}</p>}
              {renderCartItems()}

              <footer className="taskbar-cart-footer !block space-y-3">
                {leonItems.length > 0 && (
                  <section className="min-w-0 rounded-lg border border-[#d8c0c8] bg-white/70 p-3 text-left">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#955b69]">
                          <SystemIcon name="pin" /> Pedido en León
                        </p>
                        <p className="mt-1 text-[9px] leading-4 text-[#657287]">
                          {itemUnits(leonItems)} {itemUnits(leonItems) === 1 ? "producto" : "productos"} · {money(leonTransferTotal)}
                        </p>
                      </div>
                      <ShoppingButton
                        type="button"
                        onClick={goToLeonCheckout}
                        disabled={mixedCart}
                        className="boutique-purchase shrink-0"
                      >
                        Continuar pedido
                      </ShoppingButton>
                    </div>
                    <dl className="shopping-payment-totals" aria-label="Total según forma de pago">
                      <div><dt>Transferencia SPEI</dt><dd>{money(leonTransferTotal)}</dd></div>
                      <div><dt>Tarjeta · incluye procesamiento</dt><dd>{money(leonOnlineTotal)}</dd></div>
                    </dl>
                    <p className="cart-payment-explanation">Pago completo. Elige fecha, horario y entrega en el siguiente paso; confirmamos disponibilidad por WhatsApp. Uber se cotiza aparte.</p>
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
                    Los artículos nacionales y los de León se finalizan por separado porque usan logística distinta.
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

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#d6dee5] pt-3">
                  <strong>Total de productos: {money(cart.total)}</strong>
                  <button
                    type="button"
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
            <div className="taskbar-checkout-view min-w-0 p-4 sm:p-5">
              <p className="mb-3 font-interface text-[15px] text-[#425b8c]" aria-label="Progreso del pedido">
                Paso {leonCheckoutStep === "delivery" ? "1" : "2"} de 2 · {leonCheckoutStep === "delivery" ? "Entrega" : "Pago"}
              </p>

              <section className="mb-4 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#ead7de] bg-[#fff9fb] p-4">
                <div className="min-w-0">
                  <p className="font-interface text-[16px] text-[#955b69]">Tu pedido en León</p>
                  <p className="mt-1 text-[14px] text-[#53627a]">
                    {itemUnits(leonItems)} {itemUnits(leonItems) === 1 ? "producto" : "productos"} · pago completo
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-[13px] text-[#53627a]">Desde</span>
                  <strong className="font-title text-[20px] text-[#263650]">{money(leonTransferTotal)}</strong>
                </div>
              </section>

              {leonCheckoutStep === "delivery" ? (
                <>
                  <LeonOrderPreferencesForm
                    value={leonOrderPreferences}
                    onChange={updateLeonPreferences}
                    showErrors={leonValidationAttempted}
                  />
                  {checkoutStatus && (
                    <p role="alert" className="mt-3 rounded-md border border-[#a66d88] bg-[#fff9fb] p-3 text-[15px] leading-6 text-[#944b65]">
                      {checkoutStatus}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={continueToLeonPayment}
                    className="leon-next-step mt-4 min-h-12 w-full rounded-md border border-[#b77c5f] bg-[#D9A689] px-4 py-3 font-interface text-[18px] text-[#263650] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#425b8c]"
                  >
                    Continuar al pago →
                  </button>
                  <p className="mt-3 text-[14px] leading-5 text-[#53627a]">
                    Al continuar, confirmas que tu pedido se entregará o recogerá en León, Gto.
                  </p>
                </>
              ) : (
                <>
                  <section className="mb-4 rounded-xl border border-[#cbd5e8] bg-white p-4" aria-label="Resumen de entrega">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-title text-[18px] text-[#263650]">Tu entrega</h2>
                        <p className="mt-2 text-[15px] leading-6 text-[#53627a]">
                          {leonOrderPreferences.deliveryDate} · {leonOrderPreferences.preferredTime}
                        </p>
                        <p className="text-[15px] leading-6 text-[#53627a]">
                          {leonOrderPreferences.deliveryMethod === "pickup_point"
                            ? leonOrderPreferences.deliveryPoint
                            : leonOrderPreferences.deliveryMethod === "home_delivery" || leonOrderPreferences.deliveryMethod === "uber_eats"
                              ? "A domicilio por Uber · costo adicional"
                              : "Coordinación por WhatsApp"}
                        </p>
                      </div>
                      <button type="button" onClick={editLeonDelivery}
                        className="leon-edit-delivery min-h-12 shrink-0 rounded-md border border-[#637aa6] bg-white px-3 font-interface text-[16px] text-[#425b8c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#425b8c]">
                        Editar
                      </button>
                    </div>
                  </section>
              <section className="min-w-0 rounded-xl border border-[#cbd5e8] bg-white p-4 text-left">
                <h2 id="leon-payment-heading" tabIndex={-1} className="font-title text-[21px] leading-7 text-[#263650]">
                  Elige cómo pagar
                </h2>
                <p className="mt-2 text-[15px] leading-6 text-[#53627a]">
                  Pago completo · Elige transferencia o tarjeta.
                </p>
                <div className="mt-3 grid min-w-0 gap-2">
                  <button
                    type="button"
                    onClick={() => chooseLeonPayment("spei")}
                    className={`flex min-h-[68px] min-w-0 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      leonPaymentMethod === "spei"
                        ? "border-[#425BBC] bg-[#eef1ff] shadow-[inset_3px_0_0_#425BBC]"
                        : "border-[#d7deea] bg-[#fbfcff]"
                    }`}
                  >
                    <span className="min-w-0">
                      <strong className="block break-words font-interface text-[17px] text-[#263650]">
                        Transferencia SPEI
                      </strong>
                      <small className="mt-1 block break-words text-[14px] leading-5 text-[#53627a]">
                        Precio preferencial
                      </small>
                    </span>
                    <strong className="shrink-0 font-title text-[19px] text-[#425BBC]">
                      {money(leonTransferTotal)}
                    </strong>
                  </button>

                  <button
                    type="button"
                    onClick={() => chooseLeonPayment("online")}
                    className={`flex min-h-[68px] min-w-0 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      leonPaymentMethod === "online"
                        ? "border-[#425BBC] bg-[#eef1ff] shadow-[inset_3px_0_0_#425BBC]"
                        : "border-[#d7deea] bg-[#fbfcff]"
                    }`}
                  >
                    <span className="min-w-0">
                      <strong className="block break-words font-interface text-[17px] text-[#263650]">
                        Tarjeta / pago en línea
                      </strong>
                      <small className="mt-1 block break-words text-[14px] leading-5 text-[#53627a]">
                        Pago seguro con Wix
                      </small>
                    </span>
                    <strong className="shrink-0 font-title text-[19px] text-[#425BBC]">
                      {money(leonOnlineTotal)}
                    </strong>
                  </button>
                </div>

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
                    className="leon-online-pay-button mt-4 min-h-12 w-full rounded-md border border-[#31499b] bg-[#425BBC] px-4 py-3 font-interface text-[17px] text-white disabled:cursor-wait disabled:opacity-60"
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

              {leonCheckoutStep === "payment" && checkoutStatus && (
                <p
                  className="mt-3 break-words rounded-lg border border-[#d7dde8] bg-white px-3 py-2 text-left text-[15px] leading-6 text-[#53627a]"
                  aria-live="polite"
                >
                  {checkoutStatus}
                </p>
              )}

              <button
                type="button"
                onClick={goBackToCart}
                className="mt-4 min-h-12 w-full bg-transparent px-2 py-3 font-interface text-[16px] text-[#425b8c] underline decoration-[#b8c4e9] underline-offset-4"
              >
                ← Volver al carrito para editar productos
              </button>
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
      </button>
    </div>
  );
}
