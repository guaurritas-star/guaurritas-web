(() => {
  const TAG_NAME = "guaurritas-embed";
  const DEFAULT_SRC = "https://guaurritas-star.github.io/guaurritas-web/";
  const ALLOWED_ORIGIN = "https://guaurritas-star.github.io";
  const BRIDGE_SOURCE = "guaurritas-web";
  const HEIGHT_MESSAGE = "guaurritas:height";
  const CHECKOUT_MESSAGE = "guaurritas:checkout";
  const SCROLL_LOCK_MESSAGE = "guaurritas:scroll-lock";
  const SPEI_REQUEST_MESSAGE = "guaurritas:spei-request";
  const SPEI_PROOF_UPLOAD_URL_MESSAGE = "guaurritas:spei-proof-upload-url-request";
  const SPEI_PROOF_SUBMIT_MESSAGE = "guaurritas:spei-proof-submit";
  const SPEI_RESPONSE_ATTRIBUTE = "data-spei-response";

  if (customElements.get(TAG_NAME)) return;

  class GuaurritasEmbed extends HTMLElement {
    static get observedAttributes() {
      return [SPEI_RESPONSE_ATTRIBUTE];
    }

    constructor() {
      super();
      this._iframe = null;
      this._wrapper = null;
      this._messageHandler = null;
      this._pageScrollState = null;
      this._shadow = this.attachShadow({ mode: "open" });
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name !== SPEI_RESPONSE_ATTRIBUTE || !newValue || newValue === oldValue) {
        return;
      }

      if (!this._iframe?.contentWindow) return;

      try {
        const payload = JSON.parse(newValue);
        this._iframe.contentWindow.postMessage(payload, ALLOWED_ORIGIN);
      } catch (error) {
        console.warn("[GUAURRITAS EMBED] Respuesta SPEI inválida.", error);
      }
    }

    _setPageScrollLocked(locked) {
      const html = document.documentElement;
      const body = document.body;
      if (!html || !body) return;

      if (locked && !this._pageScrollState) {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        this._pageScrollState = {
          scrollY,
          htmlStyle: html.getAttribute("style"),
          bodyStyle: body.getAttribute("style"),
        };

        html.style.setProperty("overflow", "hidden", "important");
        body.style.setProperty("overflow", "hidden", "important");
        body.style.setProperty("position", "fixed", "important");
        body.style.setProperty("top", `-${scrollY}px`, "important");
        body.style.setProperty("left", "0", "important");
        body.style.setProperty("right", "0", "important");
        body.style.setProperty("width", "100%", "important");
        return;
      }

      if (!locked && this._pageScrollState) {
        const { scrollY, htmlStyle, bodyStyle } = this._pageScrollState;
        this._pageScrollState = null;

        if (htmlStyle === null) html.removeAttribute("style");
        else html.setAttribute("style", htmlStyle);

        if (bodyStyle === null) body.removeAttribute("style");
        else body.setAttribute("style", bodyStyle);

        window.scrollTo(0, scrollY);
      }
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

        this.style.setProperty("height", cssHeight, "important");
        this.style.setProperty("min-height", cssHeight, "important");
        this.style.setProperty("max-height", cssHeight, "important");

        wrapper.style.setProperty("height", cssHeight, "important");
        wrapper.style.setProperty("min-height", cssHeight, "important");
        wrapper.style.setProperty("max-height", cssHeight, "important");

        iframe.style.setProperty("height", cssHeight, "important");
        iframe.style.setProperty("min-height", cssHeight, "important");
        iframe.style.setProperty("max-height", cssHeight, "important");

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

      const forwardCheckout = (message) => {
        if (!Array.isArray(message.items) || message.items.length === 0) return;

        this.dispatchEvent(
          new CustomEvent("guaurritas-checkout", {
            detail: {
              items: message.items,
              buyerNote:
                typeof message.buyerNote === "string" ? message.buyerNote : "",
            },
            bubbles: true,
            composed: true,
          }),
        );
      };

      const forwardSpeiEvent = (eventName, message) => {
        this.dispatchEvent(
          new CustomEvent(eventName, {
            detail: message && typeof message === "object" ? message : {},
            bubbles: true,
            composed: true,
          }),
        );
      };

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

        if (!message || typeof message !== "object") return;

        if (message.type === "resize") {
          applyHeight(message.height);
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === SCROLL_LOCK_MESSAGE
        ) {
          this._setPageScrollLocked(Boolean(message.locked));
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === CHECKOUT_MESSAGE
        ) {
          forwardCheckout(message);
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === SPEI_REQUEST_MESSAGE
        ) {
          forwardSpeiEvent("guaurritas-spei-request", message);
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === SPEI_PROOF_UPLOAD_URL_MESSAGE
        ) {
          forwardSpeiEvent("guaurritas-spei-proof-upload-url", message);
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === SPEI_PROOF_SUBMIT_MESSAGE
        ) {
          forwardSpeiEvent("guaurritas-spei-proof-submit", message);
          return;
        }

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
      this._setPageScrollLocked(false);

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
