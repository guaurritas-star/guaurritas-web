"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ChatGuaurritasApp from "@/components/apps/ChatGuaurritasApp";
import ExpedienteRobbieApp from "@/components/apps/ExpedienteRobbieApp";
import GuaurriverseApp from "@/components/apps/GuaurriverseApp";
import GuaurrinotasAuthGate from "@/components/apps/GuaurrinotasAuthGate";
import PaintStudioApp from "@/components/apps/PaintStudioApp";
import RetroDesktopIcon from "@/components/desktop/RetroDesktopIcon";
import RetroWindow from "@/components/windows/RetroWindow";
import { withBasePath } from "@/lib/base-path";

const apps = [
  { id: "mundos", name: "Explora mundo", icon: "world" as const },
  { id: "mascota", name: "Mi mascota", icon: "pet" as const },
  { id: "paint", name: "Paint", icon: "paint" as const },
  { id: "notas", name: "Guaurrinotas", icon: "notes" as const },
  { id: "carrito", name: "Carrito", icon: "cart" as const },
  { id: "robbie", name: "Expediente Robbie", icon: "robbie" as const },
  { id: "chat", name: "Chat Guaurritas", icon: "pet" as const },
];

type AppIconKind = (typeof apps)[number]["icon"];

const desktopIconImages: Record<AppIconKind, string> = {
  world: withBasePath("/icons/desktop/world-planet.webp"),
  pet: withBasePath("/icons/desktop/pet-food-bowl.webp"),
  paint: withBasePath("/icons/desktop/paint-y2k.webp"),
  notes: withBasePath("/icons/desktop/notes-y2k-closed.webp"),
  cart: withBasePath("/icons/desktop/cart-empty.webp"),
  robbie: withBasePath("/icons/desktop/robbie-folder-closed.webp"),
};

