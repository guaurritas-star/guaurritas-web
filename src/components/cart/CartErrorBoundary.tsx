"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

/**
 * Keeps a runtime checkout/cart failure from unmounting the entire desktop.
 * It does not swallow diagnostics: the error is still reported to the console.
 */
export default class CartErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Guaurritas OS] Cart unavailable", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <button
          type="button"
          aria-label="El carrito no está disponible. Recargar Guaurritas OS"
          onClick={() => window.location.reload()}
          className="max-w-[140px] rounded border border-[#d9a689] bg-[#fff9fb] px-2 py-2 font-interface text-[12px] leading-4 text-[#425b8c] underline"
        >
          Carrito no disponible · Recargar
        </button>
      );
    }
    return this.props.children;
  }
}
