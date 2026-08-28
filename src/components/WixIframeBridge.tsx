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

    const sendHeight = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        window.parent.postMessage(
          {
            source: BRIDGE_SOURCE,
            type: HEIGHT_MESSAGE,
            height: getDocumentHeight(),
          },
          "*",
        );
      });
    };

    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(sendHeight);
    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });

    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);
    window.addEventListener("orientationchange", sendHeight);

    sendHeight();
    const delayedMeasurements = [
      window.setTimeout(sendHeight, 100),
      window.setTimeout(sendHeight, 400),
      window.setTimeout(sendHeight, 1200),
    ];

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      delayedMeasurements.forEach(window.clearTimeout);
      window.removeEventListener("load", sendHeight);
      window.removeEventListener("resize", sendHeight);
      window.removeEventListener("orientationchange", sendHeight);
      style.remove();
    };
  }, []);

  return null;
}
