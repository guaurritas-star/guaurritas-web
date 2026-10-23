"use client";

import { useMemo } from "react";
import {
  LEON_TIME_OPTIONS,
  LEON_PICKUP_POINTS,
  minimumLeonDeliveryDate,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";

function prettyTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const fieldClass =
  "mt-2 block min-h-12 w-full min-w-0 rounded-md border border-[#637aa6] bg-white px-3 py-2 font-interface text-[16px] leading-6 text-[#263650] outline-none focus-visible:ring-2 focus-visible:ring-[#425b8c] focus-visible:ring-offset-2 aria-invalid:border-[#a66d88] [color-scheme:light]";

export default function LeonOrderPreferencesForm({
  value,
  onChange,
  showErrors = false,
}: {
  value: LeonOrderPreferences;
  onChange: (patch: Partial<LeonOrderPreferences>) => void;
  showErrors?: boolean;
}) {
  const minDate = useMemo(() => minimumLeonDeliveryDate(), []);
  const dateError = showErrors && (
    !value.deliveryDate ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value.deliveryDate) && value.deliveryDate < minDate)
  );
  const timeError = showErrors && !value.preferredTime;
  const pickupError = showErrors && value.deliveryMethod === "pickup_point" && !LEON_PICKUP_POINTS.some(point => point === value.deliveryPoint);
  const addressError = showErrors && ["home_delivery", "uber_eats"].includes(value.deliveryMethod) && !value.deliveryAddress.trim();

  return (
    <section className="leon-delivery-card rounded-xl border border-[#cbd5e8] bg-white p-4 text-left">
      <h2 id="leon-delivery-heading" tabIndex={-1} className="font-title text-[21px] leading-7 text-[#263650]">
        ¿Cuándo lo necesitas?
      </h2>
      <p className="mt-1 text-[15px] leading-6 text-[#53627a]">
        Elige cuándo y cómo te gustaría recibir tu pedido.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block min-w-0">
          <span className="block font-interface text-[16px] text-[#263650]">Fecha de entrega</span>
          {!value.deliveryDate && <span className="mt-1 block text-[14px] text-[#53627a]">Toca el campo para elegir una fecha.</span>}
          <input
            data-leon-delivery-date
            type="date"
            lang="es-MX"
            min={minDate}
            required
            value={value.deliveryDate}
            aria-invalid={dateError || undefined}
            aria-describedby={dateError ? "leon-date-hint leon-date-error" : "leon-date-hint"}
            onInput={(event) => onChange({ deliveryDate: event.currentTarget.value })}
            onChange={(event) => onChange({ deliveryDate: event.currentTarget.value })}
            className={fieldClass}
          />
          <small id="leon-date-hint" className="mt-1 block text-[14px] leading-5 text-[#53627a]">
            Desde el siguiente día hábil.
          </small>
          {dateError && <span id="leon-date-error" role="alert" className="mt-1 block text-[14px] text-[#944b65]">
            Selecciona una fecha disponible.
          </span>}
        </label>

        <label className="block min-w-0">
          <span className="block font-interface text-[16px] text-[#263650]">Horario preferido</span>
          <select
            data-leon-preferred-time
            required
            value={value.preferredTime}
            aria-invalid={timeError || undefined}
            aria-describedby={timeError ? "leon-time-error" : undefined}
            onChange={(event) => onChange({ preferredTime: event.currentTarget.value })}
            className={fieldClass}
          >
            <option value="">Selecciona un horario</option>
            {LEON_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>{prettyTime(time)}</option>
            ))}
          </select>
          {timeError && <span id="leon-time-error" role="alert" className="mt-1 block text-[14px] text-[#944b65]">
            Elige un horario preferido.
          </span>}
        </label>

        <label className="block min-w-0">
          <span className="block font-interface text-[16px] text-[#263650]">¿Cómo quieres recibirlo?</span>
          <select
            aria-label="Forma de entrega en León"
            value={value.deliveryMethod || "pending_whatsapp"}
            onChange={(event) => onChange({
              deliveryMethod: event.target.value as LeonOrderPreferences["deliveryMethod"],
              deliveryPoint: "",
              deliveryAddress: "",
            })}
            className={fieldClass}
          >
            <option value="pending_whatsapp">Lo coordinaré por WhatsApp</option>
            <option value="pickup_point">Punto medio</option>
            <option value="home_delivery">A domicilio por Uber · costo adicional</option>
          </select>
        </label>

        {value.deliveryMethod === "pickup_point" && (
          <label className="block min-w-0">
            <span className="block font-interface text-[16px] text-[#263650]">Punto medio preferido</span>
            <select
              aria-label="Punto medio preferido"
              value={value.deliveryPoint}
              aria-invalid={pickupError || undefined}
              aria-describedby={pickupError ? "leon-point-error" : undefined}
              onChange={(event) => onChange({ deliveryPoint: event.target.value })}
              className={fieldClass}
            >
              <option value="">Selecciona un punto</option>
              {LEON_PICKUP_POINTS.map((point) => <option key={point} value={point}>{point}</option>)}
            </select>
            {pickupError && <span id="leon-point-error" role="alert" className="mt-1 block text-[14px] text-[#944b65]">Elige un punto medio.</span>}
          </label>
        )}

        {["home_delivery", "uber_eats"].includes(value.deliveryMethod) && (
          <label className="block min-w-0">
            <span className="block font-interface text-[16px] text-[#263650]">Dirección para cotizar Uber</span>
            <textarea
              aria-label="Dirección para cotizar Uber"
              maxLength={240}
              value={value.deliveryAddress}
              aria-invalid={addressError || undefined}
              aria-describedby={addressError ? "leon-address-hint leon-address-error" : "leon-address-hint"}
              onChange={(event) => onChange({ deliveryAddress: event.target.value })}
              className={fieldClass + " min-h-24"}
            />
            <small id="leon-address-hint" className="mt-1 block text-[14px] leading-5 text-[#53627a]">
              Uber se cotiza aparte; confirmaremos el costo por WhatsApp.
            </small>
            {addressError && <span id="leon-address-error" role="alert" className="mt-1 block text-[14px] text-[#944b65]">Escribe una dirección para cotizar Uber.</span>}
          </label>
        )}
      </div>

      <p className="mt-5 border-t border-[#e2e8f2] pt-4 text-[15px] leading-6 text-[#53627a]">
        La fecha, el horario y el punto de entrega se confirman por WhatsApp después del pago.
      </p>
    </section>
  );
}
