// GUAURRITAS OS → WIX CHECKOUT
// Pega este código en el Page Code de la página de Wix donde vive el Custom Element.
// IMPORTANTE: cambia únicamente CUSTOM_ELEMENT_ID si el ID del elemento en Wix es distinto.
// El Tag Name "guaurritas-embed" NO necesariamente es el mismo que el ID de Wix.

import wixEcomFrontend from "wix-ecom-frontend";
import { currentCart } from "wix-ecom-backend";

const CUSTOM_ELEMENT_ID = "#guaurritas-embed";

$w.onReady(function () {
  const guaurritasEmbed = $w(CUSTOM_ELEMENT_ID);

  guaurritasEmbed.on("guaurritas-checkout", async (event) => {
    const detail = event?.detail ?? {};
    const items = Array.isArray(detail.items) ? detail.items : [];
    const buyerNote =
      typeof detail.buyerNote === "string" ? detail.buyerNote.slice(0, 1000) : "";

    if (!items.length) {
      console.warn("Guaurritas checkout: no llegaron artículos.");
      return;
    }

    const lineItems = items.map((item) => ({
      catalogReference: item.catalogReference,
      quantity: item.quantity,
    }));

    try {
      // Guaurritas OS es la fuente de verdad del carrito. Antes de pagar,
      // reconstruimos el carrito nativo de Wix con exactamente lo que aparece
      // en el carrito visual del OS.
      try {
        await currentCart.deleteCurrentCart();
      } catch (error) {
        // Si el visitante todavía no tenía carrito nativo, Wix puede responder
        // que no existe. En ese caso simplemente continuamos y Add To Current
        // Cart creará uno nuevo.
        console.info("No había carrito Wix previo; se creará uno nuevo.", error);
      }

      await currentCart.addToCurrentCart({ lineItems });

      // Conserva en el pedido las elecciones editoriales de Guaurritas que no
      // existen como variante nativa de Wix (por ejemplo proteína/salsa o la
      // distribución de sabores de GuaurriCookies).
      if (buyerNote) {
        try {
          await currentCart.updateCurrentCart({
            cartInfo: { buyerNote },
          });
        } catch (error) {
          // La nota nunca debe impedir el pago; los productos que tienen campos
          // de personalización propios ya viajan también en catalogReference.
          console.warn("No se pudo copiar la nota del pedido.", error);
        }
      }

      await wixEcomFrontend.refreshCart();

      const checkoutResult = await currentCart.createCheckoutFromCurrentCart({
        channelType: "WEB",
      });

      const checkoutId =
        typeof checkoutResult === "string"
          ? checkoutResult
          : checkoutResult?.checkoutId;

      if (!checkoutId) {
        throw new Error("Wix no devolvió un checkoutId.");
      }

      await wixEcomFrontend.navigateToCheckoutPage(checkoutId);
    } catch (error) {
      console.error("No se pudo preparar el checkout de Guaurritas:", error);
    }
  });
});
