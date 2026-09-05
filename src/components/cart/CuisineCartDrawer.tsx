"use client";

import Image from "next/image";
import {
  changeCartQuantity,
  removeCartItem,
  useCart,
} from "@/lib/cart-store";
import { withBasePath } from "@/lib/base-path";

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CuisineCartDrawer({
  open,
  onClose,
  onContinue,
}: {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  const cart = useCart();

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[80] flex justify-end bg-[#263650]/25 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito Guaurritas Cuisine"
        className="sticky top-0 flex h-[min(100%,calc(100dvh-6rem))] max-h-[48rem] w-full flex-col border-l-2 border-[#425b8c] bg-[#fffaf7] shadow-[-8px_0_0_rgba(66,91,140,0.16)] sm:w-[26rem]"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-[#d8c3cb] bg-[#f6e8ed] px-4 py-3">
          <span className="relative h-14 w-14 shrink-0">
            <Image
              src={withBasePath("/icons/desktop/taskbar-cart.webp")}
              alt=""
              fill
              unoptimized
              sizes="56px"
              className="object-contain"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-title text-lg font-semibold text-[#425b8c]">
              Tu carrito
            </p>
            <p className="mt-0.5 font-interface text-[10px] leading-4 text-[#746873]">
              {cart.count === 0
                ? "Está esperando algo guarridelicioso."
                : `${cart.count} ${cart.count === 1 ? "artículo" : "artículos"} en tu pedido.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="grid h-8 w-8 shrink-0 place-items-center border-2 border-[#f2f2f2] border-b-[#425b8c] border-r-[#425b8c] bg-[#a66d88] font-interface text-lg font-bold leading-none text-white active:border-[#425b8c] active:border-b-[#f2f2f2] active:border-r-[#f2f2f2]"
          >
            ×
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="grid flex-1 place-items-center overflow-y-auto px-6 py-8 text-center">
            <div>
              <span className="relative mx-auto block h-40 w-40">
                <Image
                  src={withBasePath("/icons/desktop/taskbar-cart.webp")}
                  alt="Carrito Guaurritas"
                  fill
                  unoptimized
                  sizes="160px"
                  className="object-contain opacity-90"
                />
              </span>
              <p className="mt-3 font-title text-xl text-[#425b8c]">
                Todavía hay espacio
              </p>
              <p className="mx-auto mt-2 max-w-64 font-interface text-xs leading-5 text-[#756b73]">
                Sigue explorando Cuisine y agrega lo que quieras revisar antes de pedir.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 border-2 border-[#637aa6] border-b-[#425b8c] border-r-[#425b8c] bg-[#f2f2f2] px-5 py-2.5 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#425b8c]"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {cart.items.map((item) => (
                <article
                  key={`${item.fulfillment}:${item.id}`}
                  className="grid grid-cols-[58px_minmax(0,1fr)_auto] gap-3 border-b border-[#e2d4d9] py-4"
                >
                  <span className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#dccbd1] bg-white">
                    <Image
                      src={withBasePath(item.image)}
                      alt=""
                      fill
                      unoptimized
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-title text-sm font-semibold text-[#263650]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 font-interface text-[9px] leading-4 text-[#786d76]">
                      {item.detail}
                    </p>
                    <p
                      className={`mt-1 font-interface text-[8px] font-bold uppercase tracking-[0.08em] ${
                        item.fulfillment === "national"
                          ? "text-[#527c88]"
                          : "text-[#a66d88]"
                      }`}
                    >
                      {item.fulfillment === "national"
                        ? "📦 Envío nacional"
                        : "📍 Entrega en León"}
                    </p>

                    <div className="mt-2 inline-flex items-center border border-[#c8a9b6] bg-white">
                      <button
                        type="button"
                        aria-label={`Quitar una unidad de ${item.name}`}
                        onClick={() =>
                          changeCartQuantity(
                            item.id,
                            -1,
                            item.fulfillment,
                          )
                        }
                        className="h-7 w-7 font-interface text-sm font-bold text-[#425b8c]"
                      >
                        −
                      </button>
                      <b className="grid h-7 min-w-7 place-items-center border-x border-[#d8c3cb] px-1 font-interface text-[10px] text-[#263650]">
                        {item.quantity}
                      </b>
                      <button
                        type="button"
                        aria-label={`Agregar otra unidad de ${item.name}`}
                        onClick={() =>
                          changeCartQuantity(
                            item.id,
                            1,
                            item.fulfillment,
                          )
                        }
                        className="h-7 w-7 font-interface text-sm font-bold text-[#425b8c]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    <strong className="font-title text-sm text-[#263650]">
                      {money(item.unitPrice * item.quantity)}
                    </strong>
                    <button
                      type="button"
                      aria-label={`Eliminar ${item.name} del carrito`}
                      onClick={() =>
                        removeCartItem(item.id, item.fulfillment)
                      }
                      className="font-interface text-lg font-bold text-[#a66d88] hover:text-[#76445f]"
                    >
                      ×
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <footer className="shrink-0 border-t-2 border-[#d6b8c4] bg-[#f6e8ed] p-4">
              <div className="flex items-end justify-between gap-4">
                <span className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#806f78]">
                  Total
                </span>
                <strong className="font-title text-2xl text-[#425b8c]">
                  {money(cart.total)}
                </strong>
              </div>

              <button
                type="button"
                onClick={onContinue}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border-2 border-[#d7a9ba] border-b-[#75435e] border-r-[#75435e] bg-[#a66d88] px-4 font-interface text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_#75435e] active:translate-x-px active:translate-y-px active:shadow-none"
              >
                <span className="relative h-7 w-7">
                  <Image
                    src={withBasePath("/icons/desktop/taskbar-cart.webp")}
                    alt=""
                    fill
                    unoptimized
                    sizes="28px"
                    className="object-contain"
                  />
                </span>
                Continuar pedido
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#425b8c] underline decoration-[#b4bfd7] underline-offset-4"
              >
                ← Seguir comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
