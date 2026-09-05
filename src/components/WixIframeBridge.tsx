"use client";

import { useEffect } from "react";

const BRIDGE_SOURCE = "guaurritas-web";
const HEIGHT_MESSAGE = "guaurritas:height";
const SCROLL_LOCK_MESSAGE = "guaurritas:scroll-lock";
const EMBED_SOURCE = "guaurritas-embed";
const MOBILE_VIEWPORT_MESSAGE = "guaurritas:mobile-viewport";
const MOBILE_BREAKPOINT = 639;

function getDesktopDocumentHeight() {
  // En desktop Guaurritas OS es una pantalla completa, no un documento que
  // deba crecer según su scrollHeight. Si medimos el documento, Wix puede
  // agrandar el iframe más que el viewport real y dejar una franja blanca en
  // ciertas laptops/resoluciones. Usamos siempre el viewport visible.
  const viewportHeight =
    window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;

  return Math.max(1, Math.ceil(viewportHeight));
}

function getMobileContentHeight() {
  const main = document.querySelector("main");

  if (!(main instanceof HTMLElement)) {
    return Math.max(1, Math.ceil(document.body.scrollHeight));
  }

  // En el launcher la taskbar marca el final visual real de Guaurritas OS.
  // main.scrollHeight puede conservar parte del antiguo alto de viewport y
  // hacer que Wix reserve un bloque blanco después de la barra.
  if (!main.classList.contains("mobile-app-open")) {
    const taskbar = main.querySelector(":scope > .desktop-taskbar");

    if (taskbar instanceof HTMLElement) {
      const mainTop = main.getBoundingClientRect().top;
      const taskbarBottom = taskbar.getBoundingClientRect().bottom;

      return Math.max(1, Math.ceil(taskbarBottom - mainTop));
    }
  }

  return Math.max(
    1,
    Math.ceil(Math.max(main.getBoundingClientRect().height, main.scrollHeight)),
  );
}

