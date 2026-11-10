"use client";

import SystemIcon from "@/components/ui/SystemIcon";
import { useMemo, useState } from "react";
import type { LeonCheckoutErrors } from "@/lib/checkout-ux";
import {
  LEON_PICKUP_POINTS,
  formatLeonDate,
  formatLeonTime,
  leonTimeSlots,
  minimumLeonDeliveryDate,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";

// Próximos días disponibles: desde el mínimo (1 día de anticipación), todos los días.
function nextDeliveryDays(firstKey: string, count = 6) {
  const keys: string[] = [];
  const cursor = new Date(`${firstKey}T12:00:00-06:00`);
  while (keys.length < count) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function dayLabel(key: string) {
  const date = new Date(`${key}T12:00:00-06:00`);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { ...options, timeZone: "America/Mexico_City" }).format(date).replace(".", "");
  const weekday = part({ weekday: "short" });
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day: part({ day: "numeric" }), month: part({ month: "short" }) };
}

// Etiqueta corta para el botón del día: "6–9:30 pm" / "1–8 pm".
function shortWindow(slot: string) {
  const [start, end] = slot.split("-");
  const clock = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    const h12 = hour % 12 || 12;
    return minute ? `${h12}:${String(minute).padStart(2, "0")}` : `${h12}`;
  };
  return `${clock(start)}–${clock(end)} ${Number(end.split(":")[0]) >= 12 ? "pm" : "am"}`;
}

