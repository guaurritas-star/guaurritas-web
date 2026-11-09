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
  "Parque Metropolitano",
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

/** Las entregas en punto medio son por la tarde-noche, en esta ventana fija. */
export const LEON_PICKUP_POINT_TIME = "18:00-21:30";

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour)) return value;
  const date = new Date(Date.UTC(2000, 0, 1, hour, minute || 0));
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date);
}

/** "13:00" → "1:00 p.m." · "18:00-21:30" → "6:00 – 9:30 p.m." */
export function formatLeonTime(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const [start, end] = normalized.split("-");
  if (!end) return formatClock(start);
  const from = formatClock(start);
  const to = formatClock(end);
  const suffix = /\s*(a|p)\.?\s*m\.?$/i;
  const sameHalf = from.match(suffix)?.[0] && from.match(suffix)?.[0] === to.match(suffix)?.[0];
  return `${sameHalf ? from.replace(suffix, "") : from} – ${to}`;
}

/** "2026-11-10" → "Mar 10 nov" */
export function formatLeonDate(dateKey: string) {
  const normalized = String(dateKey || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const date = new Date(`${normalized}T12:00:00-06:00`);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "America/Mexico_City" }).format(date).replace(".", "");
  const weekday = part({ weekday: "short" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${part({ day: "numeric" })} ${part({ month: "short" })}`;
}

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
  // El navegador ya bloquea hoy mediante el atributo min del campo de fecha.
  // Para habilitar el pago solo necesitamos que el cliente haya elegido
  // efectivamente una fecha y un horario. Safari/iOS puede devolver formatos
  // nativos distintos y no debe bloquear el checkout por esa representación.
  const deliveryDate = String(preferences.deliveryDate || "").trim();
  const preferredTime = String(preferences.preferredTime || "").trim();
  if (!deliveryDate || !preferredTime) return false;
  if (preferences.deliveryMethod === "pickup_point") return LEON_PICKUP_POINTS.some(point => point === preferences.deliveryPoint);
  if (["home_delivery", "uber_eats"].includes(preferences.deliveryMethod)) return Boolean(preferences.deliveryAddress.trim());
  return preferences.deliveryMethod === "pending_whatsapp";
}

export function encodeOrderPreferencesMarker(preferences: LeonOrderPreferences) {
  const compact = {
    d: preferences.deliveryDate,
    t: preferences.preferredTime,
    m: preferences.deliveryMethod || "pending_whatsapp",
    p: preferences.deliveryMethod === "pickup_point" ? preferences.deliveryPoint.slice(0, 100) : "",
    a: ["home_delivery", "uber_eats"].includes(preferences.deliveryMethod) ? preferences.deliveryAddress.trim().slice(0, 240) : "",
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
  const itemPersonalizations = items
    .map((item) => {
      const text = String(item.personalization || "").trim();
      return text ? `${item.name}: ${text}` : "";
    })
    .filter(Boolean);

  const humanLines = [
    prefix,
    ...items.map(
      (item) => `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""}`,
    ),
    ...itemPersonalizations.map((value) => `Personalización: ${value}`),
  ];

  if (!preferences) return humanLines.join("\n").slice(0, 1000);

  humanLines.push(
    `Fecha y horario solicitados: ${preferences.deliveryDate} · ${preferences.preferredTime}`,
    `Entrega solicitada: ${deliveryMethodLabel(preferences.deliveryMethod)}${preferences.deliveryMethod === "pickup_point" ? ` · ${preferences.deliveryPoint}` : ["home_delivery", "uber_eats"].includes(preferences.deliveryMethod) ? ` · ${preferences.deliveryAddress.trim().slice(0, 240)}` : ""}`,
    "Fecha y horario sujetos a confirmación por WhatsApp. Uber se cotiza aparte.",
  );

  const combinedPersonalization = [
    preferences.personalizationNote,
    ...itemPersonalizations,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ")
    .slice(0, 500);

  humanLines.push(
    preferences.whatsappConfirmed
      ? "Disponibilidad de fecha/horario: confirmada previamente por WhatsApp"
      : "Disponibilidad de fecha/horario: pendiente de confirmar por WhatsApp",
  );

  const marker = encodeOrderPreferencesMarker({
    ...preferences,
    personalizationNote: combinedPersonalization,
  });
  const separator = "\n";
  const humanLimit = Math.max(0, 1000 - marker.length - separator.length);
  const human = humanLines.join("\n").slice(0, humanLimit).trimEnd();
  return `${human}${human ? separator : ""}${marker}`.slice(0, 1000);
}
