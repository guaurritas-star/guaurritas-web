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

type LeonPaymentMethod = "spei" | "online";

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

export default function TaskbarCart({ onShop }: { onShop: () => void }) {
  const [open, setOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [leonPaymentMethod, setLeonPaymentMethod] =
    useState<LeonPaymentMethod | null>(null);
  const [leonOrderPreferences, setLeonOrderPreferences] =
    useState<LeonOrderPreferences>({ ...EMPTY_LEON_ORDER_PREFERENCES });
  const shellRef = useRef<HTMLDivElement>(null);
  const checkoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCart();

  useEffect(() => hydrateCart(), []);

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
    if (!open) setCheckoutStatus("");
  }, [open]);

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
  const leonReadyForPayment =
    leonPreferencesComplete && leonOrderPreferences.whatsappConfirmed;

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

  const chooseLeonPayment = (method: LeonPaymentMethod) => {
    if (!leonReadyForPayment) {
      setCheckoutStatus(
        "Primero elige fecha y horario y confirma su disponibilidad con Guaurritas por WhatsApp.",
      );
      return;
    }
    setLeonPaymentMethod(method);
    setCheckoutStatus("");
  };

  const updateLeonPreferences = (next: LeonOrderPreferences) => {
    setLeonOrderPreferences(next);
    if (!next.whatsappConfirmed || !isLeonOrderPreferencesComplete(next)) {
      setLeonPaymentMethod(null);
    }
    setCheckoutStatus("");
  };

  return (
    <div ref={shellRef} className="taskbar-cart-shell">
      {open && (
        <section
          id="taskbar-cart-panel"
          className="taskbar-cart-panel"
          aria-label="Artículos del carrito"
        >
          <header className="taskbar-cart-titlebar">
            <span>Carrito</span>
            <button type="button" aria-label="Cerrar carrito" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          {cart.items.length === 0 ? (
            <div className="taskbar-cart-empty-message">
              <p>Tu carrito está esperando algo guarridelicioso.</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onShop();
                }}
              >
                Ir a la tienda
              </button>
            </div>
          ) : (
            <>
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
                    <span className="taskbar-cart-quantity" aria-label={`Cantidad de ${item.name}`}>
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

              <footer className="taskbar-cart-footer !block space-y-3">
                {nationalItems.length > 0 && (
                  <section className="rounded-lg border border-[#9fc1cb] bg-[#eef7f9] p-3 text-left">
                    <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#487986]">
                      📦 Envío nacional
                    </p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
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
                        className="!border-[#425b8c] !bg-[#425b8c] !text-white shadow-[2px_2px_0_#aab8d2] disabled:cursor-wait disabled:opacity-60"
                      >
                        {checkoutBusy ? "Preparando…" : "Pagar nacional"}
                      </button>
                    </div>
                    <p className="mt-2 text-[9px] leading-4 text-[#657287]">
                      El precio online ya contempla el costo de procesamiento. El envío nacional se calcula por separado.
                    </p>
                  </section>
                )}

                {leonItems.length > 0 && (
                  <section className="rounded-lg border border-[#ddb8c0] bg-[#fcf2f4] p-3 text-left">
                    <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#955b69]">
                      📍 Entrega en León · pago completo
                    </p>

                    <div className="mt-3">
                      <LeonOrderPreferencesForm
                        items={leonItems}
                        value={leonOrderPreferences}
                        onChange={updateLeonPreferences}
                      />
                    </div>

                    <div className="mt-3 rounded-lg border border-[#e5d2d7] bg-white/70 p-3">
                      <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#6f6266]">
                        2 · Pago del 100%
                      </p>

                      {!leonReadyForPayment ? (
                        <div className="mt-2 rounded-md border border-[#efd69d] bg-[#fff8e8] px-3 py-2 text-[9px] font-semibold leading-4 text-[#775b1f]">
                          Para habilitar el pago, elige fecha y horario preferido y confirma su disponibilidad con Guaurritas por WhatsApp.
                        </div>
                      ) : (
                        <>
                          <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6f6266]">
                            ¿Cómo quieres pagar?
                          </p>

                          <div className="mt-2 grid gap-2">
                            <button
                              type="button"
                              onClick={() => chooseLeonPayment("spei")}
                              className={`!flex !w-full !items-center !justify-between !gap-3 !rounded-md !border !p-3 !text-left !bg-[#D9A689] ${
                                leonPaymentMethod === "spei"
                                  ? "!border-[#9a654c] shadow-[inset_3px_0_0_#9a654c]"
                                  : "!border-[#c48d70]"
                              }`}
                            >
                              <span className="flex min-w-0 items-start gap-2">
                                <span className="mt-0.5 text-xs text-[#263650]">
                                  {leonPaymentMethod === "spei" ? "●" : "○"}
                                </span>
                                <span className="min-w-0">
                                  <strong className="block text-[11px] text-[#263650]">
                                    Transferencia SPEI
                                  </strong>
                                  <small className="block text-[9px] leading-4 text-[#5f4c45]">
                                    Precio preferencial · pago completo
                                  </small>
                                </span>
                              </span>
                              <strong className="shrink-0 text-sm text-[#263650]">
                                {money(leonTransferTotal)}
                              </strong>
                            </button>

                            <button
                              type="button"
                              onClick={() => chooseLeonPayment("online")}
                              className={`!flex !w-full !items-center !justify-between !gap-3 !rounded-md !border !p-3 !text-left !bg-[#D9A689] ${
                                leonPaymentMethod === "online"
                                  ? "!border-[#9a654c] shadow-[inset_3px_0_0_#9a654c]"
                                  : "!border-[#c48d70]"
                              }`}
                            >
                              <span className="flex min-w-0 items-start gap-2">
                                <span className="mt-0.5 text-xs text-[#263650]">
                                  {leonPaymentMethod === "online" ? "●" : "○"}
                                </span>
                                <span className="min-w-0">
                                  <strong className="block text-[11px] text-[#263650]">
                                    Pago en línea
                                  </strong>
                                  <small className="block text-[9px] leading-4 text-[#5f4c45]">
                                    Pago seguro en Wix · precio con procesamiento incluido
                                  </small>
                                </span>
                              </span>
                              <strong className="shrink-0 text-sm text-[#263650]">
                                {money(leonOnlineTotal)}
                              </strong>
                            </button>
                          </div>

                          <div className="mt-3 rounded-md border border-[#c9d4e9] bg-[#f8f9fd] px-3 py-2 text-[8px] leading-4 text-[#657287]">
                            <strong className="block text-[#425b8c]">Entrega después del pago</strong>
                            Por WhatsApp coordinamos si recoges en HEB López Mateos, Plaza Mayor, Mercado Metropolitano, Parque Cárcamos o Parque Panorama. También podemos coordinar Uber con costo adicional al pedido.
                          </div>
                        </>
                      )}

                      {leonReadyForPayment && leonPaymentMethod === "online" && (
                        <button
                          type="button"
                          disabled={checkoutBusy}
                          onClick={() =>
                            proceedToCheckout(
                              leonItems,
                              "tu pago seguro en Wix",
                              leonOrderPreferences,
                            )
                          }
                          className="mt-3 w-full !border-[#425b8c] !bg-[#425b8c] !text-white disabled:cursor-wait disabled:opacity-60"
                        >
                          {checkoutBusy
                            ? "Preparando pago…"
                            : `Pagar ${money(leonOnlineTotal)} en línea`}
                        </button>
                      )}

                      {leonReadyForPayment && leonPaymentMethod === "spei" && (
                        <SpeiPaymentFlow
                          items={leonItems}
                          preferences={leonOrderPreferences}
                        />
                      )}
                    </div>
                  </section>
                )}

                {nationalItems.length > 0 && leonItems.length > 0 && (
                  <p className="text-left text-[9px] leading-4 text-[#718093]">
                    Los artículos nacionales y los de León se finalizan por separado porque usan logística distinta.
                  </p>
                )}

                {checkoutStatus && (
                  <p
                    className="rounded-md border border-[#d7dde8] bg-white/80 px-3 py-2 text-left text-[9px] font-semibold leading-4 text-[#53627a]"
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
                      setOpen(false);
                      onShop();
                    }}
                  >
                    Seguir comprando
                  </button>
                </div>
              </footer>
            </>
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
