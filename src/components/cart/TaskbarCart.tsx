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

type LeonPaymentMethod = "spei" | "online";

type SpeiDetails = {
  clabe: string;
  beneficiary: string;
  institution: string;
  currency?: string;
};

const BRIDGE_SOURCE = "guaurritas-web";
const SPEI_REQUEST_MESSAGE = "guaurritas:spei-request";
const WIX_BRIDGE_SOURCE = "guaurritas-wix";
const SPEI_DETAILS_MESSAGE = "guaurritas:spei-details";
const SPEI_ERROR_MESSAGE = "guaurritas:spei-error";
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
  const [speiDetails, setSpeiDetails] = useState<SpeiDetails | null>(null);
  const [speiLoading, setSpeiLoading] = useState(false);
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

  useEffect(() => {
    const handleWixMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      let message = event.data;
      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }

      if (!message || typeof message !== "object") return;
      if (message.source !== WIX_BRIDGE_SOURCE) return;

      if (message.type === SPEI_DETAILS_MESSAGE) {
        const details = message.details as SpeiDetails | undefined;
        if (!details?.clabe || !details?.beneficiary || !details?.institution) {
          setSpeiLoading(false);
          setCheckoutStatus("Wix respondió sin datos SPEI completos. Intenta de nuevo.");
          return;
        }

        setSpeiDetails(details);
        setSpeiLoading(false);
        setCheckoutStatus("");
        return;
      }

      if (message.type === SPEI_ERROR_MESSAGE) {
        setSpeiLoading(false);
        setCheckoutStatus(
          typeof message.message === "string"
            ? message.message
            : "No pudimos cargar los datos SPEI. Intenta de nuevo.",
        );
      }
    };

    window.addEventListener("message", handleWixMessage);
    return () => window.removeEventListener("message", handleWixMessage);
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

  const proceedToCheckout = (items: CartItem[], label: string) => {
    if (checkoutBusy) return;

    setCheckoutStatus("");
    setCheckoutBusy(true);

    const result = requestWixCheckout(items);

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

  const requestSpeiDetails = () => {
    if (speiLoading) return;

    if (typeof window === "undefined" || window.self === window.top) {
      setCheckoutStatus("Abre esta tienda desde guaurritas.com para ver los datos SPEI.");
      return;
    }

    setCheckoutStatus("");
    setSpeiLoading(true);

    window.parent.postMessage(
      {
        source: BRIDGE_SOURCE,
        type: SPEI_REQUEST_MESSAGE,
      },
      "*",
    );
  };

  const copyClabe = async () => {
    if (!speiDetails?.clabe) return;

    try {
      await navigator.clipboard.writeText(speiDetails.clabe);
      setCheckoutStatus("CLABE copiada. ✨");
    } catch {
      setCheckoutStatus("No se pudo copiar automáticamente. Puedes seleccionar la CLABE manualmente.");
    }
  };

  const chooseLeonPayment = (method: LeonPaymentMethod) => {
    setLeonPaymentMethod(method);
    setCheckoutStatus("");
  };

  const handleLeonContinue = () => {
    if (leonPaymentMethod === "online") {
      proceedToCheckout(leonItems, "tu pago seguro en Wix");
      return;
    }

    if (leonPaymentMethod === "spei") {
      requestSpeiDetails();
    }
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
                      El precio online ya contempla el costo de procesamiento. El
                      envío se calcula por separado en el flujo de entrega.
                    </p>
                  </section>
                )}

                {leonItems.length > 0 && (
                  <section className="rounded-lg border border-[#ddb8c0] bg-[#fcf2f4] p-3 text-left">
                    <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#955b69]">
                      📍 Entrega en León · pago completo
                    </p>

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

                    {leonPaymentMethod && (
                      <button
                        type="button"
                        disabled={
                          (leonPaymentMethod === "online" && checkoutBusy) ||
                          (leonPaymentMethod === "spei" && speiLoading)
                        }
                        onClick={handleLeonContinue}
                        className="mt-3 w-full !border-[#425b8c] !bg-[#425b8c] !text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {leonPaymentMethod === "online"
                          ? checkoutBusy
                            ? "Preparando pago…"
                            : `Pagar ${money(leonOnlineTotal)} en línea`
                          : speiLoading
                            ? "Cargando datos SPEI…"
                            : speiDetails
                              ? "Actualizar datos SPEI"
                              : "Continuar con transferencia"}
                      </button>
                    )}

                    {leonPaymentMethod === "spei" && speiDetails && (
                      <div className="mt-3 rounded-md border border-[#d9c4ca] bg-white p-3">
                        <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#955b69]">
                          Datos para tu transferencia
                        </p>

                        <div className="mt-2 space-y-2 text-[10px] leading-4 text-[#344056]">
                          <div>
                            <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
                              Total a transferir
                            </small>
                            <strong className="text-sm">{money(leonTransferTotal)} MXN</strong>
                          </div>

                          <div>
                            <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
                              CLABE
                            </small>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong className="select-all break-all text-[12px] tracking-[0.04em]">
                                {speiDetails.clabe}
                              </strong>
                              <button
                                type="button"
                                onClick={copyClabe}
                                className="!border-[#c7cedc] !bg-[#f4f6fb] !px-2 !py-1 !text-[9px] !text-[#425b8c]"
                              >
                                Copiar CLABE
                              </button>
                            </div>
                          </div>

                          <div>
                            <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
                              Beneficiario
                            </small>
                            <strong>{speiDetails.beneficiary}</strong>
                          </div>

                          <div>
                            <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
                              Institución
                            </small>
                            <strong>{speiDetails.institution}</strong>
                          </div>
                        </div>

                        <p className="mt-3 border-t border-[#eadde1] pt-2 text-[9px] leading-4 text-[#6f6266]">
                          Tu pedido se confirma al recibir y validar el pago completo.
                          Conserva tu comprobante para el siguiente paso.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {nationalItems.length > 0 && leonItems.length > 0 && (
                  <p className="text-left text-[9px] leading-4 text-[#718093]">
                    Los artículos nacionales y los de León se finalizan por separado
                    porque usan logística y entrega distintas.
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
