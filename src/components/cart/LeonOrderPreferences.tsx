"use client";

import { useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart-store";
import {
  LEON_PICKUP_POINTS,
  LEON_TIME_OPTIONS,
  isLeonOrderPreferencesComplete,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";

const WHATSAPP_NUMBER = "524775505243";

function minDateValue() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate(value: string) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function prettyTime(value: string) {
  if (!value) return "Sin horario";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function LeonOrderPreferencesForm({
  items,
  value,
  onChange,
}: {
  items: CartItem[];
  value: LeonOrderPreferences;
  onChange: (next: LeonOrderPreferences) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [availabilityRequested, setAvailabilityRequested] = useState(false);
  const complete = isLeonOrderPreferencesComplete(value);
  const minDate = useMemo(() => minDateValue(), []);

  const update = (
    patch: Partial<LeonOrderPreferences>,
    resetWhatsappConfirmation = false,
  ) => {
    onChange({
      ...value,
      deliveryMethod: "pending_whatsapp",
      deliveryPoint: "",
      deliveryAddress: "",
      ...patch,
      ...(resetWhatsappConfirmation ? { whatsappConfirmed: false } : {}),
    });
    if (resetWhatsappConfirmation) setAvailabilityRequested(false);
  };

  const whatsappMessage = useMemo(() => {
    if (!complete) return "";
    const products = items
      .map((item) => `${item.quantity}x ${item.name}${item.detail ? ` (${item.detail})` : ""}`)
      .join(", ");

    return encodeURIComponent(
      [
        "Hola Guaurritas 🐾 Quiero confirmar disponibilidad para mi pedido.",
        `📅 Fecha: ${prettyDate(value.deliveryDate)}`,
        `🕐 Horario preferido: ${prettyTime(value.preferredTime)}`,
        products ? `🛍️ Pedido: ${products}` : "",
        "¿Tienen disponibilidad en ese horario?",
        "La forma de entrega la coordinamos después del pago.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }, [complete, items, value.deliveryDate, value.preferredTime]);

  const summary = complete
    ? `${prettyDate(value.deliveryDate)} · ${prettyTime(value.preferredTime)}`
    : "Elige fecha y horario preferido";

  return (
    <section className="overflow-hidden rounded-lg border border-[#c9d4e9] bg-white text-left">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="!flex !w-full !items-center !justify-between !gap-3 !border-0 !bg-white !px-3 !py-3 !text-left !shadow-none"
        aria-expanded={expanded}
      >
        <span className="min-w-0">
          <span className="font-interface block text-[9px] font-bold uppercase tracking-[0.1em] text-[#425b8c]">
            1 · Fecha y horario
          </span>
          <span className="mt-1 block truncate text-[10px] font-semibold text-[#344056]">
            {summary}
          </span>
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#425b8c]">
          {value.whatsappConfirmed ? "✓ Confirmado" : expanded ? "Cerrar" : "Completar"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-[#e1e6f0] bg-[#f8f9fd] p-3">
          <div>
            <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              Fecha de entrega
            </label>
            <input
              type="date"
              min={minDate}
              value={value.deliveryDate}
              onChange={(event) => update({ deliveryDate: event.target.value }, true)}
              className="mt-1 h-10 w-full rounded-md border border-[#c9d4e9] bg-white px-3 text-[11px] text-[#263650] outline-none focus:border-[#425b8c]"
            />
            <p className="mt-1 text-[8px] leading-4 text-[#788297]">
              Solicita con al menos 2 días de anticipación.
            </p>
          </div>

          <div>
            <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              Horario preferido
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
              {LEON_TIME_OPTIONS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => update({ preferredTime: time }, true)}
                  className={`!min-h-9 !rounded-md !border !px-2 !py-1 !text-[9px] !font-bold !shadow-none ${
                    value.preferredTime === time
                      ? "!border-[#425b8c] !bg-[#425b8c] !text-white"
                      : "!border-[#c9d4e9] !bg-white !text-[#425b8c]"
                  }`}
                >
                  {prettyTime(time)}
                </button>
              ))}
            </div>
            <p className="mt-2 rounded-md border border-[#efd69d] bg-[#fff8e8] px-2.5 py-2 text-[9px] font-semibold leading-4 text-[#775b1f]">
              El horario es una preferencia. Confírmalo con nosotros por WhatsApp antes de pagar.
            </p>
          </div>

          <div className="rounded-md border border-[#c9d4e9] bg-white px-3 py-2.5">
            <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#425b8c]">
              Entrega se coordina después del pago
            </p>
            <p className="mt-1 text-[8px] leading-4 text-[#657287]">
              Puntos medios: {LEON_PICKUP_POINTS.join(" · ")}. También podemos coordinar Uber con costo adicional al pedido. Te confirmamos la opción final por WhatsApp.
            </p>
          </div>

          <div>
            <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              Nota de personalización · opcional
            </label>
            <textarea
              value={value.personalizationNote}
              onChange={(event) => update({ personalizationNote: event.target.value.slice(0, 350) })}
              maxLength={350}
              rows={2}
              placeholder="Ej. nombre, colores, temática o indicación especial."
              className="mt-1 w-full resize-none rounded-md border border-[#c9d4e9] bg-white px-3 py-2 text-[10px] leading-4 text-[#263650] outline-none focus:border-[#425b8c]"
            />
          </div>

          <div className="rounded-lg border border-[#b9c9df] bg-white p-3">
            <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#425b8c]">
              Confirmar disponibilidad
            </p>
            <p className="mt-1 text-[9px] leading-4 text-[#657287]">
              Solo confirmamos fecha y horario en este paso. La entrega se define después del pago.
            </p>

            <a
              href={complete ? `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                if (!complete) {
                  event.preventDefault();
                  return;
                }
                setAvailabilityRequested(true);
              }}
              aria-disabled={!complete}
              className={`mt-3 flex min-h-10 w-full items-center justify-center rounded-md border px-3 text-center text-[10px] font-bold ${
                complete
                  ? "border-[#2f7b5e] bg-[#eaf8f1] text-[#246048]"
                  : "pointer-events-none border-[#d7dde8] bg-[#f0f2f6] text-[#9aa3b2]"
              }`}
            >
              Consultar fecha y horario por WhatsApp
            </a>

            <label
              className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 ${
                availabilityRequested || value.whatsappConfirmed
                  ? "border-[#c9d4e9] bg-[#f8f9fd]"
                  : "border-[#e4e7ee] bg-[#f5f6f8] opacity-60"
              }`}
            >
              <input
                type="checkbox"
                disabled={!complete || (!availabilityRequested && !value.whatsappConfirmed)}
                checked={value.whatsappConfirmed}
                onChange={(event) => update({ whatsappConfirmed: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-[#425b8c]"
              />
              <span className="text-[9px] font-semibold leading-4 text-[#53627a]">
                Ya confirmé con Guaurritas por WhatsApp que esta fecha y horario están disponibles.
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
