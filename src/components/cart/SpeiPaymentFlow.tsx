"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CartItem } from "@/lib/cart-store";

type SpeiDetails = {
  clabe: string;
  beneficiary: string;
  institution: string;
  currency?: string;
};

type SpeiOrder = {
  orderId: string;
  clientToken: string;
  reference: string;
  status: string;
  total: number;
  currency?: string;
  expiresAt: string;
};

type ProofReceivedOrder = {
  orderId: string;
  reference: string;
  status: string;
  total: number;
  proofSubmittedAt?: string;
};

const BRIDGE_SOURCE = "guaurritas-web";
const WIX_BRIDGE_SOURCE = "guaurritas-wix";
const START_MESSAGE = "guaurritas:spei-request";
const DETAILS_MESSAGE = "guaurritas:spei-details";
const ERROR_MESSAGE = "guaurritas:spei-error";
const UPLOAD_URL_REQUEST = "guaurritas:spei-proof-upload-url-request";
const UPLOAD_URL_RESPONSE = "guaurritas:spei-proof-upload-url";
const PROOF_SUBMIT_MESSAGE = "guaurritas:spei-proof-submit";
const PROOF_RECEIVED_MESSAGE = "guaurritas:spei-proof-received";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const WHATSAPP_NUMBER = "524775505243";

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function orderItemsPayload(items: CartItem[]) {
  const unsupported = items.filter((item) => !item.wix.supported);
  if (unsupported.length) {
    throw new Error(
      unsupported.length === 1
        ? `${unsupported[0].name} todavía no está listo para transferencia.`
        : "Hay productos que todavía no están listos para transferencia.",
    );
  }

  return items.map((item) => {
    if (!item.wix.supported) throw new Error("Producto sin referencia Wix.");

    return {
      cartItemId: item.id,
      name: item.name,
      detail: item.detail,
      quantity: item.quantity,
      catalogReference: item.wix.catalogReference,
    };
  });
}

function buildBuyerNote(items: CartItem[]) {
  return [
    "Pedido SPEI preparado desde Guaurritas OS",
    ...items.map(
      (item) =>
        `${item.quantity}x ${item.name}${item.detail ? ` — ${item.detail}` : ""}`,
    ),
  ]
    .join("\n")
    .slice(0, 1000);
}

function appendFilename(uploadUrl: string, fileName: string) {
  const separator = uploadUrl.includes("?") ? "&" : "?";
  return `${uploadUrl}${separator}filename=${encodeURIComponent(fileName)}`;
}