const DELIVERY_OPTIONS: { value: LeonOrderPreferences["deliveryMethod"]; title: string; detail: string; tag: string }[] = [
  { value: "pickup_point", title: "Punto medio", detail: "Plaza Mayor, HEB, parques…", tag: "Sin costo" },
  { value: "home_delivery", title: "A domicilio por Uber", detail: "Te cotizamos el viaje", tag: "+ Uber" },
  { value: "pending_whatsapp", title: "Lo platicamos por WhatsApp", detail: "Si aún no sabes", tag: "" },
];

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
  const [showOtherDate, setShowOtherDate] = useState(
    () => Boolean(value.deliveryDate) && !quickDays.includes(value.deliveryDate),
  );
  const method = value.deliveryMethod || "pending_whatsapp";
  const slots = leonTimeSlots(value.deliveryDate);

  // El horario se deriva del día: no hay que elegir hora.
  // Al cambiar de día se conserva la hora solo si existe ese día.
  const chooseDate = (deliveryDate: string) =>
    onChange({ deliveryDate, preferredTime: leonTimeSlots(deliveryDate).includes(value.preferredTime) ? value.preferredTime : "" });
  const chooseMethod = (next: LeonOrderPreferences["deliveryMethod"]) =>
    onChange({ deliveryMethod: next, deliveryPoint: "", deliveryAddress: "" });

  return (
    <section className="leon-delivery-form min-w-0 overflow-hidden rounded-xl border border-[#cbd5e8] bg-white p-3.5 text-left shadow-[0_2px_0_rgba(66,91,188,0.06)]">
      <div className="mt-1 grid min-w-0 gap-3">
        <div className="leon-day-picker">
          <h3 className="checkout-step-heading">¿Qué día?</h3>
          <div className="leon-day-chips" role="group" aria-label="Próximos días disponibles">
            {quickDays.map((key) => {
              const label = dayLabel(key);
              const daySlots = leonTimeSlots(key);
              const dayWindow = `${daySlots[0]}-${daySlots[daySlots.length - 1]}`;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={value.deliveryDate === key}
                  aria-label={`${label.weekday} ${label.day} de ${label.month}, ${formatLeonTime(dayWindow)}`}
                  onClick={() => chooseDate(key)}
                >
                  <strong>{label.weekday} {label.day}</strong>
                  <small>{shortWindow(dayWindow)}</small>
                </button>
              );
            })}
          </div>
        </div>
        {!showOtherDate && !errors?.date && (
          <button type="button" className="leon-other-date-toggle" onClick={() => setShowOtherDate(true)}>
            Otra fecha
          </button>
        )}
        <label className="leon-date-other block min-w-0 max-w-full overflow-hidden" hidden={!showOtherDate && !errors?.date}>
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Otra fecha
          </span>
          <input
            data-leon-delivery-date
            aria-invalid={Boolean(errors?.date)}
            aria-describedby={errors?.date ? "leon-date-error" : undefined}
            type="date"
            min={minDate}
            value={value.deliveryDate}
            onInput={(event) => chooseDate((event.currentTarget as HTMLInputElement).value)}
            onChange={(event) => chooseDate(event.currentTarget.value)}
            className="mt-1.5 block h-11 min-w-0 w-full max-w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          />
          {errors?.date && <small id="leon-date-error" className="checkout-field-error">{errors.date}</small>}
          <small className="mt-1 block whitespace-normal break-words text-[8px] leading-4 text-[#8a95a8]">
            Mínimo 1 día de anticipación.
          </small>
        </label>
        {slots.length > 0 && (
          <div className="leon-time-picker">
            <h3 className="checkout-step-heading">¿A qué hora? <small>{formatLeonDate(value.deliveryDate)} · p.m.</small></h3>
            <div
              className="leon-time-chips"
              role="group"
              aria-label="Horas disponibles"
              data-invalid={errors?.time ? "true" : undefined}
              aria-describedby={errors?.time ? "leon-time-error" : undefined}
            >
              {slots.map((time) => (
                <button
                  key={time}
                  type="button"
                  aria-pressed={value.preferredTime === time}
                  aria-label={formatLeonTime(time)}
                  onClick={() => onChange({ preferredTime: time })}
                >
                  {formatLeonTime(time).replace(/\s*p\.\s*m\.$/i, "")}
                </button>
              ))}
            </div>
            {errors?.time && <small id="leon-time-error" className="checkout-field-error">{errors.time}</small>}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <h3 className="checkout-step-heading">¿Cómo lo recibes?</h3>
        <div className="leon-method-options" role="group" aria-label="Forma de entrega en León">
          {DELIVERY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="leon-method-option"
              aria-pressed={method === option.value}
              onClick={() => chooseMethod(option.value)}
            >
              <span><strong>{option.title}</strong><small>{option.detail}</small></span>
              {option.tag && <em>{option.tag}</em>}
            </button>
          ))}
        </div>
        {method === "pickup_point" && <label className="block"><span>Punto medio preferido</span>
          <select aria-label="Punto medio preferido" aria-invalid={Boolean(errors?.point)} aria-describedby={errors?.point ? "leon-point-error" : undefined} value={value.deliveryPoint} onChange={event => onChange({ deliveryPoint: event.target.value })} className="mt-2 block min-h-12 w-full border border-[#637aa6] bg-white px-3">
            <option value="">Selecciona un punto</option>{LEON_PICKUP_POINTS.map(point => <option key={point} value={point}>{point}</option>)}
          </select>
          {errors?.point && <small id="leon-point-error" className="checkout-field-error">{errors.point}</small>}
        </label>}
        {["home_delivery", "uber_eats"].includes(method) && <label className="block"><span>Dirección para cotizar Uber</span>
          <textarea aria-label="Dirección para cotizar Uber" aria-invalid={Boolean(errors?.address)} aria-describedby={errors?.address ? "leon-address-error" : undefined} maxLength={240} value={value.deliveryAddress} onChange={event => onChange({ deliveryAddress: event.target.value })} className="mt-2 block min-h-24 w-full border border-[#637aa6] bg-white p-3" />
          {errors?.address && <small id="leon-address-error" className="checkout-field-error">{errors.address}</small>}
          <small className="mt-2 block">El costo de Uber no está incluido en los productos.</small>
        </label>}
      </div>

      <div className="mt-3 flex min-w-0 max-w-full items-start gap-2 overflow-hidden rounded-lg border border-[#ecd8a6] bg-[#fff9e9] px-3 py-2.5">
        <span className="mt-0.5 shrink-0 text-[12px]"><SystemIcon name="chat" /></span>
        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <p className="leon-whatsapp-note whitespace-normal break-words leading-4 text-[#806c3e] [overflow-wrap:anywhere]">
            Al recibir tu pago te confirmamos todo por WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
