"use client";

import { useEffect } from "react";

const BRIDGE_SOURCE = "guaurritas-web";
const HEIGHT_MESSAGE = "guaurritas:height";

function getDocumentHeight() {
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

export default function WixIframeBridge() {
  useEffect(() => {
    if (window.self === window.top) return;

    const style = document.createElement("style");
    style.id = "guaurritas-wix-iframe-layout";
    style.textContent = `
      @media (max-width: 639px) {
        html,
        body {
          height: auto !important;
          min-height: 100% !important;
          overflow: visible !important;
          overscroll-behavior: auto !important;
        }

        main.mobile-app-open {
          height: auto !important;
          min-height: 100dvh !important;
          overflow: visible !important;
        }

        .retro-window-overlay {
          position: relative !important;
          inset: auto !important;
          height: auto !important;
          min-height: 100dvh !important;
          align-items: stretch !important;
        }

        .retro-window-dialog {
          height: auto !important;
          min-height: 100dvh !important;
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

    function enviarAltura() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const height = getDocumentHeight();

        // Bridge usado por el Custom Element de Wix.
        window.parent.postMessage(
          {
            source: BRIDGE_SOURCE,
            type: HEIGHT_MESSAGE,
            height,
          },
          "*",
        );

        // Compatibilidad con el HtmlComponent / iframe clásico de Wix + Velo.
        window.parent.postMessage(
          JSON.stringify({ type: "resize", height }),
          "*",
        );
      });
    }

    const resizeObserver = new ResizeObserver(enviarAltura);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

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
    const intervalId = window.setInterval(enviarAltura, 1000);
    const delayedMeasurements = [
      window.setTimeout(enviarAltura, 100),
      window.setTimeout(enviarAltura, 400),
      window.setTimeout(enviarAltura, 1200),
    ];

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(intervalId);
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
