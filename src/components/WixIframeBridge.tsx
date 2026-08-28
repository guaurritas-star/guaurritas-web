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

function getMobileContentHeight(baseViewportHeight: number) {
  const main = document.querySelector("main");

  if (!(main instanceof HTMLElement)) {
    return Math.ceil(baseViewportHeight);
  }

  const rectHeight = main.getBoundingClientRect().height;
  const contentHeight = Math.max(rectHeight, main.scrollHeight);

  return Math.ceil(Math.max(baseViewportHeight, contentHeight));
}

export default function WixIframeBridge() {
  useEffect(() => {
    if (window.self === window.top) return;

    // Guardamos el alto inicial real del iframe antes de que Wix empiece a
    // redimensionarlo. Así evitamos el bucle: iframe grande -> 100dvh grande
    // -> medición más grande -> iframe todavía más grande.
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

        main {
          height: ${baseViewportHeight}px !important;
          min-height: ${baseViewportHeight}px !important;
          overflow: hidden !important;
        }

        .desktop-launcher {
          height: ${Math.max(1, baseViewportHeight - 52)}px !important;
        }

        main.mobile-app-open {
          height: auto !important;
          min-height: ${baseViewportHeight}px !important;
          overflow: visible !important;
        }

        main.mobile-app-open > .desktop-launcher,
        main.mobile-app-open > .desktop-brand {
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
        return getMobileContentHeight(baseViewportHeight);
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
