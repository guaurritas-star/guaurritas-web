"use client";

import Image from "next/image";
import { useState } from "react";
import GuaurriverseApp from "@/components/apps/GuaurriverseApp";
import GuaurrinotasAuthGate from "@/components/apps/GuaurrinotasAuthGate";
import PaintStudioApp from "@/components/apps/PaintStudioApp";
import RetroDesktopIcon from "@/components/desktop/RetroDesktopIcon";
import RetroWindow from "@/components/windows/RetroWindow";

const apps = [
  { id: "mundos", name: "Explora mundo", icon: "world" as const },
  { id: "mascota", name: "Mi mascota", icon: "pet" as const },
  { id: "paint", name: "Paint", icon: "paint" as const },
  { id: "notas", name: "Guaurrinotas", icon: "notes" as const },
  { id: "carrito", name: "Carrito", icon: "cart" as const },
];

type AppIconKind = (typeof apps)[number]["icon"];

const desktopIconImages: Record<AppIconKind, string> = {
  world: "/icons/desktop/world-y2k.webp",
  pet: "/icons/desktop/pet-y2k.webp",
  paint: "/icons/desktop/paint-y2k.webp",
  notes: "/icons/desktop/notes-y2k.webp",
  cart: "/icons/desktop/cart-y2k.webp",
};

function DesktopAppIcon({
  kind,
  className = "",
}: {
  kind: AppIconKind;
  className?: string;
}) {
  return (
    <Image
      src={desktopIconImages[kind]}
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      unoptimized
      className={`desktop-icon-y2k desktop-icon-y2k-${kind} object-contain ${className}`}
    />
  );
}

export default function Desktop() {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const selectedApp = apps.find((app) => app.id === activeApp);

  const openCuisineFromPaint = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("world", "cuisine");
    window.history.pushState({ world: "cuisine" }, "", url);
    setActiveApp("mundos");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f2f2] text-[#263650]">
      <section className="grid min-h-[calc(100vh-52px)] grid-cols-2 content-start gap-5 p-6 sm:grid-cols-3 lg:grid-cols-5">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => setActiveApp(app.id)}
            onDoubleClick={() => setActiveApp(app.id)}
            className="desktop-shortcut group flex w-32 flex-col items-center gap-2 rounded-md p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425b8c] focus-visible:ring-offset-2"
          >
            <span className="desktop-shortcut-icon flex h-[5.5rem] w-[5.5rem] items-center justify-center">
              <DesktopAppIcon kind={app.icon} className="h-full w-full" />
            </span>

            <span className="desktop-shortcut-label border border-transparent bg-white/85 px-2 py-1 font-interface text-xs font-bold tracking-[0.02em] shadow-[2px_2px_0_rgba(66,91,140,0.18)] transition-colors group-hover:border-[#425b8c] group-focus-visible:border-[#425b8c]">
              {app.name}
            </span>
          </button>
        ))}
      </section>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-14">
        <div className="text-center">
          <h1 className="text-5xl font-semibold italic text-[#425b8c] sm:text-7xl">
            Guaurritas
          </h1>

          <p className="mt-3 max-w-md px-6 text-sm leading-6 sm:text-base">
            Lo que comen, lo que usan, lo que viven y lo que aprenden.
          </p>
        </div>
      </div>

      {selectedApp && (
        <RetroWindow
          title={selectedApp.name}
          icon={<DesktopAppIcon kind={selectedApp.icon} className="h-full w-full" />}
          onClose={() => setActiveApp(null)}
          variant={
            selectedApp.id === "mundos" || selectedApp.id === "paint"
              ? "wide"
              : "default"
          }
        >
          {selectedApp.id === "mundos" ? (
            <GuaurriverseApp />
          ) : selectedApp.id === "paint" ? (
            <PaintStudioApp onOpenCuisine={openCuisineFromPaint} />
          ) : selectedApp.id === "notas" ? (
            <GuaurrinotasAuthGate />
          ) : (
            <div className="text-center">
              <p className="font-mono text-sm uppercase tracking-wider">
                Aplicación en construcción
              </p>

              <p className="mt-3 text-sm leading-6 text-[#53627a]">
                Aquí construiremos la experiencia de {selectedApp.name}.
              </p>
            </div>
          )}
        </RetroWindow>
      )}

      <footer className="absolute inset-x-0 bottom-0 z-30 flex h-[52px] items-center justify-between border-t-2 border-[#425b8c] bg-[#dce4f2] px-2">
        <button
          type="button"
          className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#425b8c]"
        >
          <span className="flex items-center gap-2">
            <RetroDesktopIcon kind="mark" className="h-5 w-5" />
            Guaurritas.exe
          </span>
        </button>

        <div className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs">
          GUAURRIVERSE ONLINE
        </div>
      </footer>
    </main>
  );
}
