"use client";

import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  id: number;
  author: "guaurritas" | "user";
  text: string;
};

const quickMessages = [
  "Quiero hacer un pedido",
  "Tengo duda de un producto",
  "Quiero preparar una celebración",
];

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    author: "guaurritas",
    text: "¡Guau! 🐾 Bienvenid@ al Chat Guaurritas. Cuéntame qué necesitas y te ayudo a ubicar el siguiente paso.",
  },
];

function buildLocalReply(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("pedido")) {
    return "Para un pedido podemos ayudarte con producto, personalización y entrega. Esta ventana ya quedó migrada; la conexión al sistema real de pedidos se enchufa como siguiente integración.";
  }

  if (
    normalized.includes("pastel") ||
    normalized.includes("celebr") ||
    normalized.includes("cumple")
  ) {
    return "Para una celebración podemos reunir Petcake, cupcakes, accesorios y personalización. Cuando conectemos el chat al flujo de compra, esta conversación podrá llevarte directo a las opciones correctas.";
  }

  if (normalized.includes("producto") || normalized.includes("galleta")) {
    return "Puedo orientarte entre Cuisine, Couture y las demás experiencias del Guaurriverse. Por ahora esta versión conserva la interacción dentro del escritorio sin depender del iframe viejo.";
  }

  return "Mensaje recibido 🐾. Esta primera versión del chat funciona localmente dentro de Guaurritas OS; el siguiente paso será conectarlo al canal o backend definitivo sin cambiar esta interfaz.";
}

export default function ChatGuaurritasApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const nextId = useMemo(
    () => Math.max(...messages.map((message) => message.id)) + 1,
    [messages],
  );

  const sendMessage = (text: string) => {
    const cleanText = text.trim();

    if (!cleanText) return;

    const userMessage: ChatMessage = {
      id: nextId,
      author: "user",
      text: cleanText,
    };

    const reply: ChatMessage = {
      id: nextId + 1,
      author: "guaurritas",
      text: buildLocalReply(cleanText),
    };

    setMessages((current) => [...current, userMessage, reply]);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <section className="mx-auto flex min-h-[430px] w-full max-w-2xl flex-col overflow-hidden border-2 border-[#425b8c] bg-[#f2f2f2] shadow-[5px_5px_0_#d9a689]">
      <header className="flex items-center justify-between gap-3 border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-white text-xl shadow-[2px_2px_0_#425b8c]">
            🐾
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-mono text-sm font-black uppercase tracking-[0.08em]">
              Chat Guaurritas
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#53627a]">
              <span className="h-2 w-2 rounded-full bg-[#a9c9be] ring-1 ring-[#425b8c]" />
              Guaurritas OS · modo local
            </p>
          </div>
        </div>

        <span className="shrink-0 border border-[#425b8c] bg-white px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]">
          frame-chat → app
        </span>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(rgba(66,91,140,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(66,91,140,0.035)_1px,transparent_1px)] bg-[size:18px_18px] p-4 sm:p-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.author === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[88%] border-2 border-[#425b8c] px-3 py-2 text-sm leading-6 shadow-[2px_2px_0_rgba(66,91,140,0.2)] sm:max-w-[78%] ${
                message.author === "user"
                  ? "bg-[#d9a689] text-[#263650]"
                  : "bg-white text-[#53627a]"
              }`}
            >
              <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#425b8c]">
                {message.author === "user" ? "Tú" : "Guaurritas"}
              </p>
              <p>{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-[#425b8c] bg-white p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickMessages.map((message) => (
            <button
              key={message}
              type="button"
              onClick={() => sendMessage(message)}
              className="border border-[#425b8c] bg-[#f2f2f2] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#425b8c] hover:bg-[#dce4f2]"
            >
              {message}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="guaurritas-chat-input" className="sr-only">
            Escribe un mensaje
          </label>
          <input
            id="guaurritas-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe tu mensaje..."
            className="min-w-0 flex-1 border-2 border-[#425b8c] bg-white px-3 py-2 text-sm outline-none placeholder:text-[#8792a4] focus:shadow-[inset_0_0_0_1px_#425b8c]"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#263650] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar
          </button>
        </form>

        <p className="mt-2 font-mono text-[9px] leading-4 text-[#7c8798]">
          Esta migración conserva la experiencia visual e interacción local. No envía mensajes fuera del sitio todavía.
        </p>
      </div>
    </section>
  );
}
