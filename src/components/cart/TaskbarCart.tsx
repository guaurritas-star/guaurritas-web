"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  changeCartQuantity,
  hydrateCart,
  removeCartItem,
  useCart,
} from "@/lib/cart-store";
import { withBasePath } from "@/lib/base-path";
import { requestWixCheckout } from "@/lib/wix-checkout-bridge";

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
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

  const proceedToCheckout = () => {
    const result = requestWixCheckout(cart.items);

    if (!result.ok) {
      const unsupported = result.unsupportedNames?.length
        ? ` (${result.unsupportedNames.join(", ")})`
        : "";
      setCheckoutStatus(`${result.message}${unsupported}`);
      return;
    }

    setCheckoutStatus("Preparando tu pago seguro en Wix…");
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
                  <article key={item.id} className="taskbar-cart-item">
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
                          changeCartQuantity(item.id, -1);
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
                          changeCartQuantity(item.id, 1);
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
                        removeCartItem(item.id);
                      }}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>

              <footer className="taskbar-cart-footer">
                <strong>Total: {money(cart.total)}</strong>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onShop();
                    }}
                  >
                    Seguir comprando
                  </button>
                  <button
                    type="button"
                    onClick={proceedToCheckout}
                    className="!border-[#425b8c] !bg-[#425b8c] !text-white shadow-[2px_2px_0_#aab8d2]"
                  >
                    Proceder a pagar
                  </button>
                </div>
                {checkoutStatus && (
                  <p
                    className="basis-full text-right text-[10px] font-semibold leading-4 text-[#53627a]"
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
