"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  author: "system" | "client" | "guaurritas";
  text: string;
};

const quickActions = [
  "¿Qué venden?",
  "Precios",
  "Envíos",
  "Personalizado",
  "WhatsApp",
  "Ver menú",
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    author: "system",
    text: "Guarricliente se ha unido a la conversación.",
  },
  {
    id: 2,
    author: "guaurritas",
    text: "¡Hola! Bienvenid@ a Guaurritas.\nTe puedo ayudar con productos, pedidos, envíos, personalizados o recomendaciones.\n¿En qué te puedo ayudar hoy?",
  },
];

function normalise(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getReply(text: string) {
  const value = normalise(text);

  if (
    value.includes("que venden") ||
    value.includes("productos") ||
    value.includes("menu") ||
    value.includes("catalogo")
  ) {
    return "En Guaurritas encuentras Cuisine para comer y celebrar, Couture para usar y nuestro Guaurriverse para vivir y aprender. Si me dices qué estás buscando, te llevo directo a lo que te sirve.";
  }

  if (value.includes("precio") || value.includes("cuanto")) {
    return "Los precios cambian según producto, tamaño y personalización. Dime qué producto te interesa y te ayudo a ubicar la opción correcta sin hacerte recorrer todo el catálogo.";
  }

  if (value.includes("envio") || value.includes("entrega")) {
    return "Tenemos opciones de entrega local y, para productos que lo permiten, envío nacional. La disponibilidad depende del producto y tu ubicación. Cuéntame qué quieres pedir y a dónde va.";
  }

  if (
    value.includes("personal") ||
    value.includes("cumple") ||
    value.includes("celebr") ||
    value.includes("nombre")
  ) {
    return "Sí ✦ varios productos pueden personalizarse para celebraciones. Podemos revisar tema, colores, tipo de decoración y otros detalles según el producto. ¿Qué estás celebrando?";
  }

  if (value.includes("whatsapp")) {
    return "Puedes continuar el pedido por WhatsApp desde el botón flotante de la web. Si ya sabes qué quieres, mándanos producto, fecha y para quién es para avanzar más rápido.";
  }

  if (value.includes("hola") || value.includes("buenas") || value.includes("hey")) {
    return "Holiii ✦ aquí estoy. Puedes preguntarme por Cuisine, Couture, pedidos, celebraciones o por dónde empezar en el Guaurriverse.";
  }

  return "Te leo 👀. Para ayudarte mejor dime si buscas un producto, preparar una celebración, hacer un pedido o conocer alguna parte del Guaurriverse.";
}

function MessengerButton({
  children,
  onClick,
  active = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`min-h-7 border px-2 py-1 text-[10px] leading-none text-black shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#555] active:translate-x-px active:translate-y-px ${
        active ? "border-black bg-[#d8d8d8] font-bold" : "border-[#808080] bg-[#c0c0c0]"
      }`}
    >
      {children}
    </button>
  );
}

