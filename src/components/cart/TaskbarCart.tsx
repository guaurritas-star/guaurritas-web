"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
    maximumFractionDigits: 0,
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
  const [view, setView] = useState<CartView>("cart");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [leonPaymentMethod, setLeonPaymentMethod] =
    useState<LeonPaymentMethod | null>(null);
  const [leonOrderPreferences, setLeonOrderPreferences] =
    useState<LeonOrderPreferences>({ ...EMPTY_LEON_ORDER_PREFERENCES });
  const [resolvedPaymentPreferences, setResolvedPaymentPreferences] =
    useState<LeonOrderPreferences | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const checkoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCart();

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
      setView("cart");
      setCheckoutStatus("");
      setOpen(true);
    };

    window.addEventListener(OPEN_SYSTEM_CART_EVENT, openSystemCart);
    return () =>
      window.removeEventListener(OPEN_SYSTEM_CART_EVENT, openSystemCart);
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOutside = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setCheckoutStatus("");
      setView("cart");
    }
  }, [open]);

  useEffect(() => {
    if (view === "leon-checkout" && !cart.items.some((item) => item.fulfillment === "leon")) {
      setView("cart");
    }
  }, [cart.items, view]);

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

  const nationalBaseTotal = itemTotal(nationalItems);
  const leonTransferTotal = itemTotal(leonItems);
  const nationalOnlineTotal = buildProtectedUnitPrices(nationalItems).protectedTotal;
  const leonOnlineTotal = buildProtectedUnitPrices(leonItems).protectedTotal;
  const leonPreferencesComplete = isLeonOrderPreferencesComplete(leonOrderPreferences);
  const leonReadyForPayment = leonPreferencesComplete || Boolean(resolvedPaymentPreferences);

  const scrollPanelTop = () => {
    requestAnimationFrame(() => {
      panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const closeCart = () => {
    setOpen(false);
    setView("cart");
    setCheckoutStatus("");
  };

  const goToLeonCheckout = () => {
    setView("leon-checkout");
    setCheckoutStatus("");
    setLeonPaymentMethod(null);
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
      deliveryMethod: "pending_whatsapp",
      deliveryPoint: "",
      deliveryAddress: "",
      personalizationNote: "",
      whatsappConfirmed: false,
    };

    return next;
  };

  const chooseLeonPayment = (method: LeonPaymentMethod) => {
    const resolved = readLeonPreferencesFromControls();

    if (!isLeonOrderPreferencesComplete(resolved)) {
      setLeonPaymentMethod(null);
      setResolvedPaymentPreferences(null);
      setCheckoutStatus("Selecciona una fecha válida y un horario para continuar.");
      return;
    }

    setLeonOrderPreferences(resolved);
    setResolvedPaymentPreferences(resolved);
    setLeonPaymentMethod(method);
    setCheckoutStatus("");
  };

  const updateLeonPreferences = (patch: Partial<LeonOrderPreferences>) => {
    setLeonOrderPreferences((current) => ({
      ...current,
      deliveryMethod: "pending_whatsapp",
      deliveryPoint: "",
      deliveryAddress: "",
      personalizationNote: "",
      whatsappConfirmed: false,
      ...patch,
    }));
    setResolvedPaymentPreferences(null);
    setCheckoutStatus("");
  };

  useEffect(() => {
    if (!isLeonOrderPreferencesComplete(leonOrderPreferences) && !resolvedPaymentPreferences) {
      setLeonPaymentMethod(null);
    }
  }, [leonOrderPreferences, resolvedPaymentPreferences]);

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
                ? "📦 Envío nacional"
                : "📍 Entrega en León"}
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
            <button
              type="button"
              aria-label={`Quitar una unidad de ${item.name}`}
              onClick={() => {
                setCheckoutStatus("");
                changeCartQuantity(item.id, -1, item.fulfillment);
              }}
            >
              −
            </button>
            <b>{item.quantity}</b>
            <button
              type="button"
              aria-label={`Agregar otra unidad de ${item.name}`}
              onClick={() => {
                setCheckoutStatus("");
                changeCartQuantity(item.id, 1, item.fulfillment);
              }}
            >
              +
            </button>
          </span>
          <strong className="taskbar-cart-price">
            {money(item.unitPrice * item.quantity)}
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
          }`}
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
              {renderCartItems()}

              <footer className="taskbar-cart-footer !block space-y-3">
                {leonItems.length > 0 && (
                  <section className="min-w-0 rounded-lg border border-[#d8c0c8] bg-white/70 p-3 text-left">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#955b69]">
                          📍 Pedido en León
                        </p>
                        <p className="mt-1 text-[9px] leading-4 text-[#657287]">
                          {itemUnits(leonItems)} {itemUnits(leonItems) === 1 ? "producto" : "productos"} · {money(leonTransferTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={goToLeonCheckout}
                        className="shrink-0"
                      >
                        Continuar pedido
                      </button>
                    </div>
                    <p className="mt-2 break-words text-[8px] leading-4 text-[#7a7180]">
                      Después eliges fecha, horario y forma de pago.
                    </p>
                  </section>
                )}

                {nationalItems.length > 0 && (
                  <section className="min-w-0 rounded-lg border border-[#9fc1cb] bg-[#eef7f9] p-3 text-left">
                    <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#487986]">
                      📦 Envío nacional
                    </p>
                    <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
                      <div className="min-w-0">
                        <small className="block text-[9px] text-[#657287]">
                          Productos {money(nationalBaseTotal)}
                        </small>
                        <strong className="text-sm text-[#263650]">
                          Pago online: {money(nationalOnlineTotal)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        disabled={checkoutBusy}
                        onClick={() =>
                          proceedToCheckout(nationalItems, "tu envío nacional")
                        }
                        className="!border-[#425b8c] !bg-[#425b8c] !text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {checkoutBusy ? "Preparando…" : "Pagar nacional"}
                      </button>
                    </div>
                    <p className="mt-2 break-words text-[8px] leading-4 text-[#657287]">
                      El envío nacional se calcula por separado.
                    </p>
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
            <div className="taskbar-checkout-view min-w-0 p-3 sm:p-4">
              <div className="mb-3 flex min-w-0 items-center gap-2" aria-label="Progreso del pedido">
                <span className="shrink-0 rounded-full bg-[#425BBC] px-2.5 py-1 font-interface text-[8px] font-bold text-white">
                  1 · Horario
                </span>
                <span className="h-px min-w-0 flex-1 bg-[#dbe1ed]" />
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-interface text-[8px] font-bold ${
                    leonReadyForPayment
                      ? "bg-[#425BBC] text-white"
                      : "bg-[#edf0f5] text-[#8c96a7]"
                  }`}
                >
                  2 · Pago
                </span>
              </div>

              <section className="mb-3 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#ead7de] bg-[#fff9fb] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#955b69]">
                    Tu pedido en León
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-[#657287]">
                    {itemUnits(leonItems)} {itemUnits(leonItems) === 1 ? "producto" : "productos"} · pago completo
                  </p>
                </div>
                <strong className="shrink-0 font-title text-[15px] text-[#263650]">
                  {money(leonTransferTotal)}
                </strong>
              </section>

              <LeonOrderPreferencesForm
                value={leonOrderPreferences}
                onChange={updateLeonPreferences}
              />

              <section className="mt-3 min-w-0 rounded-xl border border-[#cbd5e8] bg-white p-3.5 text-left shadow-[0_2px_0_rgba(66,91,188,0.06)]">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef1ff] font-interface text-[10px] font-bold text-[#425BBC]">
                    2
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-interface text-[11px] font-bold text-[#27364f]">
                          Pago del 100%
                        </h3>
                        <p className="mt-0.5 text-[8px] leading-4 text-[#77849a]">
                          Elige SPEI o tarjeta.
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#eef1ff] px-2 py-1 text-[7px] font-bold text-[#425BBC]">
                        Elige forma de pago
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 break-words rounded-lg bg-[#f8f9fc] px-3 py-2 text-[8px] leading-4 text-[#7a8495]">
                  Al tocar SPEI o tarjeta verificamos la fecha y el horario seleccionados.
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
                      <strong className="block break-words font-interface text-[10px] text-[#263650]">
                        Transferencia SPEI
                      </strong>
                      <small className="mt-0.5 block break-words text-[8px] leading-4 text-[#738096]">
                        Precio preferencial
                      </small>
                    </span>
                    <strong className="shrink-0 font-title text-[13px] text-[#425BBC]">
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
                      <strong className="block break-words font-interface text-[10px] text-[#263650]">
                        Tarjeta / pago en línea
                      </strong>
                      <small className="mt-0.5 block break-words text-[8px] leading-4 text-[#738096]">
                        Pago seguro con Wix
                      </small>
                    </span>
                    <strong className="shrink-0 font-title text-[13px] text-[#425BBC]">
                      {money(leonOnlineTotal)}
                    </strong>
                  </button>
                </div>

                <p className="mt-3 break-words border-t border-[#e3e7ef] pt-3 text-[8px] leading-4 text-[#69778c]">
                  <strong className="text-[#425BBC]">Entrega después del pago:</strong>{" "}
                  coordinamos por WhatsApp el punto de entrega o Uber con costo adicional.
                </p>

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
                    className="mt-3 min-h-11 min-w-0 w-full rounded-lg border border-[#31499b] bg-[#425BBC] px-4 font-interface text-[10px] font-bold text-white shadow-[0_2px_0_#263f9a] disabled:cursor-wait disabled:opacity-60"
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

              {checkoutStatus && (
                <p
                  className="mt-3 break-words rounded-lg border border-[#d7dde8] bg-white px-3 py-2 text-left text-[8px] font-semibold leading-4 text-[#53627a]"
                  aria-live="polite"
                >
                  {checkoutStatus}
                </p>
              )}

              <button
                type="button"
                onClick={goBackToCart}
                className="mt-3 min-w-0 w-full border-0 bg-transparent py-2 font-interface text-[9px] font-bold text-[#425BBC] underline decoration-[#b8c4e9] underline-offset-4"
              >
                ← Volver al carrito para editar productos
              </button>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        className="taskbar-cart-tray"
        aria-label={`Carrito con ${cart.count} ${cart.count === 1 ? "artículo" : "artículos"}`}
        aria-expanded={open}
        aria-controls="taskbar-cart-panel"
        onClick={() => setOpen((current) => !current)}
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
