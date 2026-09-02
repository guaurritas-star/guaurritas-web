import type { CartItem } from "@/lib/cart-store";
import type { WixCatalogReference } from "@/lib/wix-commerce-map";
import { buildProtectedUnitPrices } from "@/lib/payment-pricing";

export const WIX_CHECKOUT_MESSAGE_TYPE = "guaurritas:checkout";
export const GUAURRITAS_BRIDGE_SOURCE = "guaurritas-web";

export type WixCheckoutPayloadItem = {
  cartItemId: string;
  name: string;
  detail: string;
  quantity: number;
  catalogReference: WixCatalogReference;
  catalogOverrideFields?: {
    price: string;
  };
};

export type WixCheckoutRequest = {
  source: typeof GUAURRITAS_BRIDGE_SOURCE;
  type: typeof WIX_CHECKOUT_MESSAGE_TYPE;
  items: WixCheckoutPayloadItem[];
  buyerNote: string;
};

export type WixCheckoutRequestResult =
  | { ok: true }
  | { ok: false; message: string; unsupportedNames?: string[] };

function buildBuyerNote(items: CartItem[]) {
  const lines = items.map(
    (item) =>
      `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""}`,
  );

  return ["Pedido preparado desde Guaurritas OS", ...lines]
    .join("\n")
    .slice(0, 1000);
}

export function requestWixCheckout(
  items: CartItem[],
): WixCheckoutRequestResult {
  if (!items.length) {
    return { ok: false, message: "Tu carrito está vacío." };
  }

  const unsupported = items.filter((item) => !item.wix.supported);
  if (unsupported.length) {
    return {
      ok: false,
      message:
        unsupported.length === 1
          ? `${unsupported[0].name} todavía no está listo para checkout en Wix.`
          : "Hay artículos que todavía no están listos para checkout en Wix.",
      unsupportedNames: unsupported.map((item) => item.name),
    };
  }

  if (typeof window === "undefined") {
    return { ok: false, message: "El checkout solo puede abrirse desde el navegador." };
  }

  if (window.self === window.top) {
    return {
      ok: false,
      message: "Abre esta tienda desde guaurritas.com para proceder al pago seguro.",
    };
  }

  const protectedPricing = buildProtectedUnitPrices(items);

  const checkoutItems: WixCheckoutPayloadItem[] = items.map((item) => {
    if (!item.wix.supported) {
      throw new Error(`Unsupported Wix cart item: ${item.id}`);
    }

    const protectedUnitPrice =
      protectedPricing.unitPrices.get(`${item.fulfillment}:${item.id}`) ??
      item.unitPrice;

    return {
      cartItemId: item.id,
      name: item.name,
      detail: item.detail,
      quantity: item.quantity,
      catalogReference: item.wix.catalogReference,
      catalogOverrideFields: {
        price: protectedUnitPrice.toFixed(2),
      },
    };
  });

  const payload: WixCheckoutRequest = {
    source: GUAURRITAS_BRIDGE_SOURCE,
    type: WIX_CHECKOUT_MESSAGE_TYPE,
    buyerNote: buildBuyerNote(items),
    items: checkoutItems,
  };

  window.parent.postMessage(payload, "*");
  return { ok: true };
}
