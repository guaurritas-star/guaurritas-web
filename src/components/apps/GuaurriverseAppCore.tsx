"use client";

import SystemIcon from "@/components/ui/SystemIcon";
import { useEffect, useState, type CSSProperties } from "react";
import { useBrowserSearch, useBrowserReady, notifyLocationChange } from "@/lib/browser-location";
import StoreApp from "@/components/apps/StoreApp";
import { withBasePath } from "@/lib/base-path";
import {
  getFulfillmentMode,
  setFulfillmentMode,
  type FulfillmentMode,
} from "@/lib/fulfillment-store";

type WorldId =
  | "club"
  | "cuisine"
  | "guaupalooza"
  | "couture"
  | "academy";

type WorldMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; alt: string };

type World = {
  id: WorldId;
  name: string;
  description: string;
  eyebrow: string;
  accent: string;
  accentSoft: string;
  symbol: string;
  available: boolean;
  media?: WorldMedia;
};

type WorldCardStyle = CSSProperties & {
  "--world-accent": string;
  "--world-accent-soft": string;
};

const worlds: World[] = [
  {
    id: "club",
    name: "Guaurriclub",
    description: "Shop & Favs · Exclusivo",
    eyebrow: "Beneficios y comunidad",
    accent: "#c9a97a",
    accentSoft: "#f0d898",
    symbol: "✦",
    available: false,
    media: {
      type: "image",
      src: "/guaurriverse/worlds/club.gif",
      alt: "Carrito de compras de Guaurriclub con mascotas",
    },
  },
  {
    id: "cuisine",
    name: "Guaurritas Cuisine",
    description: "Food · Recetas · Sabor",
    eyebrow: "Comida y snacks",
    accent: "#5ea0b0",
    accentSoft: "#a8dde8",
    symbol: "♨",
    available: true,
    media: {
      type: "image",
      src: "/guaurriverse/worlds/cuisine.gif",
      alt: "Experiencia de Guaurritas Cuisine con una mascota",
    },
  },
  {
    id: "guaupalooza",
    name: "Guaupalooza Eventos",
    description: "Eventos · Petparty · Fun",
    eyebrow: "Momentos para celebrar",
    accent: "#e07a85",
    accentSoft: "#f5b8be",
    symbol: "★",
    available: false,
    media: {
      type: "image",
      src: "/guaurriverse/worlds/guaupalooza.jpg",
      alt: "Celebración pet party de Guaupalooza",
    },
  },
  {
    id: "couture",
    name: "Guaurritas Couture",
    description: "Moda · Accesorios · Style",
    eyebrow: "Lo que usan",
    accent: "#8c9f87",
    accentSoft: "#c8d8c0",
    symbol: "◇",
    available: true,
    media: {
      type: "image",
      src: "/guaurriverse/worlds/couture.jpg",
      alt: "Bandana presentada por Guaurritas Couture",
    },
  },
  {
    id: "academy",
    name: "GuaurriAcademy",
    description: "Aprende · Nutrición · Tips",
    eyebrow: "Lo que aprenden",
    accent: "#c3a07a",
    accentSoft: "#e8d5b0",
    symbol: "✎",
    available: false,
    media: {
      type: "image",
      src: "/guaurriverse/worlds/academy.jpg",
      alt: "Consejo de alimentación de GuaurriAcademy",
    },
  },
];

const availableWorlds = worlds.filter((world) => world.available);
const upcomingWorlds = worlds.filter((world) => !world.available);

function isWorldId(value: string | null): value is WorldId {
  return worlds.some((world) => world.id === value);
}

function updateWorldInUrl(worldId: WorldId | null) {
  const url = new URL(window.location.href);

  if (worldId) {
    url.searchParams.set("world", worldId);
  } else {
    url.searchParams.delete("world");
  }

  window.history.pushState({ world: worldId }, "", url);
  notifyLocationChange();
}