export default function WixIframeBridge() {
  useEffect(() => {
    if (window.self === window.top) return;

    // Guardamos el viewport inicial únicamente para las apps que se abren a
    // pantalla completa. La pantalla principal del launcher se deja crecer de
    // forma natural para que no reserve espacio vacío antes de Gallery.
    const baseViewportHeight = Math.max(1, Math.round(window.innerHeight));
    const mobileLauncherHeight = Math.max(1, baseViewportHeight - 98);

    const style = document.createElement("style");
    style.id = "guaurritas-wix-iframe-layout";
    style.textContent = `
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        html,
        body {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
          overscroll-behavior: auto !important;
        }

        body {
          display: block !important;
        }

        /*
         * En Wix el launcher ya no debe comportarse como un viewport fijo.
         * Su alto pasa a ser exactamente el alto de sus iconos + taskbar.
         */
        main {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        .desktop-launcher {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        /*
         * La pantalla principal conserva el alto disponible original de Wix,
         * pero lo usa como wallpaper en vez de dejarlo como un bloque blanco.
         * Las tres filas se reparten sobre ese espacio para respirar mejor.
         */
        main:not(.mobile-app-open) > .desktop-launcher {
          min-height: ${mobileLauncherHeight}px !important;
          align-content: space-evenly !important;
        }

        main:not(.mobile-app-open) .desktop-shortcut-icon {
          width: 6rem !important;
          height: 6rem !important;
        }

        /*
         * La taskbar originalmente es absolute bottom-0. Dentro del embed eso
         * dejaba al main conservando una zona invisible debajo. La ponemos en
         * flujo normal para que marque el final real de Guaurritas OS.
         */
        main:not(.mobile-app-open) > .desktop-taskbar {
          position: relative !important;
          inset: auto !important;
          bottom: auto !important;
        }

        main.mobile-app-open {
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        main.mobile-app-open > .desktop-launcher,
        main.mobile-app-open > .desktop-brand,
        main.mobile-app-open > .desktop-taskbar {
          display: none !important;
        }

        .retro-window-overlay {
          position: relative !important;
          inset: auto !important;
          height: auto !important;
          min-height: ${baseViewportHeight}px !important;
          align-items: stretch !important;
        }

        .retro-window-dialog {
          height: auto !important;
          min-height: ${baseViewportHeight}px !important;
          max-height: none !important;
        }

        .retro-window-content {
          min-height: 0 !important;
          overflow-y: visible !important;
          overscroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);

    let animationFrame = 0;
    let pageScrollLocked = false;
    let mobileViewportTop = 0;
    let mobileViewportHeight = baseViewportHeight;
    let mobileViewportActive = true;

    function syncMobileViewportUi() {
      if (window.innerWidth > MOBILE_BREAKPOINT) return;

      const root = document.documentElement;
      root.style.setProperty(
        "--guaurritas-mobile-viewport-top",
        `${Math.max(0, Math.round(mobileViewportTop))}px`,
      );
      root.style.setProperty(
        "--guaurritas-mobile-viewport-height",
        `${Math.max(1, Math.round(mobileViewportHeight))}px`,
      );

      document
        .querySelectorAll<HTMLElement>(".cuisine-mobile-sticky-header")
        .forEach((header) => {
          const previousShift = Number(
            header.dataset.guaurritasStickyShift || "0",
          );
          const originTop =
            header.getBoundingClientRect().top - previousShift;
          const section = header.closest("section");
          const sectionRect =
            section instanceof HTMLElement
              ? section.getBoundingClientRect()
              : null;
          const maxShift = sectionRect
            ? Math.max(
                0,
                sectionRect.top +
                  section.scrollHeight -
                  header.offsetHeight -
                  originTop,
              )
            : Number.POSITIVE_INFINITY;
          const nextShift = mobileViewportActive
            ? Math.min(
                maxShift,
                Math.max(0, mobileViewportTop - originTop),
              )
            : 0;

          header.dataset.guaurritasStickyShift = String(nextShift);
          header.style.setProperty(
            "--cuisine-mobile-sticky-shift",
            `${Math.round(nextShift)}px`,
          );
        });
    }

    function handleParentViewportMessage(event: MessageEvent) {
      if (event.source !== window.parent) return;

      let message = event.data;

      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch {
          return;
        }
      }

      if (
        !message ||
        typeof message !== "object" ||
        message.source !== EMBED_SOURCE ||
        message.type !== MOBILE_VIEWPORT_MESSAGE
      ) {
        return;
      }

      const nextTop = Number(message.top);
      const nextHeight = Number(message.height);

      mobileViewportTop = Number.isFinite(nextTop)
        ? Math.max(0, nextTop)
        : 0;
      mobileViewportHeight =
        Number.isFinite(nextHeight) && nextHeight > 0
          ? nextHeight
          : baseViewportHeight;
      mobileViewportActive = message.active !== false;

      syncMobileViewportUi();
    }

    function getCurrentHeight() {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        return getMobileContentHeight();
      }

      return getDesktopDocumentHeight();
    }

    function enviarAltura() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const height = getCurrentHeight();

        window.parent.postMessage(
          {
            source: BRIDGE_SOURCE,
            type: HEIGHT_MESSAGE,
            height,
          },
          "*",
        );

        window.parent.postMessage(
          JSON.stringify({ type: "resize", height }),
          "*",
        );
      });
    }

    function syncCheckoutScrollLock() {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        if (pageScrollLocked) {
          pageScrollLocked = false;
          window.parent.postMessage(
            {
              source: BRIDGE_SOURCE,
              type: SCROLL_LOCK_MESSAGE,
              locked: false,
            },
            "*",
          );
        }
        return;
      }

      const shouldLock = Boolean(
        document.documentElement.classList.contains(
          "guaurritas-system-cart-open",
        ) &&
          document.querySelector("#taskbar-cart-panel"),
      );

      if (shouldLock === pageScrollLocked) return;
      pageScrollLocked = shouldLock;

      window.parent.postMessage(
        {
          source: BRIDGE_SOURCE,
          type: SCROLL_LOCK_MESSAGE,
          locked: shouldLock,
        },
        "*",
      );
    }

    const resizeObserver = new ResizeObserver(() => {
      enviarAltura();
      syncCheckoutScrollLock();
      syncMobileViewportUi();
    });
    const main = document.querySelector("main");

    if (main) {
      resizeObserver.observe(main);
    } else {
      resizeObserver.observe(document.body);
    }

    const mutationObserver = new MutationObserver(() => {
      enviarAltura();
      syncCheckoutScrollLock();
      syncMobileViewportUi();
    });
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    const handleViewportChange = () => {
      enviarAltura();
      syncCheckoutScrollLock();
      syncMobileViewportUi();
    };

    window.addEventListener("message", handleParentViewportMessage);
    window.addEventListener("load", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

    enviarAltura();
    syncCheckoutScrollLock();
    syncMobileViewportUi();

    const delayedMeasurements = [
      window.setTimeout(handleViewportChange, 100),
      window.setTimeout(handleViewportChange, 400),
      window.setTimeout(handleViewportChange, 1200),
    ];

    return () => {
      if (pageScrollLocked) {
        window.parent.postMessage(
          {
            source: BRIDGE_SOURCE,
            type: SCROLL_LOCK_MESSAGE,
            locked: false,
          },
          "*",
        );
      }

      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      delayedMeasurements.forEach(window.clearTimeout);
      window.removeEventListener("message", handleParentViewportMessage);
      window.removeEventListener("load", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);

      document.documentElement.style.removeProperty(
        "--guaurritas-mobile-viewport-top",
      );
      document.documentElement.style.removeProperty(
        "--guaurritas-mobile-viewport-height",
      );
      document
        .querySelectorAll<HTMLElement>(".cuisine-mobile-sticky-header")
        .forEach((header) => {
          delete header.dataset.guaurritasStickyShift;
          header.style.removeProperty("--cuisine-mobile-sticky-shift");
        });

      style.remove();
    };
  }, []);

  return null;
}
