(() => {
  const TAG_NAME = "guaurritas-embed";
  const DEFAULT_SRC = "https://guaurritas-star.github.io/guaurritas-web/";
  const ALLOWED_ORIGIN = "https://guaurritas-star.github.io";
  const BRIDGE_SOURCE = "guaurritas-web";
  const HEIGHT_MESSAGE = "guaurritas:height";

  if (customElements.get(TAG_NAME)) return;

  class GuaurritasEmbed extends HTMLElement {
    connectedCallback() {
      if (this.dataset.guaurritasMounted === "true") return;
      this.dataset.guaurritasMounted = "true";

      this.style.display = "block";
      this.style.width = "100%";
      this.style.minHeight = "100dvh";
      this.style.overflow = "visible";

      const iframe = document.createElement("iframe");
      iframe.src = this.getAttribute("data-src") || DEFAULT_SRC;
      iframe.title = this.getAttribute("data-title") || "Guaurritas";
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("allow", "clipboard-write; fullscreen");
      iframe.style.display = "block";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.minHeight = "100dvh";
      iframe.style.border = "0";
      iframe.style.overflow = "hidden";

      this.appendChild(iframe);
      this._guaurritasIframe = iframe;

      this._guaurritasMessageHandler = (event) => {
        if (event.origin !== ALLOWED_ORIGIN) return;
        if (event.source !== iframe.contentWindow) return;

        const message = event.data;
        if (
          !message ||
          message.source !== BRIDGE_SOURCE ||
          message.type !== HEIGHT_MESSAGE
        ) {
          return;
        }

        const requestedHeight = Number(message.height);
        if (!Number.isFinite(requestedHeight) || requestedHeight < 320) return;

        const nextHeight = Math.ceil(requestedHeight);
        this.style.height = `${nextHeight}px`;
        iframe.style.height = `${nextHeight}px`;
      };

      window.addEventListener("message", this._guaurritasMessageHandler);
    }

    disconnectedCallback() {
      if (this._guaurritasMessageHandler) {
        window.removeEventListener("message", this._guaurritasMessageHandler);
      }

      this._guaurritasMessageHandler = null;
      this._guaurritasIframe = null;
      delete this.dataset.guaurritasMounted;
    }
  }

  customElements.define(TAG_NAME, GuaurritasEmbed);
})();
