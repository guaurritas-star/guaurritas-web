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
import { calculateProtectedOnlineTotal } from "@/lib/payment-pricing";

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
  const shellRef = useRef<HTMLDivElement>(null);
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
  const nationalOnlineTotal = calculateProtectedOnlineTotal(nationalBaseTotal);
  const leonOnlineTotal = calculateProtectedOnlineTotal(leonTransferTotal);

  const proceedToCheckout = (items: CartItem[], label: string) => {
    const result = requestWixCheckout(items);

    if (!result.ok) {
      const unsupported = result.unsupportedNames?.length
        ? ` (${result.unsupportedNames.join(", ")})`
        : "";
      setCheckoutStatus(`${result.message}${unsupported}`);
      return;
    }

    setCheckoutStatus(`Preparando ${label} en Wix…`);
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
                        onClick={() =>
                          proceedToCheckout(nationalItems, "tu envío nacional")
                        }
                        className="!border-[#425b8c] !bg-[#425b8c] !text-white shadow-[2px_2px_0_#aab8d2]"
                      >
                        Pagar nacional
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
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-[#e2cbd0] bg-white p-2">
                        <small className="block text-[9px] text-[#718093]">
                          Transferencia SPEI
                        </small>
                        <strong className="text-sm text-[#263650]">
                          {money(leonTransferTotal)}
                        </strong>
                        <span className="mt-1 block text-[8px] font-semibold text-[#9a6070]">
                          Precio preferencial
                        </span>
                      </div>
                      <div className="rounded-md border border-[#c4cedf] bg-white p-2">
                        <small className="block text-[9px] text-[#718093]">
                          Pago en línea
                        </small>
                        <strong className="text-sm text-[#263650]">
                          {money(leonOnlineTotal)}
                        </strong>
                        <button
                          type="button"
                          onClick={() =>
                            proceedToCheckout(leonItems, "tu pedido de León")
                          }
                          className="mt-2 w-full !border-[#425b8c] !bg-[#425b8c] !text-white"
                        >
                          Pagar en línea
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[9px] leading-4 text-[#6f6266]">
                      La transferencia se habilitará aquí con CLABE, referencia y
                      comprobante. No usamos anticipo: el pedido se confirma al 100%.
                    </p>
                  </section>
                )}

                {nationalItems.length > 0 && leonItems.length > 0 && (
                  <p className="text-left text-[9px] leading-4 text-[#718093]">
                    Los artículos nacionales y los de León se finalizan por separado
                    porque usan logística y entrega distintas.
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

                {checkoutStatus && (
                  <p
                    className="text-right text-[10px] font-semibold leading-4 text-[#53627a]"
                    aria-live="polite"
                  >
                    {checkoutStatus}
                  </p>
                )}
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
