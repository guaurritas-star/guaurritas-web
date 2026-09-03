"use client";

import { useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart-store";
import {
  LEON_PICKUP_POINTS,
  LEON_TIME_OPTIONS,
  deliveryMethodLabel,
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
  const [expanded, setExpanded] = useState(false);
  const [availabilityRequested, setAvailabilityRequested] = useState(false);
  const complete = isLeonOrderPreferencesComplete(value);
  const minDate = useMemo(() => minDateValue(), []);

  const update = (
    patch: Partial<LeonOrderPreferences>,
    resetWhatsappConfirmation = false,
  ) => {
    onChange({
      ...value,
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
    const place =
      value.deliveryMethod === "pickup_point"
        ? value.deliveryPoint
        : value.deliveryAddress;

    return encodeURIComponent(
      [
        "Hola Guaurritas 🐾 Quiero confirmar disponibilidad para mi pedido.",
        `📅 Fecha: ${prettyDate(value.deliveryDate)}`,
        `🕐 Horario preferido: ${prettyTime(value.preferredTime)}`,
        `🚗 Entrega: ${deliveryMethodLabel(value.deliveryMethod)}`,
        place ? `📍 ${place}` : "",
        products ? `🛍️ Pedido: ${products}` : "",
        "¿Tienen disponibilidad en ese horario?",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }, [complete, items, value]);

  const summary = complete
    ? `${prettyDate(value.deliveryDate)} · ${prettyTime(value.preferredTime)} · ${deliveryMethodLabel(
        value.deliveryMethod,
      )}`
    : "Elige fecha, horario preferido y forma de entrega";

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
            1 · Entrega y horario
          </span>
          <span className="mt-1 block truncate text-[10px] font-semibold text-[#344056]">
            {summary}
          </span>
        </span>
        <span className="shrink-0 text-[10px] font-bold text-[#425b8c]">
          {value.whatsappConfirmed ? "✓ Listo" : expanded ? "Cerrar" : "Completar"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-[#e1e6f0] bg-[#f8f9fd] p-3">
          <div>
            <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              Fecha de entrega
            </label>
            <input
              type="date"
              min={minDate}
              value={value.deliveryDate}
              onChange={(event) =>
                update({ deliveryDate: event.target.value }, true)
              }
              className="mt-1 h-10 w-full rounded-md border border-[#c9d4e9] bg-white px-3 text-[11px] text-[#263650] outline-none focus:border-[#425b8c]"
            />
            <p className="mt-1 text-[8px] leading-4 text-[#788297]">
              Los pedidos se solicitan con al menos 2 días de anticipación.
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
              El horario es una preferencia. Te confirmaremos disponibilidad por WhatsApp antes de que realices el pago.
            </p>
          </div>

          <div>
            <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              ¿Cómo quieres recibirlo?
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                ["pickup_point", "📍 Punto medio", "Nos vemos en un punto Guaurritas"],
                ["home_delivery", "🏠 Domicilio", "Entrega local con costo extra"],
                ["uber_eats", "🚗 Uber Eats", "Coordinamos entrega por app"],
              ].map(([method, label, help]) => (
                <button
                  key={method}
                  type="button"
                  onClick={() =>
                    update(
                      {
                        deliveryMethod: method as LeonOrderPreferences["deliveryMethod"],
                        deliveryPoint: method === "pickup_point" ? value.deliveryPoint : "",
                        deliveryAddress: method === "pickup_point" ? "" : value.deliveryAddress,
                      },
                      true,
                    )
                  }
                  className={`!rounded-md !border !p-2.5 !text-left !shadow-none ${
                    value.deliveryMethod === method
                      ? "!border-[#425b8c] !bg-[#eef1ff]"
                      : "!border-[#c9d4e9] !bg-white"
                  }`}
                >
                  <strong className="block text-[10px] text-[#263650]">{label}</strong>
                  <small className="mt-1 block text-[8px] leading-3 text-[#788297]">{help}</small>
                </button>
              ))}
            </div>
          </div>

          {value.deliveryMethod === "pickup_point" && (
            <div>
              <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
                Punto medio
              </label>
              <select
                value={value.deliveryPoint}
                onChange={(event) => update({ deliveryPoint: event.target.value }, true)}
                className="mt-1 h-10 w-full rounded-md border border-[#c9d4e9] bg-white px-3 text-[10px] text-[#263650] outline-none focus:border-[#425b8c]"
              >
                <option value="">Selecciona un punto</option>
                {LEON_PICKUP_POINTS.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
            </div>
          )}

          {["home_delivery", "uber_eats"].includes(value.deliveryMethod) && (
            <div>
              <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
                Dirección de entrega
              </label>
              <input
                type="text"
                value={value.deliveryAddress}
                onChange={(event) => update({ deliveryAddress: event.target.value }, true)}
                placeholder="Colonia, calle y referencias"
                className="mt-1 h-10 w-full rounded-md border border-[#c9d4e9] bg-white px-3 text-[10px] text-[#263650] outline-none focus:border-[#425b8c]"
              />
              {value.deliveryMethod === "uber_eats" && (
                <p className="mt-1 text-[8px] leading-4 text-[#788297]">
                  La tarifa de Uber Eats se confirma al coordinar la entrega.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="font-interface block text-[9px] font-bold uppercase tracking-[0.08em] text-[#5d6879]">
              Nota de personalización · opcional
            </label>
            <textarea
              value={value.personalizationNote}
              onChange={(event) =>
                update({ personalizationNote: event.target.value.slice(0, 350) })
              }
              maxLength={350}
              rows={3}
              placeholder="Ej. nombre, colores, temática o alguna indicación especial."
              className="mt-1 w-full resize-none rounded-md border border-[#c9d4e9] bg-white px-3 py-2 text-[10px] leading-4 text-[#263650] outline-none focus:border-[#425b8c]"
            />
            <p className="mt-1 text-[8px] text-[#788297]">
              Las fotos de referencia se integrarán en el siguiente bloque de personalización; esta nota ya viajará con el pedido.
            </p>
          </div>

          <div className="rounded-lg border border-[#b9c9df] bg-white p-3">
            <p className="font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-[#425b8c]">
              Confirmación de disponibilidad
            </p>
            <p className="mt-1 text-[9px] leading-4 text-[#657287]">
              Primero consúltanos el horario. Cuando te lo confirmemos por WhatsApp, vuelve aquí y marca la casilla para continuar al pago del 100%.
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
              Consultar disponibilidad por WhatsApp
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
                onChange={(event) =>
                  update({ whatsappConfirmed: event.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#425b8c]"
              />
              <span className="text-[9px] font-semibold leading-4 text-[#53627a]">
                Ya confirmé con Guaurritas por WhatsApp que este horario está disponible.
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
