"use client";

import { useEffect, useRef } from "react";
import CuisineStoreApp from "@/components/apps/CuisineStoreApp";

const NATIONAL_PRODUCT_NAMES = [
  "Guaurricookies",
  "Happy Bag",
  "Sazonadores",
  "GuaurriSticks",
  "Happy Box",
  "B’day gorrito",
  "Velitas",
  "Pancarta",
] as const;

const HIDDEN_CATEGORY_LABELS = new Set([
  "Petcakes",
  "Repostería pet",
  "Antojería pet",
]);

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Envío nacional reutiliza EXACTAMENTE la misma experiencia de Cuisine León.
 * No existe un segundo diseño ni un segundo configurador: renderizamos el mismo
 * componente y únicamente ocultamos las cards que todavía son solo de entrega local.
 *
 * Esto garantiza que imágenes, tamaños, cards, detalle, GuaurriCookies, hover,
 * selectores y futuras mejoras visuales permanezcan sincronizadas con León.
 */
export default function NationalCuisineStoreApp({ onBack }: { onBack: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const applyNationalFilter = () => {
      root.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        const text = normalizeText(button.textContent ?? "");

        // Oculta categorías que en nacional quedarían sin productos.
        if (HIDDEN_CATEGORY_LABELS.has(text)) {
          button.hidden = true;
          return;
        }

        // Las cards del catálogo de Cuisine siempre incluyen “Ver producto”.
        // Mostramos únicamente las que actualmente pueden viajar por paquetería.
        if (text.includes("Ver producto")) {
          const allowed = NATIONAL_PRODUCT_NAMES.some((name) => text.includes(name));
          button.hidden = !allowed;
        }
      });
    };

    applyNationalFilter();

    const observer = new MutationObserver(() => applyNationalFilter());
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="contents">
      <CuisineStoreApp onBack={onBack} />
    </div>
  );
}