function WorldMediaPreview({ world }: { world: World }) {
  if (world.media?.type === "video") {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={withBasePath(world.media.src)}
        poster={world.media.poster ? withBasePath(world.media.poster) : undefined}
        aria-label={world.media.alt}
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  if (world.media?.type === "image") {
    return (
      <div
        className={`absolute inset-0 bg-cover bg-top transition-transform duration-500 ${
          world.available ? "group-hover:scale-105" : ""
        }`}
        style={{ backgroundImage: `url(${withBasePath(world.media.src)})` }}
        role="img"
        aria-label={world.media.alt}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${world.accentSoft}, ${world.accent} 58%, #263650)`,
      }}
      aria-hidden="true"
    >
      <span className="absolute -right-6 -top-10 font-serif text-[10rem] leading-none text-white/20">
        {world.symbol}
      </span>
      <span className="absolute left-5 top-8 max-w-[8rem] font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.2em] text-[#263650]/75">
        {world.eyebrow}
      </span>
      <div className="absolute inset-x-5 top-1/2 border-t border-white/40" />
      <div className="absolute bottom-28 left-5 h-14 w-14 rotate-6 border-2 border-white/55 bg-white/10 shadow-[5px_5px_0_rgba(38,54,80,0.3)]" />
    </div>
  );
}

