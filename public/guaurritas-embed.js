(() => {
  const TAG_NAME = "guaurritas-embed";
  const DEFAULT_SRC = "https://guaurritas-star.github.io/guaurritas-web/";
  const ALLOWED_ORIGIN = "https://guaurritas-star.github.io";
  const BRIDGE_SOURCE = "guaurritas-web";
  const HEIGHT_MESSAGE = "guaurritas:height";

  if (customElements.get(TAG_NAME)) return;

  class GuaurritasEmbed extends HTMLElement {
    constructor() {
      super();
      this._iframe = null;
      this._wrapper = null;
      this._messageHandler = null;
      this._shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      if (this._iframe) return;

      this.style.setProperty("display", "block", "important");
      this.style.setProperty("width", "100%", "important");
      this.style.setProperty("min-height", "100dvh", "important");
      this.style.setProperty("max-height", "none", "important");
      this.style.setProperty("overflow", "visible", "important");
      this.style.setProperty("contain", "none", "important");

      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: block !important;
          width: 100% !important;
          min-height: 100dvh !important;
          max-height: none !important;
          overflow: visible !important;
          contain: none !important;
        }

        .guaurritas-frame-wrap {
          position: relative;
          display: block;
          width: 100%;
          min-height: 100dvh;
          max-height: none;
          overflow: visible;
        }

        iframe {
          display: block;
          width: 100%;
          min-height: 100dvh;
          max-height: none;
          border: 0;
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
        }
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "guaurritas-frame-wrap";

      const iframe = document.createElement("iframe");
      iframe.src = this.getAttribute("data-src") || DEFAULT_SRC;
      iframe.title = this.getAttribute("data-title") || "Guaurritas OS";
      iframe.loading = "eager";
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("allow", "clipboard-write; fullscreen; geolocation");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.setProperty("height", "100dvh", "important");

      wrapper.appendChild(iframe);
      this._shadow.append(style, wrapper);
      this._iframe = iframe;
      this._wrapper = wrapper;

      const applyHeight = (height) => {
        const exactHeight = Number(height);
        if (!Number.isFinite(exactHeight) || exactHeight <= 0) return;

        const cssHeight = `${exactHeight}px`;
        const wixElementWrapper = this.parentElement;

        // El alto que manda WixIframeBridge es la fuente de verdad.
        // Forzamos la altura en el host real de Wix y en sus hijos para
        // evitar que el breakpoint móvil conserve el alto fijo del editor.
        this.style.setProperty("height", cssHeight, "important");
        this.style.setProperty("min-height", cssHeight, "important");
        this.style.setProperty("max-height", cssHeight, "important");

        wrapper.style.setProperty("height", cssHeight, "important");
        wrapper.style.setProperty("min-height", cssHeight, "important");
        wrapper.style.setProperty("max-height", cssHeight, "important");

        iframe.style.setProperty("height", cssHeight, "important");
        iframe.style.setProperty("min-height", cssHeight, "important");
        iframe.style.setProperty("max-height", cssHeight, "important");

        // Wix envuelve el Custom Element en un contenedor propio que puede
        // conservar el min-height configurado originalmente (655 px en el
        // breakpoint móvil), aunque el iframe ya sea más corto. Ese mínimo es
        // el espacio blanco que queda entre la taskbar y la siguiente sección.
        if (wixElementWrapper) {
          wixElementWrapper.style.setProperty("height", cssHeight, "important");
          wixElementWrapper.style.setProperty("min-height", "0px", "important");
          wixElementWrapper.style.setProperty("max-height", "none", "important");
        }

        this.setAttribute("data-content-height", String(exactHeight));

        this.dispatchEvent(
          new CustomEvent("guaurritas-resize", {
            detail: { height: exactHeight },
            bubbles: true,
            composed: true,
          }),
        );
      };

      this._messageHandler = (event) => {
        // Solo aceptamos mensajes provenientes del iframe real de Guaurritas.
        if (event.origin !== ALLOWED_ORIGIN) return;
        if (event.source !== iframe.contentWindow) return;

        let message = event.data;

        if (typeof message === "string") {
          try {
            message = JSON.parse(message);
          } catch {
            return;
          }
        }

        if (!message || typeof message !== "object") return;

        // WixIframeBridge.tsx envía este mensaje dinámico en cada cambio de
        // contenido, viewport y orientación:
        // JSON.stringify({ type: "resize", height })
        if (message.type === "resize") {
          applyHeight(message.height);
          return;
        }

        // Conservamos el canal moderno como respaldo, pero con la misma
        // validación estricta de origen y ventana emisora.
        if (
          message.source === BRIDGE_SOURCE &&
          message.type === HEIGHT_MESSAGE
        ) {
          applyHeight(message.height);
        }
      };

      window.addEventListener("message", this._messageHandler);
    }

    disconnectedCallback() {
      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
      }

      this._messageHandler = null;
      this._iframe = null;
      this._wrapper = null;
      this._shadow.replaceChildren();
    }
  }

  customElements.define(TAG_NAME, GuaurritasEmbed);
})();