function formatExpiry(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SpeiPaymentFlow({ items }: { items: CartItem[] }) {
  const [details, setDetails] = useState<SpeiDetails | null>(null);
  const [order, setOrder] = useState<SpeiOrder | null>(null);
  const [proofResult, setProofResult] = useState<ProofReceivedOrder | null>(null);
  const [starting, setStarting] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const cartSignature = useMemo(
    () =>
      items
        .map((item) => `${item.id}:${item.quantity}:${item.fulfillment}`)
        .sort()
        .join("|"),
    [items],
  );

  useEffect(() => {
    setDetails(null);
    setOrder(null);
    setProofResult(null);
    setShowProofForm(false);
    setSelectedFile(null);
    pendingFileRef.current = null;
    setStatus("");
  }, [cartSignature]);

  useEffect(() => {
    const handleWixMessage = async (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      let message = event.data;
      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }

      if (!message || typeof message !== "object") return;
      if (message.source !== WIX_BRIDGE_SOURCE) return;

      if (message.type === DETAILS_MESSAGE) {
        const nextDetails = message.details as SpeiDetails | undefined;
        const nextOrder = message.order as SpeiOrder | undefined;

        if (
          !nextDetails?.clabe ||
          !nextDetails?.beneficiary ||
          !nextDetails?.institution ||
          !nextOrder?.orderId ||
          !nextOrder?.clientToken ||
          !nextOrder?.reference
        ) {
          setStarting(false);
          setStatus("Wix respondió sin los datos completos del pedido. Intenta de nuevo.");
          return;
        }

        setDetails(nextDetails);
        setOrder(nextOrder);
        setStarting(false);
        setStatus("");
        return;
      }

      if (message.type === UPLOAD_URL_RESPONSE) {
        const file = pendingFileRef.current;
        const uploadUrl = String(message.upload?.uploadUrl || "");

        if (!file || !uploadUrl || !order) {
          setUploading(false);
          setStatus("No pudimos continuar la carga del comprobante. Intenta de nuevo.");
          return;
        }

        try {
          const response = await fetch(appendFilename(uploadUrl, file.name), {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });

          let responseBody: unknown = null;
          try {
            responseBody = await response.json();
          } catch {
            responseBody = null;
          }

          if (!response.ok) {
            throw new Error(`Wix rechazó la carga (${response.status}).`);
          }

          const rawBody = responseBody as Record<string, unknown> | null;
          const uploadedFile =
            rawBody && typeof rawBody.file === "object" && rawBody.file
              ? rawBody.file
              : rawBody;

          if (!uploadedFile || typeof uploadedFile !== "object") {
            throw new Error("Wix no devolvió los datos del archivo cargado.");
          }

          window.parent.postMessage(
            {
              source: BRIDGE_SOURCE,
              type: PROOF_SUBMIT_MESSAGE,
              requestId: Date.now(),
              orderId: order.orderId,
              clientToken: order.clientToken,
              customer: {
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
              },
              file: uploadedFile,
              fileName: file.name,
              mimeType: file.type,
            },
            "*",
          );
        } catch (error) {
          pendingFileRef.current = null;
          setUploading(false);
          setStatus(
            error instanceof Error
              ? error.message
              : "No pudimos cargar el comprobante. Intenta de nuevo.",
          );
        }
        return;
      }

      if (message.type === PROOF_RECEIVED_MESSAGE) {
        const nextOrder = message.order as ProofReceivedOrder | undefined;
        pendingFileRef.current = null;
        setUploading(false);

        if (!nextOrder?.reference) {
          setStatus("El comprobante se cargó, pero faltó confirmar el pedido. Escríbenos por WhatsApp.");
          return;
        }

        setProofResult(nextOrder);
        setStatus("");
        return;
      }

      if (message.type === ERROR_MESSAGE) {
        pendingFileRef.current = null;
        setStarting(false);
        setUploading(false);
        setStatus(
          typeof message.message === "string"
            ? message.message
            : "Ocurrió un problema con tu transferencia. Intenta de nuevo.",
        );
      }
    };

    window.addEventListener("message", handleWixMessage);
    return () => window.removeEventListener("message", handleWixMessage);
  }, [customerEmail, customerName, customerPhone, order]);

  const startTransfer = () => {
    if (starting) return;

    if (typeof window === "undefined" || window.self === window.top) {
      setStatus("Abre esta tienda desde guaurritas.com para usar transferencia SPEI.");
      return;
    }

    try {
      const payloadItems = orderItemsPayload(items);
      setStarting(true);
      setStatus("");

      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: START_MESSAGE,
          requestId: Date.now(),
          items: payloadItems,
          buyerNote: buildBuyerNote(items),
        },
        "*",
      );
    } catch (error) {
      setStarting(false);
      setStatus(error instanceof Error ? error.message : "No pudimos preparar tu transferencia.");
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copiada. ✨`);
    } catch {
      setStatus(`No se pudo copiar ${label.toLowerCase()} automáticamente.`);
    }
  };

  const submitProof = () => {
    if (!order || !selectedFile || uploading) return;

    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (customerName.trim().length < 2) {
      setStatus("Escribe el nombre de la persona que realizó el pedido.");
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setStatus("Escribe un número de WhatsApp válido.");
      return;
    }
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setStatus("Revisa el correo electrónico o déjalo vacío.");
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setStatus("El comprobante debe pesar máximo 10 MB.");
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        selectedFile.type,
      )
    ) {
      setStatus("Sube una imagen JPG, PNG, WEBP o un PDF.");
      return;
    }

    pendingFileRef.current = selectedFile;
    setUploading(true);
    setStatus("Subiendo comprobante…");

    window.parent.postMessage(
      {
        source: BRIDGE_SOURCE,
        type: UPLOAD_URL_REQUEST,
        requestId: Date.now(),
        orderId: order.orderId,
        clientToken: order.clientToken,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeInBytes: selectedFile.size,
      },
      "*",
    );
  };

  if (proofResult) {
    const late = proofResult.status === "LATE_PAYMENT_REVIEW";
    const whatsappMessage = encodeURIComponent(
      `Hola Guaurritas 🐾 Ya realicé mi transferencia de ${money(
        proofResult.total,
      )} MXN para el pedido ${proofResult.reference}. Mi comprobante ya fue cargado en la página.`,
    );

    return (
      <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-md border border-[#b9c9df] bg-white p-3 text-left">
        <p className="font-interface whitespace-normal break-words text-[10px] font-bold uppercase tracking-[0.1em] text-[#425b8c] [overflow-wrap:anywhere]">
          ✓ Comprobante recibido
        </p>
        <strong className="mt-2 block max-w-full break-all text-[12px] text-[#263650]">
          {proofResult.reference}
        </strong>
        <p className="mt-2 max-w-full whitespace-normal break-words text-[9px] leading-4 text-[#5d6879] [overflow-wrap:anywhere]">
          {late
            ? "Recibimos tu comprobante después del plazo de la referencia. Revisaremos disponibilidad antes de confirmar el pedido."
            : "Tu comprobante quedó guardado. Revisaremos la transferencia antes de confirmar tu pedido."}
        </p>
        <p className="mt-2 max-w-full whitespace-normal break-words text-[9px] font-bold text-[#955b69] [overflow-wrap:anywhere]">
          Estado: {late ? "Revisión por pago fuera de plazo" : "Pendiente de validación"}
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
          target="_blank"
          rel="noreferrer"
          className="spei-whatsapp-button mt-3 inline-flex min-h-8 max-w-full items-center justify-center whitespace-normal break-words px-3 text-center text-[10px] [overflow-wrap:anywhere]"
        >
          Avisar por WhatsApp
        </a>
      </div>
    );
  }

  if (!details || !order) {
    return (
      <>
        <button
          type="button"
          disabled={starting}
          onClick={startTransfer}
          className="mt-3 w-full !border-[#425b8c] !bg-[#425b8c] !text-white disabled:cursor-wait disabled:opacity-60"
        >
          {starting ? "Generando referencia…" : "Continuar con transferencia"}
        </button>
        {status && (
          <p className="mt-3 rounded-md border border-[#d7dde8] bg-white/80 px-3 py-2 text-[9px] font-semibold leading-4 text-[#53627a]">
            {status}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-[#d9c4ca] bg-white p-3 text-left">
      <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#955b69]">
        Datos para tu transferencia
      </p>

      <div className="mt-2 space-y-3 text-[10px] leading-4 text-[#344056]">
        <div>
          <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
            Total a transferir
          </small>
          <strong className="text-sm">{money(order.total)} MXN</strong>
        </div>

        <div>
          <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
            CLABE
          </small>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="select-all break-all text-[12px] tracking-[0.04em]">
              {details.clabe}
            </strong>
            <button
              type="button"
              onClick={() => copyText(details.clabe, "CLABE")}
              className="spei-copy-button !px-2 !py-1 !text-[9px]"
            >
              Copiar
            </button>
          </div>
        </div>

        <div>
          <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
            Beneficiario
          </small>
          <strong>{details.beneficiary}</strong>
        </div>

        <div>
          <small className="block text-[8px] uppercase tracking-[0.08em] text-[#788297]">
            Institución
          </small>
          <strong>{details.institution}</strong>
        </div>

        <div className="rounded-md border border-[#b9c9df] bg-[#f4f7fc] p-2">
          <small className="block text-[8px] font-bold uppercase tracking-[0.08em] text-[#425b8c]">
            Concepto / referencia del pedido
          </small>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <strong className="select-all text-[12px] tracking-[0.04em] text-[#263650]">
              {order.reference}
            </strong>
            <button
              type="button"
              onClick={() => copyText(order.reference, "Referencia")}
              className="spei-copy-button !px-2 !py-1 !text-[9px]"
            >
              Copiar
            </button>
          </div>
          <p className="mt-1 text-[8px] leading-4 text-[#68758b]">
            Escríbela en el concepto de tu transferencia para identificar tu pedido.
          </p>
        </div>

        <p className="text-[8px] leading-4 text-[#955b69]">
          Referencia válida hasta: <strong>{formatExpiry(order.expiresAt)}</strong>
        </p>
      </div>

      {!showProofForm ? (
        <button
          type="button"
          onClick={() => {
            setShowProofForm(true);
            setStatus("");
          }}
          className="mt-3 w-full !border-[#425b8c] !bg-[#425b8c] !text-white"
        >
          ✓ Ya realicé mi pago
        </button>
      ) : (
        <div className="mt-3 border-t border-[#eadde1] pt-3">
          <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#955b69]">
            Comprobante de pago
          </p>
          <p className="mt-1 text-[8px] leading-4 text-[#6f6266]">
            Sube la foto, captura o PDF de tu transferencia. El pago se confirma después de validarlo.
          </p>

          <div className="mt-3 grid gap-2">
            <label className="text-[8px] font-bold uppercase tracking-[0.06em] text-[#68758b]">
              Nombre
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                autoComplete="name"
                className="mt-1 block w-full rounded border border-[#c7cedc] bg-white px-2 py-2 text-[10px] font-normal normal-case tracking-normal text-[#263650] outline-none focus:border-[#425b8c]"
                placeholder="Nombre de quien realizó el pedido"
              />
            </label>

            <label className="text-[8px] font-bold uppercase tracking-[0.06em] text-[#68758b]">
              WhatsApp
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                className="mt-1 block w-full rounded border border-[#c7cedc] bg-white px-2 py-2 text-[10px] font-normal normal-case tracking-normal text-[#263650] outline-none focus:border-[#425b8c]"
                placeholder="477 000 0000"
              />
            </label>

            <label className="text-[8px] font-bold uppercase tracking-[0.06em] text-[#68758b]">
              Correo <span className="font-normal normal-case">(opcional)</span>
              <input
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                inputMode="email"
                autoComplete="email"
                className="mt-1 block w-full rounded border border-[#c7cedc] bg-white px-2 py-2 text-[10px] font-normal normal-case tracking-normal text-[#263650] outline-none focus:border-[#425b8c]"
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="spei-file-picker mt-1 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#aab8d2] bg-[#f4f7fc] px-3 py-3 text-center text-[9px] font-bold text-[#425b8c]">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  setStatus("");
                }}
              />
              {selectedFile ? `✓ ${selectedFile.name}` : "+ Subir comprobante"}
            </label>
          </div>

          <button
            type="button"
            disabled={!selectedFile || uploading}
            onClick={submitProof}
            className="mt-3 w-full !border-[#425b8c] !bg-[#425b8c] !text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Guardando comprobante…" : "Confirmar mi pedido"}
          </button>
        </div>
      )}

      <p className="mt-3 border-t border-[#eadde1] pt-2 text-[8px] leading-4 text-[#6f6266]">
        Tu pedido se confirma únicamente después de validar el pago completo. Si no recibimos tu comprobante dentro del plazo indicado, la solicitud vencerá automáticamente.
      </p>

      {status && (
        <p className="mt-3 rounded-md border border-[#d7dde8] bg-[#f8fafc] px-3 py-2 text-[9px] font-semibold leading-4 text-[#53627a]">
          {status}
        </p>
      )}
    </div>
  );
}
