"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WEB_SOURCE = "guaurritas-web";
const EMBED_SOURCE = "guaurritas-embed";
const WIX_SOURCE = "guaurritas-wix";
const MEMBER_STATE_MESSAGE = "guaurritas:member-state";
const MEMBER_STATE_REQUEST_MESSAGE = "guaurritas:member-state-request";
const MEMBER_LOGIN_REQUEST_MESSAGE = "guaurritas:member-login-request";
const PURCHASE_HISTORY_REQUEST_MESSAGE = "guaurritas:purchase-history-request";
const PURCHASE_HISTORY_MESSAGE = "guaurritas:purchase-history";

type ShopWorld = "cuisine" | "couture";

type WixMemberState = {
  loggedIn: boolean;
  name: string;
};

type PurchaseLineItem = {
  id: string;
  name: string;
  quantity: number;
  world: ShopWorld;
};

type PurchaseOrder = {
  id: string;
  number: string;
  createdDate: string;
  total: number | null;
  currency: string;
  lineItems: PurchaseLineItem[];
};

type HistoryState =
  | { kind: "idle" | "loading" }
  | { kind: "ready"; orders: PurchaseOrder[] }
  | { kind: "error"; message: string };

type MiMascotaAppProps = {
  onOpenWorld?: (world: ShopWorld) => void;
};

const COUTURE_WORDS = [
  "bandana",
  "moño",
  "corbata",
  "collar",
  "accesorio",
  "couture",
  "ropa",
];

const getText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getWorld = (value: unknown): ShopWorld => {
  if (value === "couture") return "couture";
  if (value === "cuisine") return "cuisine";

  const normalized = getText(value).toLowerCase();
  return COUTURE_WORDS.some((word) => normalized.includes(word))
    ? "couture"
    : "cuisine";
};

const normalizeOrders = (value: unknown): PurchaseOrder[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate, orderIndex) => {
    if (!candidate || typeof candidate !== "object") return [];
    const order = candidate as Record<string, unknown>;
    const rawItems = Array.isArray(order.lineItems) ? order.lineItems : [];
    const lineItems = rawItems.flatMap((candidateItem, itemIndex) => {
      if (!candidateItem || typeof candidateItem !== "object") return [];
      const item = candidateItem as Record<string, unknown>;
      const name = getText(item.name ?? item.productName);
      if (!name) return [];

      return [{
        id: getText(item.id) || `item-${orderIndex}-${itemIndex}`,
        name,
        quantity: Math.max(1, Math.round(getNumber(item.quantity) ?? 1)),
        world: getWorld(item.world ?? name),
      }];
    });

    if (lineItems.length === 0) return [];

    return [{
      id: getText(order.id) || `order-${orderIndex}`,
      number: getText(order.number) || String(orderIndex + 1),
      createdDate: getText(order.createdDate ?? order.createdAt),
      total: getNumber(order.total),
      currency: getText(order.currency) || "MXN",
      lineItems,
    }];
  });
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatMoney = (amount: number | null, currency: string) => {
  if (amount === null) return "Total no disponible";

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
  }).format(amount);
};

