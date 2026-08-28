(() => {
  const TAG_NAME = "guaurritas-embed";
  const DEFAULT_SRC = "https://guaurritas-star.github.io/guaurritas-web/";
  const ALLOWED_ORIGIN = "https://guaurritas-star.github.io";
  const BRIDGE_SOURCE = "guaurritas-web";
  const HEIGHT_MESSAGE = "guaurritas:height";
  const MIN_HEIGHT = 640;

  if (customElements.get(TAG_NAME)) return;

  class GuaurritasEmbed extends HTMLElement {
    constructor() {
      super();
      this._iframe = null;
      this._messageHandler = null;
      this._shadow = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      if (this._iframe) return;

      this.style.display = "block";
      this.style.width = "100%";
      this.style.minHeight = "100vh";
      this.style.minHeight = "100dvh";
      this.style.overflow = "visible";

      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: block;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: visible;
        }

        .guaurritas-frame-wrap {
          position: relative;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: visible;
        }

        iframe {
          display: block;
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
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
      iframe.style.height = "100dvh";

      wrapper.appendChild(iframe);
      this._shadow.append(style, wrapper);
      this._iframe = iframe;

      this._messageHandler = (event) => {
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

        const isBridgeHeightMessage =
          message?.source === BRIDGE_SOURCE && message?.type === HEIGHT_MESSAGE;
        const isLegacyResizeMessage = message?.type === "resize";

        if (!isBridgeHeightMessage && !isLegacyResizeMessage) return;

        const requestedHeight = Number(message.height);
        if (!Number.isFinite(requestedHeight)) return;

        const nextHeight = Math.max(MIN_HEIGHT, Math.ceil(requestedHeight));

        this.style.height = `${nextHeight}px`;
        wrapper.style.height = `${nextHeight}px`;
        iframe.style.height = `${nextHeight}px`;

        this.dispatchEvent(
          new CustomEvent("guaurritas-resize", {
            detail: { height: nextHeight },
            bubbles: true,
            composed: true,
          }),
        );
      };

      window.addEventListener("message", this._messageHandler);
    }

    disconnectedCallback() {
      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
      }

      this._messageHandler = null;
      this._iframe = null;
      this._shadow.replaceChildren();
    }
  }

  customElements.define(TAG_NAME, GuaurritasEmbed);
})();
