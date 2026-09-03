import type { CartItem } from "@/lib/cart-store";

export type LeonDeliveryMethod = "pickup_point" | "home_delivery" | "uber_eats";

export type LeonOrderPreferences = {
  deliveryDate: string;
  preferredTime: string;
  deliveryMethod: LeonDeliveryMethod | "";
  deliveryPoint: string;
  deliveryAddress: string;
  personalizationNote: string;
  whatsappConfirmed: boolean;
};

export const LEON_PICKUP_POINTS = [
  "HEB López Mateos",
  "Plaza Mayor",
  "Mercado Metropolitano",
  "Parque Cárcamos",
  "Parque Panorama",
] as const;

export const LEON_TIME_OPTIONS = [
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
] as const;

export const EMPTY_LEON_ORDER_PREFERENCES: LeonOrderPreferences = {
  deliveryDate: "",
  preferredTime: "",
  deliveryMethod: "",
  deliveryPoint: "",
  deliveryAddress: "",
  personalizationNote: "",
  whatsappConfirmed: false,
};

export function deliveryMethodLabel(method: LeonOrderPreferences["deliveryMethod"]) {
  if (method === "pickup_point") return "Punto medio";
  if (method === "home_delivery") return "Entrega a domicilio";
  if (method === "uber_eats") return "Uber Eats";
  return "Por definir";
}

export function isLeonOrderPreferencesComplete(preferences: LeonOrderPreferences) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferences.deliveryDate)) return false;
  if (!/^([01]\d|2[0-3]):[0-5]$/.test(preferences.preferredTime)) return false;
  if (!preferences.deliveryMethod) return false;
  if (preferences.deliveryMethod === "pickup_point" && !preferences.deliveryPoint.trim()) {
    return false;
  }
  if (
    ["home_delivery", "uber_eats"].includes(preferences.deliveryMethod) &&
    preferences.deliveryAddress.trim().length < 5
  ) {
    return false;
  }
  return true;
}

export function encodeOrderPreferencesMarker(preferences: LeonOrderPreferences) {
  const compact = {
    d: preferences.deliveryDate,
    t: preferences.preferredTime,
    m: preferences.deliveryMethod,
    p: preferences.deliveryPoint.trim(),
    a: preferences.deliveryAddress.trim(),
    w: preferences.whatsappConfirmed ? 1 : 0,
    n: preferences.personalizationNote.trim(),
  };

  return `GUAURRITAS_PREFS:${JSON.stringify(compact)}`;
}

export function buildOrderBuyerNote(
  items: CartItem[],
  preferences?: LeonOrderPreferences | null,
  prefix = "Pedido preparado desde Guaurritas OS",
) {
  const lines = [
    prefix,
    ...items.map(
      (item) => `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""}`,
    ),
  ];

  if (preferences) {
    lines.push(
      `Entrega solicitada: ${preferences.deliveryDate} · ${preferences.preferredTime} · ${deliveryMethodLabel(
        preferences.deliveryMethod,
      )}`,
    );
    if (preferences.deliveryPoint) lines.push(`Punto: ${preferences.deliveryPoint}`);
    if (preferences.deliveryAddress) lines.push(`Dirección: ${preferences.deliveryAddress}`);
    if (preferences.personalizationNote) {
      lines.push(`Personalización: ${preferences.personalizationNote}`);
    }
    lines.push(
      preferences.whatsappConfirmed
        ? "Disponibilidad: cliente indica confirmación previa por WhatsApp"
        : "Disponibilidad: pendiente de confirmar por WhatsApp",
    );
    lines.push(encodeOrderPreferencesMarker(preferences));
  }

  return lines.join("\n").slice(0, 1000);
}
