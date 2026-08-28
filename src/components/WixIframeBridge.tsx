"use client";

import { useEffect } from "react";

const BRIDGE_SOURCE = "guaurritas-web";
const HEIGHT_MESSAGE = "guaurritas:height";
const MOBILE_BREAKPOINT = 639;

function getDesktopDocumentHeight() {
  const body = document.body;
  const html = document.documentElement;

  return Math.ceil(
    Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    ),
  );
}

function getMobileContentHeight() {
  const main = document.querySelector("main");

  if (!(main instanceof HTMLElement)) {
    return Math.max(1, Math.ceil(document.body.scrollHeight));
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

    const resizeObserver = new ResizeObserver(enviarAltura);
    const main = document.querySelector("main");

    if (main) {
      resizeObserver.observe(main);
    } else {
      resizeObserver.observe(document.body);
    }

    const mutationObserver = new MutationObserver(enviarAltura);
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    window.addEventListener("load", enviarAltura);
    window.addEventListener("resize", enviarAltura);
    window.addEventListener("orientationchange", enviarAltura);

    enviarAltura();

    const delayedMeasurements = [
      window.setTimeout(enviarAltura, 100),
      window.setTimeout(enviarAltura, 400),
      window.setTimeout(enviarAltura, 1200),
    ];

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      delayedMeasurements.forEach(window.clearTimeout);
      window.removeEventListener("load", enviarAltura);
      window.removeEventListener("resize", enviarAltura);
      window.removeEventListener("orientationchange", enviarAltura);
      style.remove();
    };
  }, []);

  return null;
}
