"use client";

import { useMemo } from "react";
import {
  LEON_TIME_OPTIONS,
  type LeonOrderPreferences,
} from "@/lib/order-preferences";

function minDateValue() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  value,
  onChange,
}: {
  value: LeonOrderPreferences;
  onChange: (next: LeonOrderPreferences) => void;
}) {
  const minDate = useMemo(() => minDateValue(), []);

  const update = (patch: Partial<LeonOrderPreferences>) => {
    onChange({
      ...value,
      deliveryMethod: "pending_whatsapp",
      deliveryPoint: "",
      deliveryAddress: "",
      personalizationNote: "",
      whatsappConfirmed: false,
      ...patch,
    });
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#cbd5e8] bg-white p-3.5 text-left shadow-[0_2px_0_rgba(66,91,188,0.06)]">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef1ff] font-interface text-[10px] font-bold text-[#425BBC]">
          1
        </span>
        <div className="min-w-0">
          <h3 className="font-interface text-[11px] font-bold text-[#27364f]">
            Fecha y horario
          </h3>
          <p className="mt-0.5 whitespace-normal break-words text-[9px] leading-4 text-[#77849a]">
            Elige tu fecha y un horario preferido para continuar.
          </p>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3">
        <label className="block min-w-0 max-w-full overflow-hidden">
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Fecha de entrega
          </span>
          <input
            type="date"
            min={minDate}
            value={value.deliveryDate}
            onChange={(event) => update({ deliveryDate: event.target.value })}
            className="mt-1.5 block h-11 min-w-0 w-full max-w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          />
          <small className="mt-1 block whitespace-normal break-words text-[8px] leading-4 text-[#8a95a8]">
            Mínimo 2 días de anticipación.
          </small>
        </label>

        <label className="block min-w-0 max-w-full overflow-hidden">
          <span className="font-interface text-[8px] font-bold uppercase tracking-[0.08em] text-[#657187]">
            Horario preferido
          </span>
          <select
            value={value.preferredTime}
            onChange={(event) => update({ preferredTime: event.target.value })}
            className="mt-1.5 block h-11 min-w-0 w-full max-w-full rounded-lg border border-[#cbd5e8] bg-[#fbfcff] px-3 text-[11px] text-[#263650] outline-none transition focus:border-[#425BBC] focus:ring-2 focus:ring-[#425BBC]/10"
          >
            <option value="">Selecciona un horario</option>
            {LEON_TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {prettyTime(time)}
              </option>
            ))}
          </select>
          <small className="mt-1 block whitespace-normal break-words text-[8px] leading-4 text-[#8a95a8]">
            Es una preferencia; todavía no queda reservado.
          </small>
        </label>
      </div>

      <div className="mt-3 flex min-w-0 max-w-full items-start gap-2 overflow-hidden rounded-lg border border-[#ecd8a6] bg-[#fff9e9] px-3 py-2.5">
        <span className="mt-0.5 shrink-0 text-[12px]">💬</span>
        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <p className="whitespace-normal break-words font-interface text-[8px] font-bold leading-4 text-[#6f5720] [overflow-wrap:anywhere]">
            Horario por confirmar
          </p>
          <p className="mt-0.5 whitespace-normal break-words text-[8px] leading-4 text-[#806c3e] [overflow-wrap:anywhere]">
            Al recibir tu comprobante o pago en línea, te confirmamos por WhatsApp el horario solicitado.
          </p>
        </div>
      </div>
    </section>
  );
}