export default function MiMascotaApp({ onOpenWorld }: MiMascotaAppProps) {
  const [member, setMember] = useState<WixMemberState | null>(null);
  const [history, setHistory] = useState<HistoryState>({ kind: "idle" });
  const requestIdRef = useRef(0);

  const requestHistory = useCallback(() => {
    if (window.self === window.top) {
      setHistory({
        kind: "error",
        message: "Abre Mi Mascota desde guaurritas.com para consultar tus compras.",
      });
      return;
    }

    requestIdRef.current += 1;
    setHistory({ kind: "loading" });
    window.parent.postMessage(
      {
        source: WEB_SOURCE,
        type: PURCHASE_HISTORY_REQUEST_MESSAGE,
        requestId: requestIdRef.current,
      },
      "*",
    );
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const message = event.data;

      if (!message || typeof message !== "object") return;

      const hasTrustedSource =
        message.source === EMBED_SOURCE ||
        (message.type === PURCHASE_HISTORY_MESSAGE &&
          message.source === WIX_SOURCE);

      if (!hasTrustedSource) return;

      if (message.type === MEMBER_STATE_MESSAGE) {
        const loggedIn = Boolean(message.loggedIn);
        setMember({
          loggedIn,
          name: getText(message.name),
        });
        if (loggedIn) {
          requestHistory();
        } else {
          setHistory({ kind: "idle" });
        }
        return;
      }

      if (message.type !== PURCHASE_HISTORY_MESSAGE) return;

      if (message.ok === false) {
        setHistory({
          kind: "error",
          message:
            getText(message.message) ||
            "No pudimos consultar tus compras en este momento.",
        });
        return;
      }

      setHistory({ kind: "ready", orders: normalizeOrders(message.orders) });
    };

    window.addEventListener("message", handleMessage);

    if (window.self !== window.top) {
      window.parent.postMessage(
        { source: WEB_SOURCE, type: MEMBER_STATE_REQUEST_MESSAGE },
        "*",
      );
    } else {
      window.setTimeout(() => setMember({ loggedIn: false, name: "" }), 0);
    }

    return () => window.removeEventListener("message", handleMessage);
  }, [requestHistory]);

  useEffect(() => {
    if (history.kind !== "loading") return;

    const timeout = window.setTimeout(() => {
      setHistory((current) =>
        current.kind === "loading"
          ? {
              kind: "error",
              message:
                "La conexión segura con tus pedidos tardó demasiado. Inténtalo nuevamente.",
            }
          : current,
      );
    }, 15000);

    return () => window.clearTimeout(timeout);
  }, [history.kind]);

  const insights = useMemo(() => {
    if (history.kind !== "ready") return null;

    const products = new Map<
      string,
      { name: string; quantity: number; world: ShopWorld }
    >();

    history.orders.forEach((order) => {
      order.lineItems.forEach((item) => {
        const key = item.name.toLocaleLowerCase("es-MX");
        const current = products.get(key);
        products.set(key, {
          name: current?.name ?? item.name,
          quantity: (current?.quantity ?? 0) + item.quantity,
          world: current?.world ?? item.world,
        });
      });
    });

    const favorite = [...products.values()].sort(
      (left, right) => right.quantity - left.quantity,
    )[0] ?? null;
    const purchasedUnits = [...products.values()].reduce(
      (total, product) => total + product.quantity,
      0,
    );

    return {
      favorite,
      purchasedUnits,
      uniqueProducts: products.size,
      complementWorld: (favorite?.world === "couture"
        ? "cuisine"
        : "couture") as ShopWorld,
    };
  }, [history]);

  const requestLogin = () => {
    if (window.self === window.top) return;
    window.parent.postMessage(
      { source: WEB_SOURCE, type: MEMBER_LOGIN_REQUEST_MESSAGE },
      "*",
    );
  };

  if (member === null) {
    return (
      <section className="-m-4 grid min-h-[30rem] place-items-center bg-[#edf3fb] p-6 sm:-m-6">
        <div className="text-center text-[#263650]">
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-[#cad6ea] border-t-[#425b8c]" />
          <p className="mt-4 font-title text-lg">Abriendo Mi Mascota…</p>
        </div>
      </section>
    );
  }

  if (!member.loggedIn) {
    return (
      <section className="-m-4 min-h-[30rem] bg-[linear-gradient(145deg,#edf3fb_0%,#f9edf3_55%,#f7e3d5_100%)] p-5 sm:-m-6 sm:p-8">
        <div className="mx-auto max-w-3xl border-2 border-[#425b8c] bg-[#fffaf7] shadow-[8px_8px_0_#a9b8d9]">
          <div className="flex items-center justify-between border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#425b8c]">
            <span>Mi Mascota.exe</span>
            <span>Privado</span>
          </div>
          <div className="p-6 sm:p-10">
            <span className="text-5xl" aria-hidden="true">♡</span>
            <h2 className="mt-4 font-title text-3xl text-[#263650] sm:text-4xl">
              Tus compras también cuentan su historia
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#53627a] sm:text-base">
              Inicia sesión con tu cuenta Guaurritas para ver tus pedidos reales,
              encontrar lo que más le ha gustado a tu mascota y recibir sugerencias
              basadas únicamente en tus compras.
            </p>
            <button
              type="button"
              onClick={requestLogin}
              className="mt-7 border-2 border-[#263650] bg-[#425b8c] px-6 py-3 font-title text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#D9A689] transition active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Iniciar sesión
            </button>
            <p className="mt-4 font-mono text-[10px] leading-5 text-[#71809a]">
              No usamos el carrito ni productos vistos como si fueran compras.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-m-4 min-h-[30rem] bg-[#edf3fb] text-[#263650] sm:-m-6">
      <header className="border-b-2 border-[#425b8c] bg-[linear-gradient(110deg,#425b8c,#6d7fb0_52%,#A66D88)] px-5 py-6 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#fff2e9]">
              Mi Mascota.exe · Centro privado
            </p>
            <span className="border border-white/50 bg-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-wider">
              Sesión protegida
            </span>
          </div>
          <h2 className="mt-3 font-title text-3xl sm:text-4xl">
            Hola{member.name ? `, ${member.name}` : ""}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#eef3ff]">
            Aquí convertimos el historial real de compras en recomendaciones útiles,
            sin mezclarlo con Guaurrinotas ni inventar actividad.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-4 sm:p-7">
        {history.kind === "loading" && (
          <div className="grid min-h-64 place-items-center border-2 border-[#8799bf] bg-white p-6 text-center shadow-[5px_5px_0_#c7d2e7]">
            <div>
              <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-[#dce4f2] border-t-[#A66D88]" />
              <p className="mt-4 font-title text-lg">Consultando tus compras…</p>
              <p className="mt-2 text-sm text-[#71809a]">Solo mostraremos pedidos de tu cuenta.</p>
            </div>
          </div>
        )}

        {history.kind === "error" && (
          <div className="border-2 border-[#A66D88] bg-[#fff7f8] p-6 shadow-[5px_5px_0_#e5bdca]">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#A66D88]">Conexión pendiente</p>
            <h3 className="mt-2 font-title text-2xl">No pudimos abrir tu historial</h3>
            <p className="mt-3 text-sm leading-6 text-[#53627a]">{history.message}</p>
            <button type="button" onClick={requestHistory} className="mt-5 border-2 border-[#263650] bg-[#D9A689] px-5 py-2 font-title text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_#425b8c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
              Volver a intentar
            </button>
          </div>
        )}

        {history.kind === "ready" && history.orders.length === 0 && (
          <div className="border-2 border-[#8799bf] bg-white p-7 text-center shadow-[5px_5px_0_#c7d2e7] sm:p-10">
            <span className="text-5xl" aria-hidden="true">✦</span>
            <h3 className="mt-3 font-title text-2xl">Tu historia está por comenzar</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#53627a]">
              Todavía no encontramos compras pagadas en esta cuenta. Cuando hagas tu
              primer pedido, aquí aparecerán tus productos y recomendaciones.
            </p>
            <button type="button" onClick={() => onOpenWorld?.("cuisine")} className="mt-6 border-2 border-[#263650] bg-[#425b8c] px-5 py-2 font-title text-xs font-bold uppercase tracking-wider text-white shadow-[3px_3px_0_#D9A689] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
              Explorar Cuisine
            </button>
          </div>
        )}

        {history.kind === "ready" && history.orders.length > 0 && insights && (
          <div className="grid gap-5">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <article className="border-2 border-[#425b8c] bg-white p-4 shadow-[4px_4px_0_#b8c5df]">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#71809a]">Pedidos</p>
                <p className="mt-1 font-title text-3xl">{history.orders.length}</p>
              </article>
              <article className="border-2 border-[#A66D88] bg-[#fff8fb] p-4 shadow-[4px_4px_0_#dfb5c5]">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8f5872]">Productos distintos</p>
                <p className="mt-1 font-title text-3xl">{insights.uniqueProducts}</p>
              </article>
              <article className="col-span-2 border-2 border-[#b67f62] bg-[#fff8f1] p-4 shadow-[4px_4px_0_#e4bfa9] sm:col-span-1">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#916048]">Unidades disfrutadas</p>
                <p className="mt-1 font-title text-3xl">{insights.purchasedUnits}</p>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {insights.favorite && (
                <article className="border-2 border-[#A66D88] bg-[#fff8fb] p-5 shadow-[5px_5px_0_#dfb5c5]">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#A66D88]">Lo que más han pedido</p>
                  <h3 className="mt-2 font-title text-2xl">{insights.favorite.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#53627a]">
                    Aparece {insights.favorite.quantity} {insights.favorite.quantity === 1 ? "vez" : "veces"} en tus compras. Si quieren repetir, te llevamos al mundo correcto.
                  </p>
                  <button type="button" onClick={() => onOpenWorld?.(insights.favorite?.world ?? "cuisine")} className="mt-5 border-2 border-[#263650] bg-[#425b8c] px-4 py-2 font-title text-xs font-bold uppercase tracking-wider text-white shadow-[3px_3px_0_#D9A689] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                    Volver a encontrarlo
                  </button>
                </article>
              )}

              <article className="border-2 border-[#425b8c] bg-white p-5 shadow-[5px_5px_0_#b8c5df]">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#425b8c]">Una idea para complementar</p>
                <h3 className="mt-2 font-title text-2xl">
                  {insights.complementWorld === "couture" ? "También puede estrenar" : "También puede probar algo rico"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#53627a]">
                  {insights.complementWorld === "couture"
                    ? "Como sus compras se concentran en Cuisine, te recomendamos conocer accesorios de Couture."
                    : "Como ya conocen Couture, pueden complementar su experiencia con snacks de Cuisine."}
                </p>
                <button type="button" onClick={() => onOpenWorld?.(insights.complementWorld)} className="mt-5 border-2 border-[#263650] bg-[#D9A689] px-4 py-2 font-title text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_#425b8c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  Explorar {insights.complementWorld === "couture" ? "Couture" : "Cuisine"}
                </button>
              </article>
            </section>

            <section className="border-2 border-[#425b8c] bg-[#f9fbff] shadow-[5px_5px_0_#b8c5df]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#425b8c]">Historial real</p>
                  <h3 className="mt-1 font-title text-xl">Tus compras recientes</h3>
                </div>
                <button type="button" onClick={requestHistory} className="border border-[#425b8c] bg-white px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider hover:bg-[#f4edf2]">
                  Actualizar
                </button>
              </div>
              <div className="divide-y divide-[#cbd5e5]">
                {history.orders.slice(0, 6).map((order) => (
                  <article key={order.id} className="grid gap-3 p-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-title text-sm">Pedido #{order.number}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#71809a]">{formatDate(order.createdDate)}</p>
                    </div>
                    <p className="text-sm leading-5 text-[#53627a]">
                      {order.lineItems.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
                    </p>
                    <div className="sm:text-right">
                      <p className="font-title text-sm">{formatMoney(order.total, order.currency)}</p>
                      <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-wider text-[#588060]">Compra confirmada</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
