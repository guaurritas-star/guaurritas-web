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
          width={128}
          height={96}
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

const wixPages = {
  home: "https://www.guaurritas.com/inicio",
  guaurrinicio: "https://www.guaurritas.com/guaurrinicio",
  about: "https://www.guaurritas.com/nosotros",
  history: "https://www.guaurritas.com/historia",
  blog: "https://www.guaurritas.com/blog",
  contact: "https://www.guaurritas.com/contact",
  faq: "https://www.guaurritas.com/faq",
  terms: "https://www.guaurritas.com/terminos-y-condiciones",
  privacy: "https://www.guaurritas.com/aviso-de-privacidad",
  refunds: "https://www.guaurritas.com/reembolso",
  cookies: "https://www.guaurritas.com/politica-cookies",
  shipping: "https://www.guaurritas.com/envios-y-devoluciones",
};

function WixPageLink({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a href={href} target="_top" className={className} onClick={onClick}>
      {children}
    </a>
  );
}

function GuaurritasHeader({ onOpenShop }: { onOpenShop: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openShop = () => {
    setMobileMenuOpen(false);
    onOpenShop();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="desktop-os-header">
      <WixPageLink href={wixPages.home} className="desktop-os-brand">
        <span className="desktop-os-brand-mascot" aria-hidden="true">
          <Image
            src={withBasePath("/icons/desktop/notes-y2k-closed.webp")}
            alt=""
            fill
            sizes="42px"
            className="desktop-os-brand-mascot-source"
          />
        </span>
        <span>Guaurritas</span>
      </WixPageLink>

      <nav className="desktop-os-nav" aria-label="Navegación principal">
        <div className="desktop-os-nav-group">
          <WixPageLink href={wixPages.home} className="desktop-os-nav-link">
            Inicio <span aria-hidden="true">▸</span>
          </WixPageLink>
          <div className="desktop-os-dropdown">
            <WixPageLink href={wixPages.guaurrinicio}>Guaurrinicio</WixPageLink>
          </div>
        </div>

        <div className="desktop-os-nav-group">
          <WixPageLink href={wixPages.about} className="desktop-os-nav-link">
            Nosotros <span aria-hidden="true">▸</span>
          </WixPageLink>
          <div className="desktop-os-dropdown">
            <WixPageLink href={wixPages.history}>Nuestra historia</WixPageLink>
          </div>
        </div>

        <button type="button" onClick={openShop} className="desktop-os-nav-link">
          Tienda
        </button>

        <WixPageLink href={wixPages.blog} className="desktop-os-nav-link">
          Blog
        </WixPageLink>

        <div className="desktop-os-nav-group">
          <button type="button" className="desktop-os-nav-link">
            Páginas <span aria-hidden="true">▸</span>
          </button>
          <div className="desktop-os-dropdown desktop-os-dropdown-pages">
            <WixPageLink href={wixPages.faq}>FAQ</WixPageLink>
            <WixPageLink href={wixPages.terms}>Términos y condiciones</WixPageLink>
            <WixPageLink href={wixPages.privacy}>Aviso de privacidad</WixPageLink>
            <WixPageLink href={wixPages.refunds}>Reembolso</WixPageLink>
            <WixPageLink href={wixPages.cookies}>Política de cookies</WixPageLink>
            <WixPageLink href={wixPages.shipping}>Envíos y devoluciones</WixPageLink>
          </div>
        </div>

        <WixPageLink href={wixPages.contact} className="desktop-os-nav-link">
          Contacto
        </WixPageLink>
      </nav>

      <div className="desktop-os-online" aria-label="Guaurritas en línea">
        <span className="desktop-os-online-led" aria-hidden="true" />
        <span>En línea</span>
      </div>

      <button
        type="button"
        className="desktop-os-menu-toggle"
        aria-expanded={mobileMenuOpen}
        aria-controls="guaurritas-mobile-menu"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        Menú <span aria-hidden="true">▾</span>
      </button>

      {mobileMenuOpen && (
        <div id="guaurritas-mobile-menu" className="desktop-os-mobile-menu">
          <div className="desktop-os-mobile-menu-title">
            <span>Menú — Guaurritas OS</span>
            <button type="button" aria-label="Cerrar menú" onClick={closeMobileMenu}>
              ×
            </button>
          </div>
          <div className="desktop-os-mobile-menu-body">
            <WixPageLink href={wixPages.home} onClick={closeMobileMenu}>Inicio</WixPageLink>
            <WixPageLink href={wixPages.about} onClick={closeMobileMenu}>Nosotros</WixPageLink>
            <button type="button" onClick={openShop}>Tienda</button>
            <WixPageLink href={wixPages.blog} onClick={closeMobileMenu}>Blog</WixPageLink>
            <WixPageLink href={wixPages.contact} onClick={closeMobileMenu}>Contacto</WixPageLink>
            <details>
              <summary>Páginas</summary>
              <div className="desktop-os-mobile-submenu">
                <WixPageLink href={wixPages.guaurrinicio} onClick={closeMobileMenu}>Guaurrinicio</WixPageLink>
                <WixPageLink href={wixPages.history} onClick={closeMobileMenu}>Nuestra historia</WixPageLink>
                <WixPageLink href={wixPages.faq} onClick={closeMobileMenu}>FAQ</WixPageLink>
                <WixPageLink href={wixPages.terms} onClick={closeMobileMenu}>Términos y condiciones</WixPageLink>
                <WixPageLink href={wixPages.privacy} onClick={closeMobileMenu}>Aviso de privacidad</WixPageLink>
                <WixPageLink href={wixPages.refunds} onClick={closeMobileMenu}>Reembolso</WixPageLink>
                <WixPageLink href={wixPages.cookies} onClick={closeMobileMenu}>Política de cookies</WixPageLink>
                <WixPageLink href={wixPages.shipping} onClick={closeMobileMenu}>Envíos y devoluciones</WixPageLink>
              </div>
            </details>
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopClock() {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Intl.DateTimeFormat("es-MX", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };

    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return <time>{time}</time>;
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

  const openGuaurriverseFromHeader = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("world");
    window.history.pushState({ world: null }, "", url);
    openApp("mundos");
  };

  return (
    <main
      style={{
        backgroundImage: `url("${withBasePath("/guaurritas-desktop-wallpaper.jpeg")}")`,
      }}
      className={`desktop-wallpaper relative h-dvh min-h-0 overflow-hidden text-[#263650] ${
        selectedApp ? "mobile-app-open" : ""
      }`}
    >
      <GuaurritasHeader onOpenShop={openGuaurriverseFromHeader} />

      <section className="desktop-launcher grid h-[calc(100dvh-102px)] grid-cols-2 content-start gap-5 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-5">
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

              <span className="desktop-shortcut-label px-2 py-1 font-title text-xs font-bold tracking-[0.02em] text-[#263650] [text-shadow:0_1px_2px_rgba(255,255,255,0.9)]">
                {app.name}
              </span>
            </button>
          );
        })}
      </section>

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

      <footer className="desktop-taskbar absolute inset-x-0 bottom-0 z-30 flex h-[52px] items-center gap-2 border-t-2 border-[#875773] bg-[#D9A6B9] px-2 font-title text-white">
        <button
          type="button"
          className="shrink-0 border-2 border-[#875773] bg-[#c985a5] px-3 py-2 font-title text-xs font-bold text-white shadow-[2px_2px_0_#6f3f5b]"
        >
          <span className="flex items-center gap-2">
            <RetroDesktopIcon kind="mark" className="h-5 w-5" />
            <span className="hidden sm:inline">Inicio</span>
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
              className={`flex min-w-0 max-w-[260px] items-center gap-2 border-2 border-[#875773] px-3 py-2 font-title text-[10px] font-bold text-white shadow-[2px_2px_0_#6f3f5b] sm:text-xs ${
                activeApp === taskApp.id ? "bg-[#b97496]" : "bg-[#c985a5]"
              }`}
            >
              <span className="h-5 w-5 shrink-0">
                <DesktopAppIcon kind={taskApp.icon} className="h-full w-full" />
              </span>
              <span className="truncate">{taskApp.name}.exe</span>
            </button>
          )}
        </div>

        <div className="desktop-taskbar-clock shrink-0 border-2 border-[#875773] bg-[#c985a5] px-3 py-2 font-title text-xs text-white">
          <span aria-hidden="true">◖))</span>
          <DesktopClock />
        </div>
      </footer>
    </main>
  );
}
