export const KIT_GUAURRICOOKIES_PRODUCT_KEY = "guaurricookies-kit";
export const KIT_GUAURRICOOKIES_WIX_PRODUCT_ID =
  "0e801d31-decc-4968-817c-983387a0a5cd";
export const KIT_GUAURRICOOKIES_PRICE = 299;
export const KIT_GUAURRICOOKIES_BAG_COUNT = 4;
export const KIT_GUAURRICOOKIES_CONFIG_URL =
  "https://www.guaurritas.com/_functions/kitGuaurriCookies";

export type KitGuaurriCookiesFlavor = {
  label: string;
  sourceProductId: string;
  available: boolean;
  quantity: number | null;
  image: string;
};

export type KitGuaurriCookiesConfig = {
  id: string;
  name: string;
  price: number;
  weight: number;
  image: string;
  flavors: KitGuaurriCookiesFlavor[];
};

const FALLBACK_KIT_GUAURRICOOKIES_CONFIG: KitGuaurriCookiesConfig = {
  id: KIT_GUAURRICOOKIES_WIX_PRODUCT_ID,
  name: "Kit GuaurriCookies",
  price: KIT_GUAURRICOOKIES_PRICE,
  weight: 0.4,
  image:
    "https://static.wixstatic.com/media/24a095_23e0b3c256d24dd98249401230fbd06f~mv2.png",
  flavors: [
    {
      label: "Cacahuate + Tocino",
      sourceProductId: "1a61cf70-7d92-79ab-20f1-4f30eef3b1b7",
      available: true,
      quantity: null,
      image: "",
    },
    {
      label: "Manzana + Plátano",
      sourceProductId: "a1a1f670-ba83-ed8e-8b4c-e6d43f637348",
      available: true,
      quantity: null,
      image: "",
    },
    {
      label: "Pollo + Calabaza",
      sourceProductId: "96eaf1f0-561b-4adc-0240-f7981b97bb4f",
      available: true,
      quantity: null,
      image: "",
    },
    {
      label: "Pollo + Zanahoria",
      sourceProductId: "9876918f-25af-9234-fb0f-2656775b664d",
      available: true,
      quantity: null,
      image: "",
    },
  ],
};

export async function fetchKitGuaurriCookiesConfig(
  signal?: AbortSignal,
): Promise<KitGuaurriCookiesConfig> {
  try {
    const response = await fetch(KIT_GUAURRICOOKIES_CONFIG_URL, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `No pudimos leer la disponibilidad del kit desde Wix (${response.status}).`,
      );
    }

    const payload = await response.json();
    const config = payload?.data ?? payload;

    if (
      !config ||
      config.id !== KIT_GUAURRICOOKIES_WIX_PRODUCT_ID ||
      !Array.isArray(config.flavors)
    ) {
      throw new Error("Wix devolvió una configuración incompleta para el kit.");
    }

    return {
      id: String(config.id),
      name: String(config.name || "Kit GuaurriCookies"),
      price: Number(config.price || KIT_GUAURRICOOKIES_PRICE),
      weight: Number(config.weight || 0.4),
      image: String(config.image || ""),
      flavors: config.flavors
        .map((flavor: unknown) => {
          const item = flavor as Partial<KitGuaurriCookiesFlavor>;
          return {
            label: String(item.label || "").trim(),
            sourceProductId: String(item.sourceProductId || "").trim(),
            available: Boolean(item.available),
            quantity:
              item.quantity === null || item.quantity === undefined
                ? null
                : Number(item.quantity),
            image: String(item.image || ""),
          };
        })
        .filter((flavor: KitGuaurriCookiesFlavor) => flavor.label),
    };
  } catch (error) {
    if (signal?.aborted) throw error;

    // El OS no debe bloquear el configurador si el endpoint Wix todavía no
    // está publicado. Usamos los cuatro sabores reales ya registrados en Wix
    // como respaldo y, cuando el endpoint esté disponible, el inventario en
    // vivo vuelve a tener prioridad automáticamente.
    console.warn(
      "[KIT GUAURRICOOKIES] Wix no respondió; usando sabores de respaldo.",
      error,
    );

    return FALLBACK_KIT_GUAURRICOOKIES_CONFIG;
  }
}

export function encodeKitGuaurriCookiesSlots(slots: string[]) {
  return encodeURIComponent(slots.join("|"));
}

export function decodeKitGuaurriCookiesSlots(encoded: string) {
  try {
    const decoded = decodeURIComponent(encoded || "");
    const slots = decoded
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    return slots.length === KIT_GUAURRICOOKIES_BAG_COUNT ? slots : [];
  } catch {
    return [];
  }
}

export function summarizeKitGuaurriCookiesSlots(slots: string[]) {
  const counts = new Map<string, number>();

  slots.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([label, count]) => `${label} ×${count}`)
    .join(" · ");
}
