"use client";

import SystemIcon from "@/components/ui/SystemIcon";
import { useMemo } from "react";
import type { LeonCheckoutErrors } from "@/lib/checkout-ux";
import {
  LEON_TIME_OPTIONS,
  LEON_PICKUP_POINTS,
  minimumLeonDeliveryDate,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";

function prettyTime(value: string) {
  if (!value) return "Selecciona un horario";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// Próximos días hábiles disponibles (misma regla que minimumLeonDeliveryDate).
function nextDeliveryDays(firstKey: string, count = 4) {
  const keys: string[] = [];
  const cursor = new Date(`${firstKey}T12:00:00-06:00`);
  while (keys.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      keys.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function dayLabel(key: string) {
  const date = new Date(`${key}T12:00:00-06:00`);
  const weekday = new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "America/Mexico_City" }).format(date).replace(".", "");
  const day = new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: "America/Mexico_City" }).format(date);
  const month = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "America/Mexico_City" }).format(date).replace(".", "");
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day, month };
}

export default function LeonOrderPreferencesForm({
  value,
  onChange,
  errors,
}: {
  value: LeonOrderPreferences;
  onChange: (patch: Partial<LeonOrderPreferences>) => void;
  errors?: LeonCheckoutErrors;
}) {
  const minDate = useMemo(() => minimumLeonDeliveryDate(), []);
  const quickDays = useMemo(() => nextDeliveryDays(minDate), [minDate]);

  const update = (patch: Partial<LeonOrderPreferences>) => {
    onChange(patch);
  };

  return (
    <section className="leon-delivery-form min-w-0 overflow-hidden rounded-xl border border-[#cbd5e8] bg-white p-3.5 text-left shadow-[0_2px_0_rgba(66,91,188,0.06)]">
      <div className="mt-1 grid min-w-0 gap-3">
        <div className="leon-day-picker">
          <h3 className="checkout-step-heading">¿Qué día?</h3>
          <div className="leon-day-chips" role="group" aria-label="Próximos días disponibles">
            {quickDays.map((key) => {
              const label = dayLabel(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={value.deliveryDate === key}
                  aria-label={`${label.weekday} ${label.day} de ${label.month}`}
                  onClick={() => update({ deliveryDate: key })}
                >
                  <strong>{label.weekday} {label.day}</strong>
                  <small>{label.month}</small>
                </button>
              );
            })}
          </div>
        </div>
        <label className="leon-date-other block min-w-0 max-w-full overflow-hidden">
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Fecha de entrega · otra fecha
          </span>
          <input
            data-leon-delivery-date
            aria-invalid={Boolean(errors?.date)}
            aria-describedby={errors?.date ? "leon-date-error" : undefined}
            type="date"
            min={minDate}
            value={value.deliveryDate}
            onInput={(event) =>
              update({ deliveryDate: (event.currentTarget as HTMLInputElement).value })
            }
            onChange={(event) => update({ deliveryDate: event.currentTarget.value })}
            className="mt-1.5 block h-11 min-w-0 w-full max-w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          />
          {errors?.date && <small id="leon-date-error" className="checkout-field-error">{errors.date}</small>}
          <small className="mt-1 block whitespace-normal break-words text-[8px] leading-4 text-[#8a95a8]">
            Mínimo 1 día hábil de anticipación.
          </small>
        </label>

        <label className="block min-w-0 max-w-full overflow-hidden">
          <span className="checkout-step-heading leon-time-heading">
            ¿A qué hora? · horario preferido
          </span>
          <select
            data-leon-preferred-time
            aria-invalid={Boolean(errors?.time)}
            aria-describedby={errors?.time ? "leon-time-error" : undefined}
            value={value.preferredTime}
            onInput={(event) =>
              update({ preferredTime: (event.currentTarget as HTMLSelectElement).value })
            }
            onChange={(event) => update({ preferredTime: event.currentTarget.value })}
            className="mt-1.5 block h-11 min-w-0 w-full max-w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          >
            <option value="">Selecciona un horario</option>
            {LEON_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {prettyTime(time)}
              </option>
            ))}
          </select>
          {errors?.time && <small id="leon-time-error" className="checkout-field-error">{errors.time}</small>}
          <small className="mt-1 block whitespace-normal break-words text-[8px] leading-4 text-[#8a95a8]">
            Es una preferencia; todavía no queda reservado.
          </small>
        </label>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block"><span className="checkout-step-heading">¿Cómo lo recibes?</span>
          <select aria-label="Forma de entrega en León" value={value.deliveryMethod || "pending_whatsapp"} onChange={event => update({ deliveryMethod: event.target.value as LeonOrderPreferences["deliveryMethod"], deliveryPoint: "", deliveryAddress: "" })} className="mt-2 block min-h-12 w-full border border-[#637aa6] bg-white px-3">
            <option value="pending_whatsapp">Lo coordinaré por WhatsApp</option>
            <option value="pickup_point">Punto medio</option>
            <option value="home_delivery">A domicilio por Uber · costo adicional</option>
          </select>
        </label>
        {value.deliveryMethod === "pickup_point" && <label className="block"><span>Punto medio preferido</span>
          <select aria-label="Punto medio preferido" aria-invalid={Boolean(errors?.point)} aria-describedby={errors?.point ? "leon-point-error" : undefined} value={value.deliveryPoint} onChange={event => update({ deliveryPoint: event.target.value })} className="mt-2 block min-h-12 w-full border border-[#637aa6] bg-white px-3">
            <option value="">Selecciona un punto</option>{LEON_PICKUP_POINTS.map(point => <option key={point} value={point}>{point}</option>)}
          </select>
          {errors?.point && <small id="leon-point-error" className="checkout-field-error">{errors.point}</small>}
        </label>}
        {["home_delivery", "uber_eats"].includes(value.deliveryMethod) && <label className="block"><span>Dirección para cotizar Uber</span>
          <textarea aria-label="Dirección para cotizar Uber" aria-invalid={Boolean(errors?.address)} aria-describedby={errors?.address ? "leon-address-error" : undefined} maxLength={240} value={value.deliveryAddress} onChange={event => update({ deliveryAddress: event.target.value })} className="mt-2 block min-h-24 w-full border border-[#637aa6] bg-white p-3" />
          {errors?.address && <small id="leon-address-error" className="checkout-field-error">{errors.address}</small>}
          <small className="mt-2 block">El costo de Uber no está incluido en los productos; te lo confirmamos por WhatsApp.</small>
        </label>}
      </div>

      <div className="mt-3 flex min-w-0 max-w-full items-start gap-2 overflow-hidden rounded-lg border border-[#ecd8a6] bg-[#fff9e9] px-3 py-2.5">
        <span className="mt-0.5 shrink-0 text-[12px]"><SystemIcon name="chat" /></span>
        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <p className="leon-whatsapp-note whitespace-normal break-words leading-4 text-[#806c3e] [overflow-wrap:anywhere]">
            Te confirmamos fecha, horario y punto por WhatsApp al recibir tu pago. Uber se cotiza aparte.
          </p>
        </div>
      </div>
    </section>
  );
}
