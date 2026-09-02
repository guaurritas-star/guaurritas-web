"use client";

import { useEffect, useState, type CSSProperties } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";
import NationalCuisineStoreApp from "@/components/apps/NationalCuisineStoreApp";
import CoutureStoreApp from "@/components/apps/CoutureStoreApp";
import { withBasePath } from "@/lib/base-path";
import {
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
    media: {
      type: "image",
      src: "/guaurriverse/worlds/academy.jpg",
      alt: "Consejo de alimentación de GuaurriAcademy",
    },
  },
];

function isWorldId(value: string | null): value is WorldId {
  return worlds.some((world) => world.id === value);
}

function readWorldFromUrl(): WorldId | null {
  if (typeof window === "undefined") return null;

  const value = new URL(window.location.href).searchParams.get("world");
  return isWorldId(value) ? value : null;
}

function updateWorldInUrl(worldId: WorldId | null) {
  const url = new URL(window.location.href);

  if (worldId) {
    url.searchParams.set("world", worldId);
  } else {
    url.searchParams.delete("world");
  }

  window.history.pushState({ world: worldId }, "", url);
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
        className="absolute inset-0 bg-cover bg-top transition-transform duration-500 group-hover:scale-105"
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

function CuisineDeliveryChooser({
  onChoose,
  onBack,
}: {
  onChoose: (mode: FulfillmentMode) => void;
  onBack: () => void;
}) {
  return (
    <section className="-m-4 min-h-full bg-[#f7fafb] p-5 sm:-m-6 sm:p-8">
      <div className="mx-auto flex min-h-[30rem] w-full max-w-5xl flex-col justify-center">
        <button
          type="button"
          onClick={onBack}
          className="self-start font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#425b8c]"
        >
          ← Volver al Guaurriverse
        </button>

        <header className="mt-7 text-center">
          <p className="font-interface text-[10px] font-bold uppercase tracking-[0.22em] text-[#5e96a5]">
            Guaurritas Cuisine
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-[#263650] sm:text-4xl">
            ¿Cómo quieres recibir tu pedido?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#657287]">
            Primero elegimos la logística. Así solo te mostramos productos que
            realmente pueden llegar como deben.
          </p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onChoose("national")}
            className="group rounded-[1.6rem] border-2 border-[#7fa5b3] bg-white p-6 text-left shadow-[5px_5px_0_#b9d7df] transition hover:-translate-y-1"
          >
            <span className="text-4xl" aria-hidden="true">📦</span>
            <span className="mt-5 block font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#5e96a5]">
              Envío nacional
            </span>
            <strong className="mt-1 block font-serif text-2xl text-[#263650]">
              Recíbelo en México
            </strong>
            <span className="mt-3 block text-sm leading-6 text-[#657287]">
              Premios, snacks y accesorios preparados para viajar por paquetería.
              Los kits especiales se sumarán después de sus pruebas de empaque.
            </span>
            <span className="mt-5 inline-flex rounded-full bg-[#e8f2f4] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#425b8c]">
              Ver catálogo nacional →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChoose("leon")}
            className="group rounded-[1.6rem] border-2 border-[#d2a5ad] bg-white p-6 text-left shadow-[5px_5px_0_#edd0d6] transition hover:-translate-y-1"
          >
            <span className="text-4xl" aria-hidden="true">📍</span>
            <span className="mt-5 block font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#a66271]">
              Entrega en León
            </span>
            <strong className="mt-1 block font-serif text-2xl text-[#263650]">
              Cuisine completo
            </strong>
            <span className="mt-3 block text-sm leading-6 text-[#657287]">
              Petcakes, cupcakes, antojitos, repostería y todo el catálogo con
              entrega local. El pedido se confirma con pago completo.
            </span>
            <span className="mt-5 inline-flex rounded-full bg-[#fcf2f4] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#8f5663]">
              Ver catálogo León →
            </span>
          </button>
        </div>

        <p className="mt-5 text-center font-interface text-[10px] leading-5 text-[#718093]">
          Puedes cambiar de modalidad en cualquier momento. El carrito mantiene
          separados los artículos nacionales y los de entrega local.
        </p>
      </div>
    </section>
  );
}

export default function GuaurriverseApp() {
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId | null>(null);
  const [cuisineMode, setCuisineMode] = useState<FulfillmentMode | null>(null);

  useEffect(() => {
    const syncWorld = () => {
      const nextWorld = readWorldFromUrl();
      setSelectedWorldId(nextWorld);
      if (nextWorld !== "cuisine") setCuisineMode(null);
    };

    syncWorld();
    window.addEventListener("popstate", syncWorld);

    return () => window.removeEventListener("popstate", syncWorld);
  }, []);

  const selectedWorld = worlds.find((world) => world.id === selectedWorldId);

  const openWorld = (worldId: WorldId) => {
    setSelectedWorldId(worldId);
    if (worldId === "cuisine") setCuisineMode(null);
    updateWorldInUrl(worldId);
  };

  const showAllWorlds = () => {
    setSelectedWorldId(null);
    setCuisineMode(null);
    updateWorldInUrl(null);
  };

  const chooseCuisineMode = (mode: FulfillmentMode) => {
    setFulfillmentMode(mode);
    setCuisineMode(mode);
  };

  if (selectedWorld?.id === "cuisine") {
    if (cuisineMode === "national") {
      return <NationalCuisineStoreApp onBack={() => setCuisineMode(null)} />;
    }

    if (cuisineMode === "leon") {
      return <CuisineStoreApp onBack={() => setCuisineMode(null)} />;
    }

    return (
      <CuisineDeliveryChooser
        onChoose={chooseCuisineMode}
        onBack={showAllWorlds}
      />
    );
  }

  if (selectedWorld?.id === "couture") {
    return <CoutureStoreApp onBack={showAllWorlds} />;
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

        <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-5 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {worlds.map((world) => (
            <button
              key={world.id}
              type="button"
              onClick={() => openWorld(world.id)}
              aria-label={`Explorar ${world.name}`}
              style={
                {
                  "--world-accent": world.accent,
                  "--world-accent-soft": world.accentSoft,
                } as WorldCardStyle
              }
              className="world-card group relative aspect-[2/3] w-[70vw] max-w-[15rem] shrink-0 snap-center overflow-hidden rounded-[1.35rem] border bg-[#263650] text-left shadow-[0_12px_24px_rgba(64,43,28,0.13)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#ad9279] sm:w-[15rem] lg:w-full"
            >
              <WorldMediaPreview world={world} />

              <span className="world-card-overlay absolute inset-0" />
              <span className="world-card-content absolute inset-x-0 bottom-0 z-10 block p-5">
                <span className="world-card-tag inline-flex items-center rounded-full border px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.18em]">
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
                <span className="world-card-subtitle mt-3 block pr-9 text-[9px] uppercase tracking-[0.13em]">
                  {world.description}
                </span>
              </span>
              <span
                className="world-card-cta absolute bottom-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border text-xl"
                aria-hidden="true"
              >
                →
              </span>
            </button>
          ))}
        </div>

        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#927c68] lg:hidden">
          Desliza para explorar →
        </p>
      </div>
    </section>
  );
}