export default function GuaurriverseApp() {
  const search = useBrowserSearch();
  const browserReady = useBrowserReady();
  const requestedWorld = new URLSearchParams(search).get("world");
  const selectedWorldId = isWorldId(requestedWorld) && worlds.find((world) => world.id === requestedWorld)?.available
    ? requestedWorld : null;
  const [modeOverride, setActiveFulfillmentMode] = useState<FulfillmentMode | null>(null);
  const requestedFulfillment = new URLSearchParams(search).get("fulfillment");
  const fulfillmentMode = modeOverride ?? (requestedFulfillment === "national"
    ? "national" : browserReady ? getFulfillmentMode() : "leon");
  useEffect(() => {
    if (browserReady) setFulfillmentMode(fulfillmentMode);
  }, [browserReady, fulfillmentMode]);

  const selectedWorld = worlds.find((world) => world.id === selectedWorldId);

  const openWorld = (world: World) => {
    if (!world.available) return;
    updateWorldInUrl(world.id);
  };

  const showAllWorlds = () => {
    updateWorldInUrl(null);
  };

  const chooseFulfillmentMode = (mode: FulfillmentMode) => {
    setFulfillmentMode(mode);
    setActiveFulfillmentMode(mode);
  };

  if (selectedWorld?.id === "cuisine" || selectedWorld?.id === "couture") {
    // The same purchasing UI as Tienda.exe, with this world already selected.
    // Avoid a parallel shop implementation that drifts from the main Store.
    return (
      <StoreApp
        key={selectedWorld.id}
        lockedCategory={selectedWorld.id}
        initialFulfillmentMode={fulfillmentMode}
        onFulfillmentChange={chooseFulfillmentMode}
        onBack={showAllWorlds}
      />
    );
  }

  if (selectedWorld) {
    return (
      <section className="guaurriverse-shell -m-4 flex min-h-[29rem] flex-col items-center justify-center px-8 py-10 text-center sm:-m-6">
        <span
          className="flex h-16 w-16 items-center justify-center border-2 border-[#425b8c] text-3xl shadow-[4px_4px_0_#425b8c]"
          style={{ backgroundColor: selectedWorld.accentSoft }}
          aria-hidden="true"
        >
          {selectedWorld.symbol}
        </span>

        <p className="mt-7 font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-[#60718e]">
          Mundo seleccionado
        </p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#263650] sm:text-5xl">
          {selectedWorld.name}
        </h2>
        <p className="mt-3 text-sm text-[#60718e]">
          {selectedWorld.description}
        </p>
        <p className="mt-8 max-w-lg border-y border-[#c8d2e4] py-4 text-sm leading-6 text-[#53627a]">
          La card ya está conectada. En la siguiente fase construiremos aquí la
          experiencia específica de este mundo.
        </p>

        <button
          type="button"
          onClick={showAllWorlds}
          className="mt-8 border-2 border-[#425b8c] bg-white px-5 py-3 font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#425b8c] transition hover:-translate-y-0.5 hover:bg-[#dce4f2]"
        >
          ← Volver a los mundos
        </button>
      </section>
    );
  }

  return (
    <section className="guaurriverse-shell -m-4 min-h-full p-4 sm:-m-6 sm:p-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-[#ad9279]">
            ✦ Elige tu mundo ✦
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-[#263650] sm:text-4xl">
            Explora el Guaurriverse
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#53627a]">
            Descubre todo lo que Guaurritas suma a la vida diaria de tu mascota:
            lo que come, usa, vive y aprende.
          </p>
        </header>

        <div className="mx-auto mt-5 flex w-full max-w-3xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <p className="font-interface text-[12px] font-bold uppercase tracking-[0.1em] text-[#42516a]">
            ¿Dónde recibes tu pedido?
          </p>
          <div
            className="grid w-[min(100%,23rem)] grid-cols-2 rounded-full border border-[#8494ad] bg-transparent p-1 sm:w-auto sm:min-w-72"
            aria-label="Ubicación de compra"
          >
            {(["leon", "national"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => chooseFulfillmentMode(mode)}
                aria-pressed={fulfillmentMode === mode}
                className={`min-h-11 rounded-full px-4 py-2 font-interface text-[13px] font-bold tracking-[0.02em] transition ${
                  fulfillmentMode === mode
                    ? "bg-[#263650] text-white shadow-sm"
                    : "text-[#42516a] hover:bg-white/60"
                }`}
              >
                {mode === "leon" ? <><SystemIcon name="pin" /> León, Gto.</> : <><SystemIcon name="box" /> Todo México</>}
              </button>
            ))}
          </div>
          <p className="font-brand text-[13px] text-[#42516a] sm:whitespace-nowrap">
            Puedes cambiarlo cuando quieras dentro de la tienda
          </p>
        </div>

        {/* Primero lo que se puede usar (Hick): los mundos con compra, grandes;
            los próximos quedan como promesa de marca en una fila compacta. */}
        <div className="guaurriverse-worlds-available mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {availableWorlds.map((world) => (
            <button
                key={world.id}
                type="button"
                onClick={() => openWorld(world)}
                aria-label={`Entrar a ${world.name}`}
                style={
                  {
                    "--world-accent": world.accent,
                    "--world-accent-soft": world.accentSoft,
                  } as WorldCardStyle
                }
                className={`world-card group relative aspect-[3/4] w-full overflow-hidden rounded-[1.35rem] border bg-[#263650] text-left shadow-[0_12px_24px_rgba(64,43,28,0.13)] transition-[transform,box-shadow,border-color] duration-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#ad9279] sm:aspect-auto sm:h-80 lg:h-[24rem] world-card--available hover:-translate-y-2`}
              >
                <WorldMediaPreview world={world} />

                <span className="world-card-overlay absolute inset-0" />
                <span className="absolute right-3 top-3 z-20 rounded-full border border-white/50 bg-white/90 px-3 py-1 font-interface text-[11px] font-bold uppercase tracking-[0.12em] text-[#263650] shadow-sm backdrop-blur">
                  Entrar
                </span>
                <span className="world-card-content absolute inset-x-0 bottom-0 z-10 block p-3 sm:p-5">
                  <span className="world-card-tag hidden items-center rounded-full border px-2.5 py-1 font-sans text-[10px] sm:inline-flex font-bold uppercase tracking-[0.16em]">
                    ✦ Guaurriverse
                  </span>
                  <span
                    className={`world-card-title mt-2 block max-w-full font-serif font-semibold leading-[1.25] ${
                      world.id === "academy"
                        ? "text-[clamp(0.95rem,1vw,1.1rem)]"
                        : "text-[clamp(1.05rem,1.25vw,1.3rem)]"
                    }`}
                  >
                    {world.name}
                  </span>
                  <span className="world-card-line mt-3 block h-px" />
                  <span className="world-card-subtitle mt-3 block pr-12 text-[11px] uppercase tracking-[0.12em]">
                    {world.description}
                  </span>
                </span>
                <span
                  className="world-card-cta absolute bottom-3 right-3 z-20 flex h-9 w-9 sm:bottom-5 sm:right-5 items-center justify-center rounded-full border text-xl"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
          ))}
        </div>

        <section className="guaurriverse-worlds-upcoming mt-6" aria-labelledby="guaurriverse-upcoming-title">
          <h3 id="guaurriverse-upcoming-title" className="font-interface text-[12px] font-bold uppercase tracking-[0.1em] text-[#42516a]">
            Próximamente en el Guaurriverse
          </h3>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {upcomingWorlds.map((world) => (
              <li
                key={world.id}
                className="guaurriverse-upcoming-item flex flex-col items-center gap-1 rounded-[0.75rem] border-2 border-dashed border-[#b9a6b2] bg-[#faf6f8] px-2 py-3 text-center"
              >
                <span className="text-[#6a5361]" aria-hidden="true"><SystemIcon name="lock" /></span>
                <span className="font-serif text-[13px] font-semibold leading-tight text-[#263650]">{world.name}</span>
                <span className="font-interface text-[12px] font-semibold text-[#6a5361]">Próximamente</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
