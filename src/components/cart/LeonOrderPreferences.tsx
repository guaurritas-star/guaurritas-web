"use client";

import { useMemo } from "react";
import type { CartItem } from "@/lib/cart-store";
import {
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
  if (!value) return "Selecciona un horario";
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
      personalizationNote: "",
      ...patch,
      ...(resetWhatsappConfirmation ? { whatsappConfirmed: false } : {}),
    });
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
        "¿Tienen disponibilidad en esa fecha y horario?",
        "La forma de entrega la coordinamos después del pago.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }, [complete, items, value.deliveryDate, value.preferredTime]);

  return (
    <section className="rounded-xl border border-[#cbd5e8] bg-white p-3.5 text-left shadow-[0_2px_0_rgba(66,91,188,0.06)]">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef1ff] font-interface text-[10px] font-bold text-[#425BBC]">
          1
        </span>
        <div className="min-w-0">
          <h3 className="font-interface text-[11px] font-bold text-[#27364f]">
            Fecha y horario
          </h3>
          <p className="mt-0.5 text-[9px] leading-4 text-[#77849a]">
            Elige una preferencia y confírmala con Guaurritas por WhatsApp.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Fecha de entrega
          </span>
          <input
            type="date"
            min={minDate}
            value={value.deliveryDate}
            onChange={(event) => update({ deliveryDate: event.target.value }, true)}
            className="mt-1.5 h-11 w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          />
          <small className="mt-1 block text-[8px] leading-4 text-[#8a95a8]">
            Mínimo 2 días de anticipación.
          </small>
        </label>

        <label className="block">
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Horario preferido
          </span>
          <select
            value={value.preferredTime}
            onChange={(event) => update({ preferredTime: event.target.value }, true)}
            className="mt-1.5 h-11 w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          >
            <option value="">Selecciona un horario</option>
            {LEON_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {prettyTime(time)}
              </option>
            ))}
          </select>
          <small className="mt-1 block text-[8px] leading-4 text-[#8a95a8]">
            Es una preferencia; no queda reservado automáticamente.
          </small>
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-[#dce3ef] bg-[#f8faff] p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[13px]">💬</span>
          <div className="min-w-0 flex-1">
            <p className="font-interface text-[9px] font-bold text-[#34486f]">
              Confirma disponibilidad antes de pagar
            </p>
            <p className="mt-1 text-[8px] leading-4 text-[#718096]">
              Te respondemos por WhatsApp si podemos atenderte en esa fecha y horario.
            </p>
          </div>
        </div>

        <a
          href={complete ? `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!complete}
          className={`mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border px-3 text-center font-interface text-[9px] font-bold transition ${
            complete
              ? "border-[#a9d5bf] bg-[#edf9f3] text-[#236149] hover:bg-[#e3f5ec]"
              : "pointer-events-none border-[#e0e4eb] bg-[#f2f4f7] text-[#a0a8b4]"
          }`}
        >
          Consultar disponibilidad por WhatsApp
        </a>

        <label
          className={`mt-2.5 flex items-start gap-2 rounded-lg border px-3 py-2.5 ${
            complete
              ? "border-[#dce3ef] bg-white"
              : "border-[#e7eaf0] bg-[#f7f8fa] opacity-60"
          }`}
        >
          <input
            type="checkbox"
            disabled={!complete}
            checked={value.whatsappConfirmed}
            onChange={(event) => update({ whatsappConfirmed: event.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#425BBC]"
          />
          <span className="text-[8px] font-semibold leading-4 text-[#56647a]">
            Ya confirmé esta fecha y horario con Guaurritas.
          </span>
        </label>
      </div>
    </section>
  );
}