function DesktopAppIcon({
  kind,
  className = "",
}: {
  kind: AppIconKind;
  className?: string;
}) {
  if (kind === "world") {
    return (
      <span
        aria-hidden="true"
        className={`desktop-icon-y2k desktop-icon-y2k-world relative block ${className}`}
      >
        <Image
          src={desktopIconImages.world}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-world-state desktop-world-planet absolute inset-0 h-full w-full object-contain"
        />

        <Image
          src={withBasePath("/icons/desktop/world-rocket.webp")}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-world-state desktop-world-rocket absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  if (kind === "notes") {
    return (
      <span
        aria-hidden="true"
        className={`desktop-icon-y2k desktop-icon-y2k-notes relative block ${className}`}
      >
        <Image
          src={desktopIconImages.notes}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-notes-state desktop-notes-closed absolute inset-0 h-full w-full object-contain"
        />

        <Image
          src={withBasePath("/icons/desktop/notes-y2k-open.webp")}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-notes-state desktop-notes-open absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  if (kind === "robbie") {
    return (
      <span
        aria-hidden="true"
        className={`desktop-icon-y2k desktop-icon-y2k-robbie relative block ${className}`}
      >
        <Image
          src={desktopIconImages.robbie}
          alt=""
          width={128}
          height={96}
          unoptimized
          className="desktop-robbie-state desktop-robbie-closed absolute inset-0 h-full w-full object-contain"
        />

        <Image
          src={withBasePath("/icons/desktop/robbie-folder-open.webp")}
          alt=""
          width={96}
          height={120}
          unoptimized
          className="desktop-robbie-state desktop-robbie-open absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  if (kind === "pet") {
    return (
      <span
        aria-hidden="true"
        className={`desktop-icon-y2k desktop-icon-y2k-pet relative block ${className}`}
      >
        <Image
          src={desktopIconImages.pet}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-pet-state desktop-pet-bowl absolute inset-0 h-full w-full object-contain"
        />

        <Image
          src={withBasePath("/icons/desktop/pet-seasoning-bowl.webp")}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-pet-state desktop-pet-seasoning absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  if (kind === "cart") {
    return (
      <span
        aria-hidden="true"
        className={`desktop-icon-y2k desktop-icon-y2k-cart relative block ${className}`}
      >
        <Image
          src={desktopIconImages.cart}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-cart-state desktop-cart-empty absolute inset-0 h-full w-full object-contain"
        />

        <Image
          src={withBasePath("/icons/desktop/cart-full.webp")}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="desktop-cart-state desktop-cart-full absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

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
  const [minimizedApp, setMinimizedApp] = useState<string | null>(null);
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedApp = apps.find((app) => app.id === activeApp);
  const taskApp = apps.find(
    (app) => app.id === activeApp || app.id === minimizedApp,
  );

  useEffect(() => {
    return () => {
      if (launchTimer.current) clearTimeout(launchTimer.current);
    };
  }, []);

  const openApp = (appId: string) => {
    setActiveApp(appId);
    setMinimizedApp(null);
  };

  const launchApp = (appId: string) => {
    if (launchingApp) return;

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const animateOnThisDevice = isMobile || appId === "robbie";

    if (!animateOnThisDevice || reduceMotion) {
      openApp(appId);
      return;
    }

    setLaunchingApp(appId);

    launchTimer.current = setTimeout(() => {
      setLaunchingApp(null);
      openApp(appId);
      launchTimer.current = null;
    }, 520);
  };

  const closeActiveApp = () => {
    setActiveApp(null);
    setMinimizedApp(null);
  };

  const minimizeActiveApp = () => {
    if (!activeApp) return;

    setMinimizedApp(activeApp);
    setActiveApp(null);
  };

  const toggleTaskApp = () => {
    if (!taskApp) return;

    if (activeApp === taskApp.id) {
      setMinimizedApp(taskApp.id);
      setActiveApp(null);
      return;
    }

    setActiveApp(taskApp.id);
    setMinimizedApp(null);
  };

  const openCuisineFromPaint = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("world", "cuisine");
    window.history.pushState({ world: "cuisine" }, "", url);
    setActiveApp("mundos");
    setMinimizedApp(null);
  };

  return (
    <main
      className={`relative h-dvh min-h-0 overflow-hidden bg-[#f2f2f2] text-[#263650] ${
        selectedApp ? "mobile-app-open" : ""
      }`}
    >
      <section className="desktop-launcher grid h-[calc(100dvh-52px)] grid-cols-2 content-start gap-5 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-5">
        {apps.map((app) => {
          const isLaunching = launchingApp === app.id;

          return (
            <button
              key={app.id}
              type="button"
              onClick={() => launchApp(app.id)}
              aria-busy={isLaunching || undefined}
              className={`desktop-shortcut group flex w-32 flex-col items-center gap-2 rounded-md p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425b8c] focus-visible:ring-offset-2 ${
                isLaunching ? "is-launching" : ""
              }`}
            >
              <span className="desktop-shortcut-icon flex h-[5.5rem] w-[5.5rem] items-center justify-center">
                <DesktopAppIcon kind={app.icon} className="h-full w-full" />
              </span>

              <span className="desktop-shortcut-label border border-transparent bg-white/85 px-2 py-1 font-interface text-xs font-bold tracking-[0.02em] shadow-[2px_2px_0_rgba(66,91,140,0.18)] transition-colors group-hover:border-[#425b8c] group-focus-visible:border-[#425b8c]">
                {app.name}
              </span>
            </button>
          );
        })}
      </section>

      <div className="desktop-brand pointer-events-none absolute inset-0 flex items-center justify-center pb-14">
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
          onClose={closeActiveApp}
          onMinimize={minimizeActiveApp}
          variant={
            selectedApp.id === "mundos" ||
            selectedApp.id === "paint" ||
            selectedApp.id === "robbie"
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
          ) : selectedApp.id === "robbie" ? (
            <ExpedienteRobbieApp />
          ) : selectedApp.id === "chat" ? (
            <ChatGuaurritasApp />
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

      <footer className="desktop-taskbar absolute inset-x-0 bottom-0 z-30 flex h-[52px] items-center gap-2 border-t-2 border-[#425b8c] bg-[#dce4f2] px-2">
        <button
          type="button"
          className="shrink-0 border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#425b8c]"
        >
          <span className="flex items-center gap-2">
            <RetroDesktopIcon kind="mark" className="h-5 w-5" />
            <span className="hidden sm:inline">Guaurritas.exe</span>
          </span>
        </button>

        <div className="flex min-w-0 flex-1 items-center">
          {taskApp && (
            <button
              type="button"
              onClick={toggleTaskApp}
              aria-label={
                activeApp === taskApp.id
                  ? `Minimizar ${taskApp.name}`
                  : `Restaurar ${taskApp.name}`
              }
              className={`flex min-w-0 max-w-[260px] items-center gap-2 border-2 border-[#425b8c] px-3 py-2 font-mono text-[10px] font-bold shadow-[2px_2px_0_#425b8c] sm:text-xs ${
                activeApp === taskApp.id ? "bg-[#c9d6ec]" : "bg-white"
              }`}
            >
              <span className="h-5 w-5 shrink-0">
                <DesktopAppIcon kind={taskApp.icon} className="h-full w-full" />
              </span>
              <span className="truncate">{taskApp.name}.exe</span>
            </button>
          )}
        </div>

        <div className="hidden shrink-0 border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs sm:block">
          GUAURRIVERSE ONLINE
        </div>
      </footer>
    </main>
  );
}
