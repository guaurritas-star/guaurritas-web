(() => {
  const TAG_NAME = "guaurritas-embed";
  const DEFAULT_SRC = "https://guaurritas-star.github.io/guaurritas-web/";
  const ALLOWED_ORIGIN = "https://guaurritas-star.github.io";
  const BRIDGE_SOURCE = "guaurritas-web";
  const HEIGHT_MESSAGE = "guaurritas:height";
  const READY_MESSAGE = "guaurritas:ready";
  const CHECKOUT_MESSAGE = "guaurritas:checkout";
  const SCROLL_LOCK_MESSAGE = "guaurritas:scroll-lock";
  const CUISINE_UI_MESSAGE = "guaurritas:cuisine-ui";
  const CUISINE_COMMAND_MESSAGE = "guaurritas:cuisine-command";
  const EMBED_SOURCE = "guaurritas-embed";
  const SPEI_REQUEST_MESSAGE = "guaurritas:spei-request";
  const SPEI_PROOF_UPLOAD_URL_MESSAGE = "guaurritas:spei-proof-upload-url-request";
  const SPEI_PROOF_SUBMIT_MESSAGE = "guaurritas:spei-proof-submit";
  const SPEI_RESPONSE_ATTRIBUTE = "data-spei-response";
  const MEMBER_STATE_ATTRIBUTE = "data-member-state";
  const MEMBER_STATE_MESSAGE = "guaurritas:member-state";
  const MEMBER_LOGIN_REQUEST_MESSAGE = "guaurritas:member-login-request";
  const MEMBER_LOGOUT_REQUEST_MESSAGE = "guaurritas:member-logout-request";
  const MEMBER_STATE_REQUEST_MESSAGE = "guaurritas:member-state-request";
  const PURCHASE_HISTORY_RESPONSE_ATTRIBUTE =
    "data-purchase-history-response";
  const PURCHASE_HISTORY_REQUEST_MESSAGE =
    "guaurritas:purchase-history-request";
  const PURCHASE_HISTORY_MESSAGE = "guaurritas:purchase-history";
  const GUAURRINOTAS_SESSION_RESPONSE_ATTRIBUTE =
    "data-guaurrinotas-session-response";
  const GUAURRINOTAS_SESSION_REQUEST_MESSAGE =
    "guaurritas:guaurrinotas-session-request";
  const GUAURRINOTAS_SESSION_MESSAGE = "guaurritas:guaurrinotas-session";

  if (customElements.get(TAG_NAME)) return;

  class GuaurritasEmbed extends HTMLElement {
    static get observedAttributes() {
      return [
        SPEI_RESPONSE_ATTRIBUTE,
        MEMBER_STATE_ATTRIBUTE,
        PURCHASE_HISTORY_RESPONSE_ATTRIBUTE,
        GUAURRINOTAS_SESSION_RESPONSE_ATTRIBUTE,
      ];
    }

    constructor() {
      super();
      this._iframe = null;
      this._wrapper = null;
      this._messageHandler = null;
      this._viewportResizeHandler = null;
      this._mobileCuisineStickyHandler = null;
      this._mobileCuisineStickyFrame = 0;
      this._mobileCuisineActive = false;
      this._mobileCuisineBackTarget = "guaurriverse";
      this._desktopOverflowStyle = null;
      this._pageScrollState = null;
      this._purchaseHistoryPayload = null;
      this._loadingTimers = [];
      this._shadow = this.attachShadow({ mode: "open" });
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (!newValue || newValue === oldValue) return;

      if (name === MEMBER_STATE_ATTRIBUTE) {
        this._forwardMemberState(newValue);
        return;
      }

      if (name === PURCHASE_HISTORY_RESPONSE_ATTRIBUTE) {
        if (!this._iframe?.contentWindow) return;

        try {
          const payload = JSON.parse(newValue);
          this._purchaseHistoryPayload = payload;
          this._iframe.contentWindow.postMessage(
            {
              ...payload,
              source: EMBED_SOURCE,
              type: PURCHASE_HISTORY_MESSAGE,
            },
            ALLOWED_ORIGIN,
          );
          this.removeAttribute(PURCHASE_HISTORY_RESPONSE_ATTRIBUTE);
        } catch (error) {
          console.warn(
            "[GUAURRITAS EMBED] Respuesta de historial inválida.",
            error,
          );
        }
        return;
      }

      if (name === GUAURRINOTAS_SESSION_RESPONSE_ATTRIBUTE) {
        if (!this._iframe?.contentWindow) return;

        try {
          const payload = JSON.parse(newValue);
          this._iframe.contentWindow.postMessage(
            {
              source: EMBED_SOURCE,
              type: GUAURRINOTAS_SESSION_MESSAGE,
              ...payload,
            },
            ALLOWED_ORIGIN,
          );
          this.removeAttribute(GUAURRINOTAS_SESSION_RESPONSE_ATTRIBUTE);
        } catch (error) {
          console.warn(
            "[GUAURRITAS EMBED] Respuesta de sesión Guaurrinotas inválida.",
            error,
          );
        }
        return;
      }

      if (name !== SPEI_RESPONSE_ATTRIBUTE) return;
      if (!this._iframe?.contentWindow) return;

      try {
        const payload = JSON.parse(newValue);
        this._iframe.contentWindow.postMessage(payload, ALLOWED_ORIGIN);
      } catch (error) {
        console.warn("[GUAURRITAS EMBED] Respuesta SPEI inválida.", error);
      }
    }

    _forwardMemberState(serialized = this.getAttribute(MEMBER_STATE_ATTRIBUTE)) {
      if (!serialized || !this._iframe?.contentWindow) return;

      try {
        const state = JSON.parse(serialized);

        if (!state?.loggedIn) {
          this._purchaseHistoryPayload = null;
        }

        this._iframe.contentWindow.postMessage(
          {
            source: EMBED_SOURCE,
            type: MEMBER_STATE_MESSAGE,
            loggedIn: Boolean(state?.loggedIn),
            name: typeof state?.name === "string" ? state.name : "",
            photoUrl:
              typeof state?.photoUrl === "string" ? state.photoUrl : "",
          },
          ALLOWED_ORIGIN,
        );
      } catch (error) {
        console.warn("[GUAURRITAS EMBED] Estado de miembro inválido.", error);
      }
    }

    _setPageScrollLocked(locked) {
      if (locked && !this._pageScrollState) {
        /*
         * Keep Wix exactly where it is visually. On mobile the checkout panel
         * scrolls inside the iframe, so blocking parent touch/wheel gestures is
         * enough to stop the background without changing overflow, position,
         * scrollTop or layout on the Wix page.
         */
        const preventParentScroll = (event) => {
          event.preventDefault();
        };

        document.addEventListener("touchmove", preventParentScroll, {
          passive: false,
          capture: true,
        });
        document.addEventListener("wheel", preventParentScroll, {
          passive: false,
          capture: true,
        });

        this._pageScrollState = { preventParentScroll };
        return;
      }

      if (!locked && this._pageScrollState) {
        const { preventParentScroll } = this._pageScrollState;
        this._pageScrollState = null;

        document.removeEventListener("touchmove", preventParentScroll, {
          capture: true,
        });
        document.removeEventListener("wheel", preventParentScroll, {
          capture: true,
        });
      }
    }

    connectedCallback() {
      if (this._iframe) return;

      /*
       * Desktop: nunca permitimos scroll horizontal de la página Wix.
       * Esto NO toca overflow-y, así que el scroll vertical sigue funcionando.
       */
      if (!this._desktopOverflowStyle) {
        const desktopOverflowStyle = document.createElement("style");
        desktopOverflowStyle.id = "guaurritas-desktop-overflow-x-fix";
        desktopOverflowStyle.textContent = `
          @media (min-width: 640px) {
            html,
            body {
              overflow-x: hidden !important;
            }
          }
        `;
        document.head.appendChild(desktopOverflowStyle);
        this._desktopOverflowStyle = desktopOverflowStyle;
      }

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

        @media (min-width: 640px) {
          :host {
            width: var(--guaurritas-desktop-width, 100%) !important;
            flex-shrink: 0 !important;
            height: var(--guaurritas-desktop-height, 100dvh) !important;
            min-height: var(--guaurritas-desktop-height, 100dvh) !important;
            max-height: var(--guaurritas-desktop-height, 100dvh) !important;
          }
        }

        .guaurritas-frame-wrap {
          position: relative;
          display: block;
          width: 100%;
          min-height: 100dvh;
          max-height: none;
          overflow: visible;
        }

        .guaurritas-boot-screen {
          position: absolute;
          inset: 0;
          z-index: 2147483600;
          display: grid;
          min-height: 100dvh;
          place-items: center;
          box-sizing: border-box;
          padding: 22px;
          background:
            radial-gradient(circle at 18% 16%, rgba(255,255,255,.72), transparent 28%),
            linear-gradient(145deg, #eef4ff 0%, #fffaf6 48%, #f5dce4 100%);
          opacity: 1;
          visibility: visible;
          transition: opacity 240ms ease, visibility 240ms ease;
        }

        .guaurritas-boot-screen.is-complete {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .guaurritas-boot-window {
          width: min(430px, calc(100vw - 42px));
          border: 2px solid #213d82;
          background: #f7f7f5;
          box-shadow: 7px 8px 0 rgba(54, 72, 122, .22);
          color: #17264c;
        }

        .guaurritas-boot-titlebar {
          padding: 10px 14px;
          border-bottom: 2px solid #213d82;
          background: linear-gradient(180deg, #4d69c7 0%, #29459f 100%);
          color: white;
          font: 700 15px/1.2 Georgia, "Times New Roman", serif;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .guaurritas-boot-body {
          display: grid;
          justify-items: center;
          gap: 16px;
          padding: 28px 24px 24px;
          text-align: center;
        }

        .guaurritas-boot-logo {
          width: 112px;
          height: 112px;
          object-fit: contain;
        }

        .guaurritas-boot-copy {
          margin: 0;
          font: 700 18px/1.35 "Courier New", monospace;
        }

        .guaurritas-boot-progress-row {
          display: grid;
          width: 100%;
          grid-template-columns: minmax(0, 1fr) 48px;
          align-items: center;
          gap: 10px;
        }

        .guaurritas-boot-track {
          height: 24px;
          padding: 3px;
          border: 2px inset #b9bfd0;
          background: #e8e8e8;
          box-sizing: border-box;
        }

        .guaurritas-boot-progress {
          display: block;
          width: 4%;
          height: 100%;
          background: linear-gradient(90deg, #174bc5, #2779ee);
          transition: width 180ms ease-out;
        }

        .guaurritas-boot-percent {
          font: 700 16px/1 "Courier New", monospace;
          text-align: right;
        }

        @media (max-width: 639px) {
          .guaurritas-boot-window {
            width: min(360px, calc(100vw - 32px));
          }

          .guaurritas-boot-body {
            padding: 24px 18px 22px;
          }

          .guaurritas-boot-logo {
            width: 96px;
            height: 96px;
          }

          .guaurritas-boot-copy {
            font-size: 16px;
          }
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

        .guaurritas-mobile-cuisine-sticky {
          display: none;
        }

        @media (max-width: 639px) {
          .guaurritas-mobile-cuisine-sticky {
            position: sticky;
            top: 0;
            z-index: 2147483000;
            display: flex;
            height: 58px;
            margin-bottom: -58px;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 12px;
            box-sizing: border-box;
            border-bottom: 1px solid #b9c8d8;
            background: rgba(238, 245, 247, 0.98);
            box-shadow:
              0 1px 0 rgba(66, 91, 140, 0.18),
              0 6px 16px rgba(66, 91, 140, 0.12);
            opacity: 0;
            pointer-events: none;
            transform: translateY(-10px);
            transition:
              opacity 160ms ease,
              transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
          }

          .guaurritas-mobile-cuisine-sticky.is-visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }

          .guaurritas-mobile-cuisine-back {
            border: 0;
            background: transparent;
            color: #425b8c;
            font: 700 10px/1.2 Arial, sans-serif;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .guaurritas-mobile-cuisine-cart {
            display: inline-flex;
            min-height: 40px;
            align-items: center;
            gap: 7px;
            padding: 6px 12px;
            border: 1px solid #8ba9b5;
            border-radius: 999px;
            background: #fff;
            color: #263650;
            box-shadow:
              1px 1px 0 rgba(66, 91, 140, 0.12),
              0 4px 10px rgba(66, 91, 140, 0.08);
            font: 700 10px/1 Arial, sans-serif;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            transition:
              transform 120ms ease,
              background-color 120ms ease,
              border-color 120ms ease;
          }

          .guaurritas-mobile-cuisine-cart.is-opening {
            border-color: #a66d88;
            background: #fff3f7;
            transform: scale(0.94);
          }

          .guaurritas-mobile-cuisine-cart-icon {
            display: block;
            width: 32px;
            height: 32px;
            flex: 0 0 32px;
            object-fit: contain;
          }
        }
      `;

      const wrapper = document.createElement("div");
      wrapper.className = "guaurritas-frame-wrap";

      const bootScreen = document.createElement("div");
      bootScreen.className = "guaurritas-boot-screen";
      bootScreen.setAttribute("role", "status");
      bootScreen.setAttribute("aria-live", "polite");
      bootScreen.setAttribute("aria-label", "Cargando Guaurritas");
      bootScreen.innerHTML = `
        <div class="guaurritas-boot-window">
          <div class="guaurritas-boot-titlebar">Guaurritas.exe</div>
          <div class="guaurritas-boot-body">
            <img class="guaurritas-boot-logo" alt="" aria-hidden="true">
            <p class="guaurritas-boot-copy">Iniciando Guaurriverse…</p>
            <div class="guaurritas-boot-progress-row">
              <div class="guaurritas-boot-track"><span class="guaurritas-boot-progress"></span></div>
              <span class="guaurritas-boot-percent">4%</span>
            </div>
          </div>
        </div>`;

      const bootLogo = bootScreen.querySelector(".guaurritas-boot-logo");
      const bootProgress = bootScreen.querySelector(".guaurritas-boot-progress");
      const bootPercent = bootScreen.querySelector(".guaurritas-boot-percent");
      bootLogo.src = new URL(
        "icons/desktop/guaurritas-mascot-hd.webp",
        this.getAttribute("data-src") || DEFAULT_SRC,
      ).href;

      const loadingStartedAt = performance.now();
      let storedEstimate = NaN;
      try {
        storedEstimate = Number(
          window.localStorage.getItem("guaurritas-load-estimate-ms"),
        );
      } catch {}
      const loadingEstimate = Number.isFinite(storedEstimate)
        ? Math.min(6000, Math.max(900, storedEstimate))
        : 2200;
      let loadingComplete = false;

      const setLoadingProgress = (value) => {
        const safeValue = Math.max(4, Math.min(100, Math.round(value)));
        bootProgress.style.width = `${safeValue}%`;
        bootPercent.textContent = `${safeValue}%`;
      };

      const progressTimer = window.setInterval(() => {
        const elapsed = performance.now() - loadingStartedAt;
        const projected = 4 + 88 * (1 - Math.exp(-elapsed / loadingEstimate));
        setLoadingProgress(Math.min(92, projected));
      }, 120);
      this._loadingTimers.push(progressTimer);

      const finishLoading = () => {
        if (loadingComplete) return;
        loadingComplete = true;
        window.clearInterval(progressTimer);
        const elapsed = performance.now() - loadingStartedAt;
        const previousEstimate = Number.isFinite(storedEstimate)
          ? storedEstimate
          : elapsed;
        const nextEstimate = Math.round(previousEstimate * 0.65 + elapsed * 0.35);
        try {
          window.localStorage.setItem(
            "guaurritas-load-estimate-ms",
            String(Math.min(6000, Math.max(900, nextEstimate))),
          );
        } catch {}
        setLoadingProgress(100);
        const hideTimer = window.setTimeout(() => {
          bootScreen.classList.add("is-complete");
          bootScreen.setAttribute("aria-hidden", "true");
        }, 220);
        this._loadingTimers.push(hideTimer);
      };

      const mobileCuisineSticky = document.createElement("div");
      mobileCuisineSticky.className = "guaurritas-mobile-cuisine-sticky";
      mobileCuisineSticky.setAttribute("aria-hidden", "true");

      const mobileCuisineBack = document.createElement("button");
      mobileCuisineBack.type = "button";
      mobileCuisineBack.className = "guaurritas-mobile-cuisine-back";
      mobileCuisineBack.textContent = "← Guaurriverse";

      const mobileCuisineCart = document.createElement("button");
      mobileCuisineCart.type = "button";
      mobileCuisineCart.className = "guaurritas-mobile-cuisine-cart";

      const mobileCuisineCartIcon = document.createElement("img");
      mobileCuisineCartIcon.className = "guaurritas-mobile-cuisine-cart-icon";
      mobileCuisineCartIcon.alt = "";
      mobileCuisineCartIcon.setAttribute("aria-hidden", "true");
      mobileCuisineCartIcon.src = new URL(
        "icons/desktop/taskbar-cart.webp",
        this.getAttribute("data-src") || DEFAULT_SRC,
      ).href;

      const mobileCuisineCartText = document.createElement("span");
      mobileCuisineCartText.textContent = "Carrito · 0";

      mobileCuisineCart.append(
        mobileCuisineCartIcon,
        mobileCuisineCartText,
      );
      mobileCuisineSticky.append(
        mobileCuisineBack,
        mobileCuisineCart,
      );

      const iframe = document.createElement("iframe");
      const iframeSrc = new URL(
        this.getAttribute("data-src") || DEFAULT_SRC,
        window.location.href,
      );
      const requestedApp = new URLSearchParams(window.location.search).get("app");

      const supportedApps = new Set([
        "mundos",
        "mascota",
        "paint",
        "notas",
        "robbie",
        "chat",
        "distribuidores",
      ]);
      if (requestedApp && supportedApps.has(requestedApp)) {
        iframeSrc.searchParams.set("app", requestedApp);
      }

      const requestedWorld = new URLSearchParams(window.location.search).get(
        "world",
      );
      if (requestedWorld === "cuisine") {
        iframeSrc.searchParams.set("world", "cuisine");
      }

      const requestedFulfillment = new URLSearchParams(
        window.location.search,
      ).get("fulfillment");
      if (requestedFulfillment === "national") {
        iframeSrc.searchParams.set("fulfillment", "national");
      }

      const requestedProduct = new URLSearchParams(window.location.search).get(
        "product",
      );
      if (
        requestedProduct === "guaurricookies" ||
        requestedProduct === "happy-bag"
      ) {
        iframeSrc.searchParams.set("product", requestedProduct);
      }

      iframe.src = iframeSrc.href;
      iframe.title = this.getAttribute("data-title") || "Guaurritas OS";
      iframe.loading = "eager";
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("allow", "clipboard-write; fullscreen; geolocation");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.setProperty("height", "100dvh", "important");

      wrapper.appendChild(iframe);
      wrapper.append(bootScreen);
      this._shadow.append(style, mobileCuisineSticky, wrapper);
      this._iframe = iframe;
      this._wrapper = wrapper;

      iframe.addEventListener("load", () => {
        this._forwardMemberState();
      });

      const loadingFallback = window.setTimeout(finishLoading, 10000);
      this._loadingTimers.push(loadingFallback);

      let cuisineReturnPosition = null;

      const sendCuisineCommand = (action) => {
        if (!iframe.contentWindow) return;

        iframe.contentWindow.postMessage(
          {
            source: EMBED_SOURCE,
            type: CUISINE_COMMAND_MESSAGE,
            action,

          },
          ALLOWED_ORIGIN,
        );
      };

      mobileCuisineBack.addEventListener("click", () => {
        sendCuisineCommand("back");
      });

      mobileCuisineCart.addEventListener("click", () => {
        if (mobileCuisineCart.classList.contains("is-opening")) return;

        mobileCuisineCart.classList.add("is-opening");
        mobileCuisineCartText.textContent = "Abriendo…";

        sendCuisineCommand("open-cart");

        window.setTimeout(() => {
          mobileCuisineCart.classList.remove("is-opening");
          mobileCuisineCartText.textContent =
            `Carrito · ${mobileCuisineCart.dataset.count || "0"}`;
        }, 520);
      });

      const syncMobileCuisineSticky = () => {
        if (this._mobileCuisineStickyFrame) {
          window.cancelAnimationFrame(this._mobileCuisineStickyFrame);
        }

        this._mobileCuisineStickyFrame = window.requestAnimationFrame(() => {
          this._mobileCuisineStickyFrame = 0;

          if (
            !window.matchMedia("(max-width: 639px)").matches ||
            !this._mobileCuisineActive
          ) {
            mobileCuisineSticky.classList.remove("is-visible");
            mobileCuisineSticky.setAttribute("aria-hidden", "true");
            return;
          }

          const rect = this.getBoundingClientRect();
          const scrolledIntoEmbed = Math.max(0, -rect.top);
          const shouldShow =
            scrolledIntoEmbed > 112 &&
            rect.bottom > 72;

          mobileCuisineSticky.classList.toggle("is-visible", shouldShow);
          mobileCuisineSticky.setAttribute(
            "aria-hidden",
            shouldShow ? "false" : "true",
          );
        });
      };

      this._mobileCuisineStickyHandler = syncMobileCuisineSticky;
      window.addEventListener("scroll", syncMobileCuisineSticky, {
        passive: true,
      });
      window.visualViewport?.addEventListener(
        "scroll",
        syncMobileCuisineSticky,
        { passive: true },
      );

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
        const sectionRect = this.closest("section")?.getBoundingClientRect();
        const viewportLeft = sectionRect?.left ?? 0;
        const viewportHeight =
          document.documentElement.clientHeight ||
          window.innerHeight ||
          1;
        const viewportWidth =
          sectionRect?.width ||
          document.body.clientWidth ||
          document.documentElement.clientWidth ||
          window.innerWidth ||
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
        // Medir dentro de la sección mantiene el alto estable al hacer scroll.
        // El iframe debe terminar antes de Gallery, incluso con un inset superior.
        const sectionAvailableHeight = sectionRect
          ? sectionRect.bottom - rect.top
          : viewportHeight - Math.max(0, rect.top);
        const availableHeight = Math.max(
          1,
          Math.floor(Math.min(viewportHeight, sectionAvailableHeight)),
        );

        /*
         * Usamos los límites reales de la sección Wix: su ancho útil ya
         * excluye el scrollbar del body. No agregamos sangrado lateral.
         */
        const leftGap = rect.left - viewportLeft;

        return {
          height: availableHeight,
          width: Math.max(1, viewportWidth),
          left: -leftGap,
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

        if (desktopMetrics) {
          this.style.setProperty("--guaurritas-desktop-height", cssHeight);
          // :host !important prevalece sobre width inline; compartir el ancho
          // mediante una variable consumida solo por la regla desktop.
          this.style.setProperty(
            "--guaurritas-desktop-width",
            `${desktopMetrics.width}px`,
          );
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

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === READY_MESSAGE
        ) {
          finishLoading();
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === MEMBER_LOGIN_REQUEST_MESSAGE
        ) {
          this.dispatchEvent(
            new CustomEvent("guaurritas-member-login", {
              detail: {},
              bubbles: true,
              composed: true,
            }),
          );
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === MEMBER_LOGOUT_REQUEST_MESSAGE
        ) {
          this.dispatchEvent(
            new CustomEvent("guaurritas-member-logout", {
              detail: {},
              bubbles: true,
              composed: true,
            }),
          );
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === MEMBER_STATE_REQUEST_MESSAGE
        ) {
          this._forwardMemberState();

          this.dispatchEvent(
            new CustomEvent("guaurritas-member-state-request", {
              detail: {},
              bubbles: true,
              composed: true,
            }),
          );
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === PURCHASE_HISTORY_REQUEST_MESSAGE
        ) {
          if (this._purchaseHistoryPayload) {
            iframe.contentWindow.postMessage(
              {
                ...this._purchaseHistoryPayload,
                source: EMBED_SOURCE,
                type: PURCHASE_HISTORY_MESSAGE,
              },
              ALLOWED_ORIGIN,
            );
            return;
          }

          this.dispatchEvent(
            new CustomEvent("guaurritas-member-state-request", {
              detail: {
                includePurchaseHistory: true,
                requestId: Number.isFinite(message.requestId)
                  ? message.requestId
                  : null,
              },
              bubbles: true,
              composed: true,
            }),
          );
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === GUAURRINOTAS_SESSION_REQUEST_MESSAGE
        ) {
          this.dispatchEvent(
            new CustomEvent("guaurritas-guaurrinotas-session-request", {
              detail: {},
              bubbles: true,
              composed: true,
            }),
          );
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === "guaurritas:cuisine-navigation" &&
          message.action === "reveal-product" &&
          Number.isFinite(message.top) &&
          window.matchMedia("(max-width: 639px)").matches
        ) {
          let scroller = this.parentElement;
          while (scroller) {
            const css = window.getComputedStyle(scroller);
            if (
              /(auto|scroll)/.test(css.overflowY) &&
              scroller.scrollHeight > scroller.clientHeight
            ) {
              break;
            }
            scroller = scroller.parentElement;
          }

          const rootScroller =
            document.scrollingElement || document.documentElement;
          scroller = scroller || rootScroller;

          const isRootScroller =
            scroller === rootScroller ||
            scroller === document.documentElement ||
            scroller === document.body;

          const currentTop = isRootScroller
            ? window.scrollY || rootScroller.scrollTop || 0
            : scroller.scrollTop;
          const currentLeft = isRootScroller
            ? window.scrollX || rootScroller.scrollLeft || 0
            : scroller.scrollLeft;
          const iframeTop = iframe.getBoundingClientRect().top;
          const inset = Math.max(
            68,
            mobileCuisineSticky.getBoundingClientRect().height + 10,
          );

          if (isRootScroller) {
            window.scrollTo({
              top: Math.max(
                0,
                currentTop + iframeTop + message.top - inset,
              ),
              left: currentLeft,
              behavior: "auto",
            });
          } else {
            const scrollerTop = scroller.getBoundingClientRect().top;

            scroller.scrollTo({
              top: Math.max(
                0,
                currentTop +
                  iframeTop +
                  message.top -
                  scrollerTop -
                  inset,
              ),
              left: currentLeft,
              behavior: "auto",
            });
          }
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === "guaurritas:cart-navigation" &&
          window.matchMedia("(max-width: 639px)").matches
        ) {
          if (message.action === "return") {
            const saved = cuisineReturnPosition;
            cuisineReturnPosition = null;

            if (saved) {
              if (saved.root) {
                window.scrollTo({
                  top: saved.top,
                  left: saved.left,
                  behavior: "auto",
                });
              } else {
                saved.element.scrollTo({
                  top: saved.top,
                  left: saved.left,
                  behavior: "auto",
                });
              }
            }
            return;
          }
          if (message.action !== "reveal" || !Number.isFinite(message.top)) return;

          // Scroll the real Wix scroll container, never the Custom Element.
          // The cart sends its top INSIDE the iframe; here we translate that
          // to the coordinate system of whichever Wix element actually scrolls.
          let scroller = this.parentElement;
          while (scroller) {
            const css = window.getComputedStyle(scroller);
            if (
              /(auto|scroll)/.test(css.overflowY) &&
              scroller.scrollHeight > scroller.clientHeight
            ) {
              break;
            }
            scroller = scroller.parentElement;
          }

          const rootScroller =
            document.scrollingElement || document.documentElement;
          scroller = scroller || rootScroller;

          const isRootScroller =
            scroller === rootScroller ||
            scroller === document.documentElement ||
            scroller === document.body;

          const currentTop = isRootScroller
            ? window.scrollY || rootScroller.scrollTop || 0
            : scroller.scrollTop;
          const currentLeft = isRootScroller
            ? window.scrollX || rootScroller.scrollLeft || 0
            : scroller.scrollLeft;

          if (!cuisineReturnPosition) {
            cuisineReturnPosition = {
              element: scroller,
              root: isRootScroller,
              top: currentTop,
              left: currentLeft,
            };
          }

          const inset = Math.max(
            68,
            mobileCuisineSticky.getBoundingClientRect().height + 10,
          );
          const iframeTop = iframe.getBoundingClientRect().top;
          const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;

          if (isRootScroller) {
            const target =
              currentTop + iframeTop + message.top - inset;

            window.scrollTo({
              top: Math.max(0, target),
              left: currentLeft,
              behavior: prefersReducedMotion ? "auto" : "smooth",
            });
          } else {
            const scrollerTop = scroller.getBoundingClientRect().top;
            const target =
              currentTop +
              iframeTop +
              message.top -
              scrollerTop -
              inset;

            scroller.scrollTo({
              top: Math.max(0, target),
              left: currentLeft,
              behavior: prefersReducedMotion ? "auto" : "smooth",
            });
          }
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === "guaurritas:cuisine-cart-request" &&
          window.matchMedia("(max-width: 639px)").matches
        ) {
          sendCuisineCommand("open-cart");
          return;
        }

        if (
          message.source === BRIDGE_SOURCE &&
          message.type === CUISINE_UI_MESSAGE
        ) {
          this._mobileCuisineActive = Boolean(message.active);
          this._mobileCuisineBackTarget =
            message.backTarget === "catalog"
              ? "catalog"
              : "guaurriverse";

          const count = Math.max(0, Number(message.count) || 0);
          mobileCuisineCart.dataset.count = String(count);
          mobileCuisineCartText.textContent = `Carrito · ${count}`;
          mobileCuisineBack.textContent =
            typeof message.backLabel === "string" && message.backLabel
              ? message.backLabel
              : this._mobileCuisineBackTarget === "catalog"
                ? "← Volver al catálogo"
                : "← Guaurriverse";

          this._mobileCuisineStickyHandler?.();
          return;
        }

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
        this._mobileCuisineStickyHandler?.();

        if (!window.matchMedia("(min-width: 640px)").matches) return;
        applyHeight(1);
      };

      window.addEventListener("message", this._messageHandler);
      window.addEventListener("resize", this._viewportResizeHandler);
      window.visualViewport?.addEventListener(
        "resize",
        this._viewportResizeHandler,
      );
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

      if (this._mobileCuisineStickyHandler) {
        window.removeEventListener(
          "scroll",
          this._mobileCuisineStickyHandler,
        );
        window.visualViewport?.removeEventListener(
          "scroll",
          this._mobileCuisineStickyHandler,
        );
      }

      if (this._mobileCuisineStickyFrame) {
        window.cancelAnimationFrame(this._mobileCuisineStickyFrame);
      }

      if (this._desktopOverflowStyle) {
        this._desktopOverflowStyle.remove();
      }

      this._loadingTimers.forEach((timer) => {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      });
      this._loadingTimers = [];

      this._messageHandler = null;
      this._viewportResizeHandler = null;
      this._mobileCuisineStickyHandler = null;
      this._mobileCuisineStickyFrame = 0;
      this._mobileCuisineActive = false;
      this._mobileCuisineBackTarget = "guaurriverse";
      this._desktopOverflowStyle = null;
      this._restoreDesktopAncestorStyles = null;
      this._iframe = null;
      this._wrapper = null;
      this._shadow.replaceChildren();
    }
  }

  customElements.define(TAG_NAME, GuaurritasEmbed);
})();
