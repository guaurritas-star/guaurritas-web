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

export async function fetchKitGuaurriCookiesConfig(
  signal?: AbortSignal,
): Promise<KitGuaurriCookiesConfig> {
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
