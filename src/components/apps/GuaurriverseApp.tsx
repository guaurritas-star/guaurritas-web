"use client";

import { useEffect, useState } from "react";

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
        src={world.media.src}
        poster={world.media.poster}
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
        style={{ backgroundImage: `url(${world.media.src})` }}
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
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId | null>(null);

  useEffect(() => {
    const syncWorld = () => setSelectedWorldId(readWorldFromUrl());

    syncWorld();
    window.addEventListener("popstate", syncWorld);

    return () => window.removeEventListener("popstate", syncWorld);
  }, []);

  const selectedWorld = worlds.find((world) => world.id === selectedWorldId);

  const openWorld = (worldId: WorldId) => {
    setSelectedWorldId(worldId);
    updateWorldInUrl(worldId);
  };

  const showAllWorlds = () => {
    setSelectedWorldId(null);
    updateWorldInUrl(null);
  };

  if (selectedWorld) {
    return (
      <section className="flex min-h-[26rem] flex-col items-center justify-center px-4 py-10 text-center">
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
    <section className="mx-auto w-full max-w-7xl">
      <header className="text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-[#60718e]">
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
            className="group relative aspect-[2/3] w-[70vw] max-w-[15rem] shrink-0 snap-center overflow-hidden rounded-[1.35rem] border border-[#425b8c]/25 bg-[#263650] text-left shadow-[0_12px_24px_rgba(38,54,80,0.16)] transition duration-200 hover:-translate-y-2 hover:shadow-[0_18px_32px_rgba(38,54,80,0.24)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#425b8c] sm:w-[15rem] lg:w-full"
          >
            <WorldMediaPreview world={world} />

            <span className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_20%,rgba(38,54,80,0.12)_52%,rgba(20,27,42,0.96)_100%)]" />
            <span className="absolute inset-x-0 bottom-0 z-10 block p-5 text-white">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-white/70">
                ✦ Guaurriverse
              </span>
              <span className="mt-2 block font-serif text-[1.45rem] font-semibold leading-7">
                {world.name}
              </span>
              <span className="mt-3 block h-px w-0 bg-white/70 transition-all duration-300 group-hover:w-full" />
              <span className="mt-3 block font-mono text-[9px] uppercase tracking-[0.13em] text-white/75">
                {world.description}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#71809a] lg:hidden">
        Desliza para explorar →
      </p>
    </section>
  );
}
