import type { CartItem } from "@/lib/cart-store";

export type LeonDeliveryMethod =
  | "pending_whatsapp"
  | "pickup_point"
  | "home_delivery"
  | "uber_eats";

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
  deliveryMethod: "pending_whatsapp",
  deliveryPoint: "",
  deliveryAddress: "",
  personalizationNote: "",
  whatsappConfirmed: false,
};

const LEON_TIME_ZONE = "America/Mexico_City";

function mexicoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LEON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00-06:00`);
}

function keyFromDate(date: Date) {
  return mexicoDateKey(date);
}

export function minimumLeonDeliveryDate(now = new Date()) {
  const today = dateFromKey(mexicoDateKey(now));
  const candidate = new Date(today.getTime());

  do {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  } while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6);

  return keyFromDate(candidate);
}

export function isLeonDeliveryDateAllowed(dateKey: string, now = new Date()) {
  const normalized = String(dateKey || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  return normalized >= minimumLeonDeliveryDate(now);
}

export function deliveryMethodLabel(method: LeonOrderPreferences["deliveryMethod"]) {
  if (method === "pending_whatsapp") return "Por confirmar por WhatsApp";
  if (method === "pickup_point") return "Punto medio";
  if (method === "home_delivery") return "Entrega a domicilio";
  if (method === "uber_eats") return "Uber";
  return "Por confirmar por WhatsApp";
}

export function isLeonOrderPreferencesComplete(preferences: LeonOrderPreferences) {
  const deliveryDate = String(preferences.deliveryDate || "").trim();
  const preferredTime = String(preferences.preferredTime || "").trim();
  return Boolean(
    isLeonDeliveryDateAllowed(deliveryDate) &&
      /^([01]\d|2[0-3]):[0-5]$/.test(preferredTime),
  );
}

export function encodeOrderPreferencesMarker(preferences: LeonOrderPreferences) {
  const compact = {
    d: preferences.deliveryDate,
    t: preferences.preferredTime,
    m: "pending_whatsapp",
    w: preferences.whatsappConfirmed ? 1 : 0,
    n: preferences.personalizationNote.trim().slice(0, 240),
  };

  return `GUAURRITAS_PREFS:${JSON.stringify(compact)}`;
}

export function buildOrderBuyerNote(
  items: CartItem[],
  preferences?: LeonOrderPreferences | null,
  prefix = "Pedido preparado desde Guaurritas OS",
) {
  const humanLines = [
    prefix,
    ...items.map(
      (item) => `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""}`,
    ),
  ];

  if (!preferences) return humanLines.join("\n").slice(0, 1000);

  humanLines.push(
    `Fecha y horario solicitados: ${preferences.deliveryDate} · ${preferences.preferredTime}`,
    "Entrega: se coordina por WhatsApp después del pago.",
    "Opciones locales: HEB López Mateos, Plaza Mayor, Mercado Metropolitano, Parque Cárcamos, Parque Panorama o Uber con costo adicional.",
  );

  if (preferences.personalizationNote) {
    humanLines.push(`Personalización: ${preferences.personalizationNote}`);
  }

  humanLines.push(
    preferences.whatsappConfirmed
      ? "Disponibilidad de fecha/horario: confirmada previamente por WhatsApp"
      : "Disponibilidad de fecha/horario: pendiente de confirmar por WhatsApp",
  );

  const marker = encodeOrderPreferencesMarker(preferences);
  const separator = "\n";
  const humanLimit = Math.max(0, 1000 - marker.length - separator.length);
  const human = humanLines.join("\n").slice(0, humanLimit).trimEnd();
  return `${human}${human ? separator : ""}${marker}`.slice(0, 1000);
}