export default function ChatGuaurritasApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const nextId = useRef(3);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const sendText = (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;

    setMessages((current) => [
      ...current,
      { id: nextId.current++, author: "client", text },
    ]);
    setDraft("");
    setTyping(true);

    replyTimer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          author: "guaurritas",
          text: getReply(text),
        },
      ]);
      setTyping(false);
      replyTimer.current = null;
    }, 850);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendText(draft);
  };

  return (
    <div
      className="mx-auto w-full max-w-[920px] overflow-hidden border-2 border-[#7d7d7d] bg-[#c0c0c0] text-black shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#404040]"
      style={{ fontFamily: "Tahoma, Arial, sans-serif" }}
    >
      <div className="flex min-h-8 items-center gap-2 bg-gradient-to-r from-[#003087] to-[#1569c7] px-2 text-white">
        <span aria-hidden="true" className="text-sm">💬</span>
        <strong className="min-w-0 flex-1 truncate text-[11px] sm:text-xs">
          Guarricliente — Conversation
        </strong>
        <div aria-hidden="true" className="flex gap-1">
          <span className="grid h-[18px] w-[20px] place-items-center border border-white/70 bg-[#c0c0c0] text-[10px] font-bold text-black">_</span>
          <span className="grid h-[18px] w-[20px] place-items-center border border-white/70 bg-[#c0c0c0] text-[9px] text-black">□</span>
          <span className="grid h-[18px] w-[20px] place-items-center border border-white/70 bg-[#c0c0c0] text-[10px] font-bold text-black">×</span>
        </div>
      </div>

      <div className="hidden border-b border-[#8a8a8a] bg-[#efefef] px-2 py-1 text-[10px] sm:flex sm:gap-4">
        <span>File</span><span>Edit</span><span>Actions</span><span>Tools</span><span>Help</span><span>Plus!</span>
      </div>

      <div className="flex items-stretch gap-1 border-b border-[#888] bg-[#d4d0c8] p-1.5">
        <MessengerButton ariaLabel="Invitar">👤<span className="hidden sm:inline"> Invite</span></MessengerButton>
        <MessengerButton ariaLabel="Archivos">📋<span className="hidden sm:inline"> Files</span></MessengerButton>
        <MessengerButton ariaLabel="Webcam">📷<span className="hidden sm:inline"> Webcam</span></MessengerButton>
        <span className="mx-0.5 w-px bg-[#888]" aria-hidden="true" />
        <MessengerButton onClick={() => sendText("Ver menú")}>🌐 <span className="hidden sm:inline">Tienda</span></MessengerButton>
        <MessengerButton onClick={() => sendText("WhatsApp")}>💬 <span className="hidden sm:inline">WhatsApp</span></MessengerButton>
      </div>

      <div className="flex items-center gap-2 border-b border-[#888] bg-[#ece9d8] px-2 py-1.5 text-[10px] sm:text-[11px]">
        <strong>To:</strong>
        <div className="min-w-0 flex-1 truncate border border-[#7f9db9] bg-white px-2 py-1">
          Guarricliente &lt;amomimascota@guaurritas.com&gt;
        </div>
      </div>

      <div className="grid min-h-[300px] grid-cols-1 bg-[#d4d0c8] sm:min-h-[360px] sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="m-1.5 min-h-0 overflow-y-auto border border-[#7f9db9] bg-white p-3 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]">
          <div className="space-y-3">
            {messages.map((message) => {
              if (message.author === "system") {
                return (
                  <p key={message.id} className="text-[10px] italic text-[#666]">
                    {message.text}
                  </p>
                );
              }

              const isClient = message.author === "client";
              return (
                <div key={message.id} className="text-[11px] sm:text-xs">
                  <div className={`mb-1 flex items-center gap-1 font-bold ${isClient ? "text-[#000080]" : "text-[#b54522]"}`}>
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] text-white ${
                        isClient ? "bg-[#000080]" : "bg-[#e05c2a]"
                      }`}
                    >
                      {isClient ? "C" : "G"}
                    </span>
                    {isClient ? "Guarricliente dice:" : "Guaurritas dice:"}
                  </div>
                  <p className="whitespace-pre-line pl-5 leading-[1.45] text-[#111]">
                    {message.text}
                  </p>
                </div>
              );
            })}

            {typing && (
              <p className="text-[10px] italic text-[#666]">
                Guaurritas está escribiendo...
              </p>
            )}
            <div ref={chatEnd} />
          </div>
        </div>

        <aside className="hidden border-l border-[#888] bg-[#e8e8e8] p-2 sm:flex sm:flex-col sm:items-center">
          <div className="w-full border border-[#808080] bg-white p-2 text-center shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#aaa]">
            <div className="mx-auto grid h-20 w-20 place-items-center border-2 border-[#425b8c] bg-[#f4eee3] text-4xl shadow-[3px_3px_0_#c9d6ec]">
              🐾
            </div>
            <p className="mt-2 text-[11px] font-bold text-[#003087]">Guaurritas</p>
            <p className="mt-1 text-[9px] text-[#555]">● En línea</p>
          </div>
          <div className="mt-2 w-full border border-[#aaa] bg-[#fffbe9] p-2 text-[9px] leading-4 text-[#555]">
            <strong className="text-[#003087]">GUAURRITAS OS</strong><br />
            Lo que comen, usan, viven y aprenden.
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-1 border-t border-[#888] bg-[#d4d0c8] p-1.5">
        {quickActions.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => sendText(action)}
            className="border border-[#808080] bg-[#ededed] px-2 py-1 text-[9px] shadow-[inset_1px_1px_#fff,inset_-1px_-1px_#777] active:translate-x-px active:translate-y-px sm:text-[10px]"
          >
            {action}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div className="flex items-center gap-1 border-t border-[#888] bg-[#d4d0c8] px-1.5 py-1 text-[10px]">
          <select aria-label="Tipografía" className="h-6 border border-[#7f9db9] bg-white px-1 text-[10px]">
            <option>Tahoma</option>
            <option>Arial</option>
          </select>
          <select aria-label="Tamaño" className="h-6 w-11 border border-[#7f9db9] bg-white px-1 text-[10px]" defaultValue="12">
            <option>10</option><option>12</option><option>14</option>
          </select>
          <MessengerButton><b>B</b></MessengerButton>
          <MessengerButton><i>I</i></MessengerButton>
          <MessengerButton><u>U</u></MessengerButton>
          <span className="mx-0.5 hidden h-5 w-px bg-[#888] sm:block" />
          {["😊", "🐾", "❤", "🐶", "🐱", "🎂"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setDraft((current) => current + emoji)}
              className="hidden h-6 w-6 place-items-center text-xs hover:scale-125 sm:grid"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="border-t border-[#aaa] bg-white p-1.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendText(draft);
              }
            }}
            rows={3}
            placeholder="Escribe tu pregunta y presiona Enter."
            className="block min-h-[62px] w-full resize-none border-0 bg-transparent p-1 text-[11px] leading-5 text-black outline-none sm:text-xs"
          />
        </div>

        <div className="flex justify-end gap-1 border-t border-[#888] bg-[#c0c0c0] p-1.5">
          <MessengerButton active ariaLabel="Enviar mensaje">Send</MessengerButton>
          <MessengerButton onClick={() => setDraft("")} ariaLabel="Cancelar texto">Cancel</MessengerButton>
        </div>
      </form>

      <div className="flex gap-1 border-t border-[#888] bg-[#c0c0c0] p-1 text-[9px]">
        <div className="flex-1 border border-[#888] px-2 py-1 shadow-[inset_1px_1px_#888,inset_-1px_-1px_#fff]">
          {typing ? "Guaurritas está escribiendo..." : "Guarricliente está en línea"}
        </div>
        <div className="hidden w-24 border border-[#888] px-2 py-1 text-center shadow-[inset_1px_1px_#888,inset_-1px_-1px_#fff] sm:block">
          Online
        </div>
      </div>
    </div>
  );
}
