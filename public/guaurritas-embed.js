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
      this._viewportResizeHandler = null;
      this._desktopScrollbarStyle = null;
      this._desktopScrollbarSyncHandler = null;
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

      /*
       * La franja derecha que queda en desktop no pertenece al iframe: es el
       * track nativo del scrollbar de Chrome/Wix. No lo ocultamos (eso impide
       * al usuario arrastrarlo cuando el cursor está sobre el iframe);
       * únicamente le damos continuidad visual con el borde derecho del OS.
       */
      if (!this._desktopScrollbarStyle) {
        const desktopScrollbarStyle = document.createElement("style");
        desktopScrollbarStyle.id = "guaurritas-desktop-scrollbar-skin";
        desktopScrollbarStyle.textContent = `
          @media (min-width: 640px) {
            html.guaurritas-os-scrollbar-skin::-webkit-scrollbar-track {
              background:
                linear-gradient(
                  to bottom,
                  transparent 0 var(--guaurritas-header-start, 0px),
                  #425bbc var(--guaurritas-header-start, 0px)
                    var(--guaurritas-header-end, 0px),
                  transparent var(--guaurritas-header-end, 0px)
                    var(--guaurritas-taskbar-start, 100vh),
                  #d9a6b9 var(--guaurritas-taskbar-start, 100vh)
                    var(--guaurritas-taskbar-end, 100vh),
                  transparent var(--guaurritas-taskbar-end, 100vh) 100%
                ),
                url("https://guaurritas-star.github.io/guaurritas-web/guaurritas-desktop-wallpaper.jpeg")
                  right var(--guaurritas-os-top, 0px) /
                  100vw var(--guaurritas-os-height, 100vh) no-repeat,
                #476680 !important;
            }

            html.guaurritas-os-scrollbar-skin::-webkit-scrollbar-thumb {
              border: 2px solid transparent;
              border-radius: 999px;
              background: rgba(38, 54, 80, 0.48);
              background-clip: padding-box;
            }

            html.guaurritas-os-scrollbar-skin {
              scrollbar-color: rgba(38, 54, 80, 0.48) #7fb4e4;
            }
          }
        `;
        document.head.appendChild(desktopScrollbarStyle);
        this._desktopScrollbarStyle = desktopScrollbarStyle;
      }

      const syncDesktopScrollbarSkin = () => {
        const html = document.documentElement;
        if (!html) return;

        const isDesktop = window.matchMedia("(min-width: 640px)").matches;
        const rect = this.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight ||
          document.documentElement.clientHeight ||
          1;
        const intersectsViewport =
          rect.bottom > 0 && rect.top < viewportHeight;

        if (!isDesktop || !intersectsViewport) {
          html.classList.remove("guaurritas-os-scrollbar-skin");
          return;
        }

        const clamp = (value) =>
          Math.max(0, Math.min(viewportHeight, Math.round(value)));
        const headerStart = clamp(rect.top);
        const headerEnd = clamp(rect.top + 50);
        const taskbarStart = clamp(rect.bottom - 52);
        const taskbarEnd = clamp(rect.bottom);

        html.style.setProperty("--guaurritas-os-top", `${Math.round(rect.top)}px`);
        html.style.setProperty("--guaurritas-os-height", `${Math.max(1, Math.round(rect.height))}px`);
        html.style.setProperty("--guaurritas-header-start", `${headerStart}px`);
        html.style.setProperty("--guaurritas-header-end", `${headerEnd}px`);
        html.style.setProperty("--guaurritas-taskbar-start", `${taskbarStart}px`);
        html.style.setProperty("--guaurritas-taskbar-end", `${taskbarEnd}px`);
        html.classList.add("guaurritas-os-scrollbar-skin");
      };

      this._desktopScrollbarSyncHandler = syncDesktopScrollbarSkin;
      window.addEventListener("scroll", syncDesktopScrollbarSkin, {
        passive: true,
      });

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

      const desktopAncestorStyles = new Map();
      const desktopAncestorProperties = [
        "overflow",
        "overflow-x",
        "overflow-y",
        "contain",
        "clip-path",
      ];

      const rememberAncestorStyle = (element) => {
        if (desktopAncestorStyles.has(element)) return;

        desktopAncestorStyles.set(
          element,
          desktopAncestorProperties.map((property) => ({
            property,
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property),
          })),
        );
      };

      const restoreDesktopAncestorStyles = () => {
        for (const [element, properties] of desktopAncestorStyles) {
          if (!(element instanceof HTMLElement)) continue;

          for (const { property, value, priority } of properties) {
            if (value) {
              element.style.setProperty(property, value, priority);
            } else {
              element.style.removeProperty(property);
            }
          }
        }

        desktopAncestorStyles.clear();
      };

      this._restoreDesktopAncestorStyles = restoreDesktopAncestorStyles;

      const releaseDesktopHorizontalClipping = (
        viewportLeft,
        viewportRight,
      ) => {
        let ancestor = this.parentElement;

        while (
          ancestor instanceof HTMLElement &&
          ancestor !== document.body &&
          ancestor !== document.documentElement
        ) {
          const rect = ancestor.getBoundingClientRect();
          const computed = window.getComputedStyle(ancestor);
          const hasHorizontalInset =
            rect.left > viewportLeft + 0.5 ||
            rect.right < viewportRight - 0.5;
          const clipsHorizontal =
            computed.overflowX !== "visible" ||
            computed.overflow !== "visible" ||
            computed.contain.includes("paint") ||
            computed.clipPath !== "none";

          if (hasHorizontalInset && clipsHorizontal) {
            rememberAncestorStyle(ancestor);
            ancestor.style.setProperty("overflow", "visible", "important");
            ancestor.style.setProperty("overflow-x", "visible", "important");
            ancestor.style.setProperty("overflow-y", "visible", "important");
            ancestor.style.setProperty("contain", "none", "important");
            ancestor.style.setProperty("clip-path", "none", "important");
          }

          ancestor = ancestor.parentElement;
        }
      };

      const getDesktopViewportMetrics = () => {
        /*
         * En desktop usamos el layout viewport real del documento Wix.
         * visualViewport puede devolver un alto distinto con zoom/escalado
         * del navegador y era lo que estaba dejando la taskbar debajo del
         * borde visible.
         */
        const viewportTop = 0;
        const viewportLeft = 0;
        const viewportHeight =
          document.documentElement.clientHeight ||
          window.innerHeight ||
          1;
        const viewportWidth =
          window.innerWidth ||
          document.documentElement.clientWidth ||
          1;
        const viewportRight = viewportLeft + viewportWidth;

        /*
         * Wix mete el Custom Element dentro de wrappers que pueden recortar
         * cualquier sangrado lateral. Liberamos SOLO los ancestros que tienen
         * inset horizontal para que el OS pueda llegar realmente a ambos
         * bordes del viewport.
         */
        releaseDesktopHorizontalClipping(viewportLeft, viewportRight);

        this.style.setProperty("left", "0px", "important");
        this.style.setProperty("width", "100%", "important");

        const rect = this.getBoundingClientRect();
        const topInsideViewport = Math.max(0, rect.top - viewportTop);
        const availableHeight = Math.max(
          1,
          Math.floor(viewportHeight - topInsideViewport),
        );

        /*
         * Wix puede aplicar una escala fraccional al wrapper del Custom
         * Element. En ese caso, asignar innerWidth directamente al host se
         * renderiza unos píxeles más angosto y deja la franja derecha.
         * Medimos esa escala real y compensamos con el ancho/offset exactos.
         */
        const layoutWidth = this.offsetWidth || rect.width || 1;
        const scaleX =
          layoutWidth > 0 && rect.width > 0
            ? rect.width / layoutWidth
            : 1;
        const safeScaleX =
          Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1;
        const leftGap = rect.left - viewportLeft;

        return {
          height: availableHeight,
          width: Math.max(
            1,
            Math.ceil(viewportWidth / safeScaleX),
          ),
          left: -(leftGap / safeScaleX),
        };
      };

      const applyHeight = (height) => {
        const isDesktop = window.matchMedia("(min-width: 640px)").matches;

        if (!isDesktop) {
          restoreDesktopAncestorStyles();
          this.style.removeProperty("left");
          this.style.removeProperty("position");
        }

        const requestedHeight = Number(height);
        const desktopMetrics = isDesktop
          ? getDesktopViewportMetrics()
          : null;
        const exactHeight = desktopMetrics?.height ?? requestedHeight;

        if (!Number.isFinite(exactHeight) || exactHeight <= 0) return;

        const cssHeight = `${exactHeight}px`;
        const wixElementWrapper = this.parentElement;
        const frameOverflow = isDesktop ? "hidden" : "visible";

        if (isDesktop) {
          this.style.setProperty(
            "box-shadow",
            "0 8px 0 #476680",
            "important",
          );
        } else {
          this.style.removeProperty("box-shadow");
        }

        if (desktopMetrics) {
          this.style.setProperty(
            "width",
            `${desktopMetrics.width}px`,
            "important",
          );
          this.style.setProperty(
            "left",
            `${desktopMetrics.left}px`,
            "important",
          );
          this.style.setProperty("position", "relative", "important");
        }

        this.style.setProperty("height", cssHeight, "important");
        this.style.setProperty("min-height", cssHeight, "important");
        this.style.setProperty("max-height", cssHeight, "important");
        this.style.setProperty("overflow", frameOverflow, "important");

        wrapper.style.setProperty("height", cssHeight, "important");
        wrapper.style.setProperty("min-height", cssHeight, "important");
        wrapper.style.setProperty("max-height", cssHeight, "important");
        wrapper.style.setProperty("overflow", frameOverflow, "important");

        iframe.style.setProperty("height", cssHeight, "important");
        iframe.style.setProperty("min-height", cssHeight, "important");
        iframe.style.setProperty("max-height", cssHeight, "important");

        if (wixElementWrapper) {
          wixElementWrapper.style.setProperty("height", cssHeight, "important");
          wixElementWrapper.style.setProperty("min-height", "0px", "important");
          wixElementWrapper.style.setProperty("max-height", "none", "important");

          if (isDesktop) {
            wixElementWrapper.style.setProperty("padding", "0px", "important");
            wixElementWrapper.style.setProperty("border", "0px", "important");
            /*
             * El host puede necesitar sangrar unos px para cubrir gutters del
             * layout de Wix. No lo recortamos en el wrapper padre.
             */
            wixElementWrapper.style.setProperty("overflow", "visible", "important");
          }
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

      this._viewportResizeHandler = () => {
        if (!window.matchMedia("(min-width: 640px)").matches) {
          this._desktopScrollbarSyncHandler?.();
          return;
        }

        applyHeight(1);
        this._desktopScrollbarSyncHandler?.();
      };

      window.addEventListener("message", this._messageHandler);
      window.addEventListener("resize", this._viewportResizeHandler);
      window.visualViewport?.addEventListener(
        "resize",
        this._viewportResizeHandler,
      );
      syncDesktopScrollbarSkin();
    }

    disconnectedCallback() {
      this._setPageScrollLocked(false);

      if (typeof this._restoreDesktopAncestorStyles === "function") {
        this._restoreDesktopAncestorStyles();
      }

      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
      }

      if (this._viewportResizeHandler) {
        window.removeEventListener("resize", this._viewportResizeHandler);
        window.visualViewport?.removeEventListener(
          "resize",
          this._viewportResizeHandler,
        );
      }

      if (this._desktopScrollbarSyncHandler) {
        window.removeEventListener(
          "scroll",
          this._desktopScrollbarSyncHandler,
        );
      }

      const html = document.documentElement;
      if (html) {
        html.classList.remove("guaurritas-os-scrollbar-skin");
        [
          "--guaurritas-os-top",
          "--guaurritas-os-height",
          "--guaurritas-header-start",
          "--guaurritas-header-end",
          "--guaurritas-taskbar-start",
          "--guaurritas-taskbar-end",
        ].forEach((property) => html.style.removeProperty(property));
      }

      if (this._desktopScrollbarStyle) {
        this._desktopScrollbarStyle.remove();
      }

      this._messageHandler = null;
      this._viewportResizeHandler = null;
      this._desktopScrollbarStyle = null;
      this._desktopScrollbarSyncHandler = null;
      this._restoreDesktopAncestorStyles = null;
      this._iframe = null;
      this._wrapper = null;
      this._shadow.replaceChildren();
    }
  }

  customElements.define(TAG_NAME, GuaurritasEmbed);
})();
