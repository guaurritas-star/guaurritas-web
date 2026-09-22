"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  cacheWixMemberState,
  normalizeWixMemberState,
  readCachedWixMemberState,
  WIX_MEMBER_STATE_CACHE_KEY,
  type WixMemberState,
} from "@/lib/wix-member-state";

type HeaderMenu = "pages" | "mobile" | "account" | null;

const MEMBER_STATE_MESSAGE = "guaurritas:member-state";
const MEMBER_LOGIN_REQUEST_MESSAGE = "guaurritas:member-login-request";
const MEMBER_LOGOUT_REQUEST_MESSAGE = "guaurritas:member-logout-request";
const MEMBER_STATE_REQUEST_MESSAGE = "guaurritas:member-state-request";
const WEB_SOURCE = "guaurritas-web";
const EMBED_SOURCE = "guaurritas-embed";

const wixPages = {
  home: "https://www.guaurritas.com/",
  robbie: "https://www.guaurritas.com/?app=robbie",
  shop: "https://www.guaurritas.com/?app=mundos",
  mascota: "https://www.guaurritas.com/?app=mascota",
  blog: "https://www.guaurritas.com/blog",
  contact: "https://www.guaurritas.com/contacto",
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

function AccountUserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="desktop-os-member-user-icon">
      <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.75 19c.55-3.45 2.65-5.3 6.25-5.3s5.7 1.85 6.25 5.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WixMemberAccess({
  menuOpen,
  onMenuChange,
}: {
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
}) {
  const [member, setMember] = useState<WixMemberState>({
    loggedIn: false,
    name: "",
    photoUrl: "",
  });
  const [authBusy, setAuthBusy] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cachedMember = readCachedWixMemberState();
    const cachedStateTimer = cachedMember?.loggedIn
      ? window.setTimeout(() => setMember(cachedMember), 0)
      : null;

    const handleMemberState = (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      const message = event.data;
      if (
        !message ||
        typeof message !== "object" ||
        message.source !== EMBED_SOURCE ||
        message.type !== MEMBER_STATE_MESSAGE
      ) {
        return;
      }

      const nextMember = normalizeWixMemberState(message, readCachedWixMemberState());
      setMember(nextMember);
      cacheWixMemberState(nextMember);
      setAuthBusy(false);
      if (!nextMember.loggedIn) onMenuChange(false);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== WIX_MEMBER_STATE_CACHE_KEY) return;
      const cached = readCachedWixMemberState();
      if (cached) setMember(cached);
    };

    window.addEventListener("message", handleMemberState);
    window.addEventListener("storage", handleStorage);

    const requestMemberState = () =>
      window.parent.postMessage({ source: WEB_SOURCE, type: MEMBER_STATE_REQUEST_MESSAGE }, "*");
    requestMemberState();
    const retryTimers = [250, 900].map((delay) => window.setTimeout(requestMemberState, delay));

    return () => {
      window.removeEventListener("message", handleMemberState);
      window.removeEventListener("storage", handleStorage);
      if (cachedStateTimer !== null) window.clearTimeout(cachedStateTimer);
      retryTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [onMenuChange]);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) onMenuChange(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMenuChange(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, onMenuChange]);

  const requestAuth = (type: string) => {
    if (authBusy) return;
    setAuthBusy(true);
    onMenuChange(false);
    window.parent.postMessage({ source: WEB_SOURCE, type }, "*");
  };

  if (!member.loggedIn) {
    return (
      <div className="desktop-os-account">
        <button
          type="button"
          className="desktop-os-member desktop-os-member--login"
          onClick={() => requestAuth(MEMBER_LOGIN_REQUEST_MESSAGE)}
          aria-label="Iniciar sesión en Guaurritas"
          aria-busy={authBusy || undefined}
        >
          <span className="desktop-os-member-login-icon" aria-hidden="true"><AccountUserIcon /></span>
          <span className="desktop-os-member-copy">
            <span className="desktop-os-member-eyebrow">Cuenta Guaurritas</span>
            <span
              className="desktop-os-member-login-label"
              data-mobile-label={authBusy ? "Abriendo…" : "Entrar"}
            >
              {authBusy ? "Abriendo…" : "Iniciar sesión"}
            </span>
          </span>
        </button>
      </div>
    );
  }

  const memberName = member.name || "Mi cuenta";

  return (
    <div className="desktop-os-account" ref={accountRef}>
      <button
        type="button"
        className="desktop-os-member desktop-os-member--profile"
        onClick={() => onMenuChange(!menuOpen)}
        aria-label={`Abrir cuenta de ${memberName}`}
        aria-expanded={menuOpen}
        title={memberName}
      >
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoUrl} alt="" className="desktop-os-member-avatar" />
        ) : (
          <span className="desktop-os-member-avatar desktop-os-member-avatar--fallback" aria-hidden="true">
            <AccountUserIcon />
          </span>
        )}
        <span className="desktop-os-member-name">{memberName}</span>
        <span className="desktop-os-member-caret" aria-hidden="true">▾</span>
      </button>

      {menuOpen && (
        <div className="desktop-os-member-menu" role="menu">
          <div className="desktop-os-member-menu-header">
            <span className="desktop-os-member-menu-kicker">Sesión activa</span>
            <strong>{memberName}</strong>
          </div>
          <div className="desktop-os-member-menu-actions">
            <WixPageLink href={wixPages.mascota} className="desktop-os-member-menu-item">
              <span className="desktop-os-member-menu-icon" aria-hidden="true">🐾</span>
              <span><strong>Mi mascota</strong><small>Compras y recomendaciones</small></span>
            </WixPageLink>
            <button
              type="button"
              className="desktop-os-member-menu-item desktop-os-member-menu-item--logout"
              onClick={() => requestAuth(MEMBER_LOGOUT_REQUEST_MESSAGE)}
              disabled={authBusy}
            >
              <span className="desktop-os-member-menu-icon" aria-hidden="true">↪</span>
              <span><strong>{authBusy ? "Cerrando sesión…" : "Cerrar sesión"}</strong><small>Salir de esta cuenta</small></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalWixHeader() {
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const isExpandedFrame = useRef(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const changeMenu = useCallback((menu: HeaderMenu) => {
    setOpenMenu(menu);
  }, []);

  const handleAccountMenuChange = useCallback(
    (open: boolean) => changeMenu(open ? "account" : null),
    [changeMenu],
  );

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add("global-wix-header-document");
    body.classList.add("global-wix-header-document");

    isExpandedFrame.current =
      new URLSearchParams(window.location.search).get("mode") === "expanded";

    const handleParentMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !event.data || typeof event.data !== "object") return;
      if (event.data.type === "openDesktopMenu") {
        const requested = event.data.menuId;
        if (requested === "pages" || requested === "mobile" || requested === "account") {
          setOpenMenu(requested);
        }
      }
      if (event.data.type === "closeDesktopMenus") setOpenMenu(null);
    };

    window.addEventListener("message", handleParentMessage);
    return () => {
      window.removeEventListener("message", handleParentMessage);
      root.classList.remove("global-wix-header-document");
      body.classList.remove("global-wix-header-document");
    };
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;

    const getOpenPanel = () => {
      if (openMenu === "pages") {
        return header.querySelector<HTMLElement>(".desktop-os-dropdown-pages");
      }
      if (openMenu === "mobile") {
        return header.querySelector<HTMLElement>(".desktop-os-mobile-menu");
      }
      if (openMenu === "account") {
        return header.querySelector<HTMLElement>(".desktop-os-member-menu");
      }
      return null;
    };

    const reportHeight = () => {
      const baseHeight = window.matchMedia("(max-width: 900px)").matches ? 46 : 50;
      const panel = getOpenPanel();
      const panelBottom = panel?.getBoundingClientRect().bottom ?? baseHeight;
      const height = openMenu ? Math.ceil(Math.max(baseHeight, panelBottom + 7)) : baseHeight;

      window.parent.postMessage(
        {
          type: "headerDropdownState",
          open: openMenu !== null,
          menuId: openMenu,
          height,
        },
        "*",
      );
    };

    animationFrame = window.requestAnimationFrame(() => {
      reportHeight();
      const panel = getOpenPanel();
      if (panel && "ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(reportHeight);
        resizeObserver.observe(panel);
      }
    });

    window.addEventListener("resize", reportHeight);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", reportHeight);
    };
  }, [openMenu]);

  return (
    <header ref={headerRef} className="desktop-os-header global-wix-header">
      <WixPageLink href={wixPages.home} className="desktop-os-brand">
        <span className="desktop-os-brand-mascot" aria-hidden="true">
          <Image
            src={withBasePath("/icons/desktop/guaurritas-mascot-hd.webp")}
            alt=""
            fill
            sizes="42px"
            className="desktop-os-brand-mascot-source"
          />
        </span>
        <span>Guaurritas</span>
      </WixPageLink>

      <nav className="desktop-os-nav" aria-label="Navegación principal">
        <WixPageLink href={wixPages.home} className="desktop-os-nav-link">Inicio</WixPageLink>
        <WixPageLink href={wixPages.robbie} className="desktop-os-nav-link">Nosotros</WixPageLink>
        <WixPageLink href={wixPages.shop} className="desktop-os-nav-link">Tienda</WixPageLink>
        <WixPageLink href={wixPages.blog} className="desktop-os-nav-link">Blog</WixPageLink>
        <div
          className={`desktop-os-nav-group ${openMenu === "pages" ? "is-open" : ""}`}
          onPointerEnter={() => changeMenu("pages")}
          onPointerLeave={() => {
            if (isExpandedFrame.current && openMenu === "pages") changeMenu(null);
          }}
        >
          <button
            type="button"
            className="desktop-os-nav-link"
            onClick={() => changeMenu(openMenu === "pages" ? null : "pages")}
            aria-expanded={openMenu === "pages"}
          >
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
        <WixPageLink href={wixPages.contact} className="desktop-os-nav-link">Contacto</WixPageLink>
      </nav>

      <div className="desktop-os-online" aria-label="Guaurritas en línea">
        <span className="desktop-os-online-led" aria-hidden="true" />
        <span>En línea</span>
      </div>

      <WixMemberAccess
        menuOpen={openMenu === "account"}
        onMenuChange={handleAccountMenuChange}
      />

      <button
        type="button"
        className="desktop-os-menu-toggle"
        aria-expanded={openMenu === "mobile"}
        onClick={() => changeMenu(openMenu === "mobile" ? null : "mobile")}
      >
        Menú <span aria-hidden="true">▾</span>
      </button>

      {openMenu === "mobile" && (
        <div className="desktop-os-mobile-menu">
          <div className="desktop-os-mobile-menu-title">
            <span>Menú — Guaurritas OS</span>
            <button type="button" aria-label="Cerrar menú" onClick={() => changeMenu(null)}>×</button>
          </div>
          <div className="desktop-os-mobile-menu-body">
            <WixPageLink href={wixPages.home}>Inicio</WixPageLink>
            <WixPageLink href={wixPages.robbie}>Nosotros</WixPageLink>
            <WixPageLink href={wixPages.shop}>Tienda</WixPageLink>
            <WixPageLink href={wixPages.blog}>Blog</WixPageLink>
            <WixPageLink href={wixPages.contact}>Contacto</WixPageLink>
            <details>
              <summary>Páginas</summary>
              <div className="desktop-os-mobile-submenu">
                <WixPageLink href={wixPages.faq}>FAQ</WixPageLink>
                <WixPageLink href={wixPages.terms}>Términos y condiciones</WixPageLink>
                <WixPageLink href={wixPages.privacy}>Aviso de privacidad</WixPageLink>
                <WixPageLink href={wixPages.refunds}>Reembolso</WixPageLink>
                <WixPageLink href={wixPages.cookies}>Política de cookies</WixPageLink>
                <WixPageLink href={wixPages.shipping}>Envíos y devoluciones</WixPageLink>
              </div>
            </details>
          </div>
        </div>
      )}
    </header>
  );
}
