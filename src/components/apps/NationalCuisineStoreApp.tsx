"use client";

import CuisineStoreApp from "@/components/apps/CuisineStoreApp";

/**
 * Envío nacional reutiliza EXACTAMENTE la misma experiencia de Cuisine León.
 * No existe un segundo diseño ni un segundo configurador: renderizamos el mismo
 * componente con fulfillmentMode="national". CuisineStoreApp filtra sus propios
 * productos y categorías con NATIONAL_PRODUCT_NAMES, así que las cards que solo
 * se entregan en León nunca se muestran en el catálogo nacional.
 */
export default function NationalCuisineStoreApp({
  onBack,
  embeddedInStore = false,
}: {
  onBack: () => void;
  embeddedInStore?: boolean;
}) {
  return (
    <CuisineStoreApp
      onBack={onBack}
      embeddedInStore={embeddedInStore}
      fulfillmentMode="national"
    />
  );
}
