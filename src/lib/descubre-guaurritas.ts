export const DESCUBRE_GUAURRITAS_PRODUCT_KEY = "descubre-guaurritas";
export const DESCUBRE_GUAURRITAS_WIX_PRODUCT_ID =
  "38398e06-6172-4a2c-90ca-1337a716d02c";
export const DESCUBRE_GUAURRITAS_PRICE = 399;
export const DESCUBRE_GUAURRITAS_COOKIE_COUNT = 2;
export const DESCUBRE_GUAURRITAS_IMAGE_URL =
  "https://static.wixstatic.com/media/24a095_8c5b65b9e236456eaf1ad34fa70cc900~mv2.png";
export const DESCUBRE_GUAURRITAS_CONFIG_URL =
  "https://www.guaurritas.com/_functions/descubreGuaurritas";

export type DescubreGuaurritasSazonador = {
  label: string;
  wixValue: string;
  available: boolean;
};

export type DescubreGuaurritasConfig = {
  id: string;
  name: string;
  price: number;
  weight: number;
  image: string;
  sticksAvailable: boolean;
  sazonadores: DescubreGuaurritasSazonador[];
};

const FALLBACK_DESCUBRE_GUAURRITAS_CONFIG: DescubreGuaurritasConfig = {
  id: DESCUBRE_GUAURRITAS_WIX_PRODUCT_ID,
  name: "Descubre Guaurritas",
  price: DESCUBRE_GUAURRITAS_PRICE,
  weight: 0.52,
  image: DESCUBRE_GUAURRITAS_IMAGE_URL,
  sticksAvailable: true,
  sazonadores: [
    {
      label: "Pollo + Calabaza",
      wixValue: "Pollo",
      available: true,
    },
    {
      label: "Res + Betabel",
      wixValue: "Res",
      available: true,
    },
  ],
};

export async function fetchDescubreGuaurritasConfig(
  signal?: AbortSignal,
): Promise<DescubreGuaurritasConfig> {
  try {
    const response = await fetch(DESCUBRE_GUAURRITAS_CONFIG_URL, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `No pudimos leer la disponibilidad de Descubre Guaurritas desde Wix (${response.status}).`,
      );
    }

    const payload = await response.json();
    const config = payload?.data ?? payload;

    if (
      !config ||
      config.id !== DESCUBRE_GUAURRITAS_WIX_PRODUCT_ID ||
      !Array.isArray(config.sazonadores)
    ) {
      throw new Error(
        "Wix devolvió una configuración incompleta para Descubre Guaurritas.",
      );
    }

    return {
      id: String(config.id),
      name: String(config.name || "Descubre Guaurritas"),
      price: Number(config.price || DESCUBRE_GUAURRITAS_PRICE),
      weight: Number(config.weight || 0.52),
      image: String(config.image || DESCUBRE_GUAURRITAS_IMAGE_URL),
      sticksAvailable: config.sticksAvailable !== false,
      sazonadores: config.sazonadores
        .map((choice: unknown) => {
          const item = choice as Partial<DescubreGuaurritasSazonador>;
          return {
            label: String(item.label || "").trim(),
            wixValue: String(item.wixValue || "").trim(),
            available: Boolean(item.available),
          };
        })
        .filter((choice: DescubreGuaurritasSazonador) => choice.label),
    };
  } catch (error) {
    if (signal?.aborted) throw error;

    console.warn(
      "[DESCUBRE GUAURRITAS] Wix no respondió; usando opciones de respaldo.",
      error,
    );

    return FALLBACK_DESCUBRE_GUAURRITAS_CONFIG;
  }
}

export function encodeDescubreGuaurritasSelection(
  cookieSlots: string[],
  sazonador: string,
) {
  return encodeURIComponent(
    JSON.stringify({
      cookies: cookieSlots,
      sazonador,
    }),
  );
}

export function decodeDescubreGuaurritasSelection(encoded: string) {
  try {
    const payload = JSON.parse(decodeURIComponent(encoded || ""));
    const cookies = Array.isArray(payload?.cookies)
      ? payload.cookies.map((value: unknown) => String(value || "").trim()).filter(Boolean)
      : [];
    const sazonador = String(payload?.sazonador || "").trim();

    if (
      cookies.length !== DESCUBRE_GUAURRITAS_COOKIE_COUNT ||
      !sazonador
    ) {
      return { cookies: [], sazonador: "" };
    }

    return { cookies, sazonador };
  } catch {
    return { cookies: [], sazonador: "" };
  }
}
