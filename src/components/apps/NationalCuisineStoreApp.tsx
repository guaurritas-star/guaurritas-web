"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { addCartItem, useCart } from "@/lib/cart-store";
import { withBasePath } from "@/lib/base-path";

type NationalProduct = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  options: Array<{ label: string; price: number }>;
  badge?: string;
  imageTone: string;
};

const products: NationalProduct[] = [
  {
    id: "happy-bag",
    name: "Happy Bag",
    eyebrow: "GuaurriCookies · 100 g",
    description: "Bolsa de premios horneados lista para viajar por México.",
    image: "/cuisine/products/happy-bag-flavors-v6/peanut-bacon.webp",
    imageAlt: "Happy Bag Guaurritas",
    options: [
      { label: "Cacahuate con tocino · 100 g", price: 85 },
      { label: "Pollo con zanahoria · 100 g", price: 85 },
      { label: "Pollo con calabaza · 100 g", price: 85 },
      { label: "Manzana con plátano · 100 g", price: 85 },
    ],
    badge: "Envío nacional",
    imageTone: "#f0e5ea",
  },
  {
    id: "sazonadores",
    name: "Sazonadores",
    eyebrow: "Para elevar su bowl",
    description: "Proteína deshidratada y verduritas en frasco de 60 g.",
    image: "/cuisine/products/sazonadores-card-v3.webp",
    imageAlt: "Sazonadores Guaurritas",
    options: [
      { label: "Res · 60 g", price: 119 },
      { label: "Pollo · 60 g", price: 119 },
    ],
    badge: "Envío nacional",
    imageTone: "#dce8ef",
  },
  {
    id: "sticks",
    name: "GuaurriSticks",
    eyebrow: "Snack sin carnaza",
    description: "Bolsa con 10 sticks sabor res, firme y práctica para paquetería.",
    image: "/cuisine/products/sticks-card-v5.webp",
    imageAlt: "GuaurriSticks Guaurritas",
    options: [{ label: "Bolsa con 10 sticks", price: 79 }],
    badge: "Envío nacional",
    imageTone: "#e6edf5",
  },
  {
    id: "happy-box",
    name: "Happy Box",
    eyebrow: "Regalo & celebración",
    description: "Premios surtidos y juguete sorpresa en formato regalo.",
    image: "/cuisine/products/happy-box-card-v3.webp",
    imageAlt: "Happy Box Guaurritas",
    options: [
      { label: "Happy Box", price: 160 },
      { label: "Happy Box Deluxe", price: 210 },
    ],
    badge: "Envío nacional",
    imageTone: "#e8eef1",
  },
  {
    id: "gorrito",
    name: "B’day gorrito",
    eyebrow: "Extra de celebración",
    description: "Gorrito de cumpleaños para completar su festejo.",
    image: "/cuisine/products/gorrito-transparent.png",
    imageAlt: "Gorrito de cumpleaños Guaurritas",
    options: [{ label: "Gorrito", price: 50 }],
    badge: "Envío nacional",
    imageTone: "#dceef2",
  },
  {
    id: "velitas",
    name: "Velitas",
    eyebrow: "Extra de celebración",
    description: "Velita decorativa de número para su foto de cumpleaños.",
    image: "/cuisine/products/velitas-transparent.png",
    imageAlt: "Velitas de cumpleaños Guaurritas",
    options: [
      { label: "Velita chica", price: 10 },
      { label: "Velita grande", price: 40 },
    ],
    badge: "Envío nacional",
    imageTone: "#f4e2ea",
  },
  {
    id: "pancarta",
    name: "Pancarta",
    eyebrow: "Extra de celebración",
    description: "Banderines Happy Birthday para vestir su rincón de fiesta.",
    image: "/cuisine/products/pancarta-card-v2.png",
    imageAlt: "Pancarta de cumpleaños Guaurritas",
    options: [{ label: "Pancarta", price: 80 }],
    badge: "Envío nacional",
    imageTone: "#f2e6db",
  },
];

const cookieFlavors = [
  "Cacahuate con tocino",
  "Pollo con calabaza",
  "Pollo con zanahoria",
  "Manzana con plátano",
] as const;

type CookieFlavor = (typeof cookieFlavors)[number];
type BulkUnit = "g" | "kg";

const cookieAnalyses: Record<CookieFlavor, Array<{ label: string; value: string }>> = {
  "Cacahuate con tocino": [
    { label: "Proteína", value: "18.6%" },
    { label: "Grasas", value: "21.8%" },
    { label: "Humedad", value: "0.5%" },
    { label: "Cenizas", value: "2%" },
    { label: "Fibra", value: "2%" },
  ],
  "Pollo con calabaza": [
    { label: "Proteína", value: "19.7%" },
    { label: "Grasas", value: "12%" },
    { label: "Humedad", value: "0.8%" },
    { label: "Cenizas", value: "2%" },
    { label: "Fibra", value: "2.2%" },
  ],
  "Pollo con zanahoria": [
    { label: "Proteína", value: "19.2%" },
    { label: "Grasas", value: "15.7%" },
    { label: "Humedad", value: "0.8%" },
    { label: "Cenizas", value: "1.8%" },
    { label: "Fibra", value: "2.4%" },
  ],
  "Manzana con plátano": [
    { label: "Proteína", value: "15.8%" },
    { label: "Grasas", value: "10.9%" },
    { label: "Humedad", value: "1%" },
    { label: "Cenizas", value: "1.7%" },
    { label: "Fibra", value: "2.4%" },
  ],
};

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeight(grams: number) {
  if (grams >= 1000) {
    return `${new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 1,
    }).format(grams / 1000)} kg`;
  }
  return `${grams} g`;
}

function createEmptyDistribution(): Record<CookieFlavor, number> {
  return Object.fromEntries(
    cookieFlavors.map((flavor) => [flavor, 0]),
  ) as Record<CookieFlavor, number>;
}

function priceFrom(product: NationalProduct) {
  const prices = product.options.map((option) => option.price);
  const lowest = Math.min(...prices);
  return prices.some((price) => price !== lowest)
    ? `Desde ${money(lowest)}`
    : money(lowest);
}

export default function NationalCuisineStoreApp({ onBack }: { onBack: () => void }) {
  const { count } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [cookieOpen, setCookieOpen] = useState(false);
  const [bulkUnit, setBulkUnit] = useState<BulkUnit>("g");
  const [bulkQuantityInput, setBulkQuantityInput] = useState("300");
  const [bulkFlavorGrams, setBulkFlavorGrams] =
    useState<Record<CookieFlavor, number>>(createEmptyDistribution);
  const [notice, setNotice] = useState("");

  const addRegularProduct = (product: NationalProduct) => {
    const optionIndex = selectedOptions[product.id] ?? 0;
    const option = product.options[optionIndex] ?? product.options[0];

    addCartItem({
      id: `cuisine:${product.id}:${optionIndex}`,
      name: product.name,
      detail: option.label,
      unitPrice: option.price,
      image: product.image,
      fulfillment: "national",
    });

    setNotice(`${product.name} · ${option.label} se agregó a envío nacional.`);
  };

  const openCookies = () => {
    setCookieOpen(true);
    setBulkUnit("g");
    setBulkQuantityInput("300");
    setBulkFlavorGrams(createEmptyDistribution());
    setNotice("");
  };

  const selectBulkUnit = (nextUnit: BulkUnit) => {
    const numericValue = Number(bulkQuantityInput);
    const currentGrams = Number.isFinite(numericValue)
      ? bulkUnit === "kg"
        ? numericValue * 1000
        : numericValue
      : 300;
    const safeGrams = Math.max(300, Math.round(currentGrams / 100) * 100);

    setBulkUnit(nextUnit);
    setBulkQuantityInput(
      nextUnit === "kg"
        ? String(Number((safeGrams / 1000).toFixed(1)))
        : String(safeGrams),
    );
  };

  const setBulkQuantity = (grams: number) => {
    const safe = Math.min(10000, Math.max(300, Math.round(grams / 100) * 100));
    setBulkQuantityInput(
      bulkUnit === "kg"
        ? String(Number((safe / 1000).toFixed(1)))
        : String(safe),
    );
  };

  const changeBulkFlavorInput = (flavor: CookieFlavor, value: string) => {
    const numericValue = Number(value);
    setBulkFlavorGrams((current) => ({
      ...current,
      [flavor]: value === "" || !Number.isFinite(numericValue)
        ? 0
        : Math.max(0, numericValue),
    }));
  };

  const bulkNumericInput = Number(bulkQuantityInput);
  const bulkEnteredGrams =
    bulkQuantityInput.trim() !== "" && Number.isFinite(bulkNumericInput)
      ? bulkUnit === "kg"
        ? Math.round(bulkNumericInput * 1000)
        : Math.round(bulkNumericInput)
      : 0;
  const bulkQuantityIsValid =
    bulkEnteredGrams >= 300 &&
    bulkEnteredGrams <= 10000 &&
    bulkEnteredGrams % 100 === 0;
  const bulkTargetGrams = bulkQuantityIsValid ? bulkEnteredGrams : 0;
  const isBulkWholesaleQuote = bulkQuantityIsValid && bulkTargetGrams >= 5000;
  const bulkBasePrice = bulkTargetGrams * 0.6;
  const bulkDiscountRate =
    bulkQuantityIsValid && !isBulkWholesaleQuote && bulkTargetGrams >= 2000
      ? 0.05
      : 0;
  const bulkPrice = Math.round(bulkBasePrice * (1 - bulkDiscountRate));
  const bulkSavings = Math.round(bulkBasePrice - bulkPrice);
  const bulkAssignedGrams = useMemo(
    () => Object.values(bulkFlavorGrams).reduce((total, grams) => total + grams, 0),
    [bulkFlavorGrams],
  );
  const bulkRemainingGrams = bulkTargetGrams - bulkAssignedGrams;
  const bulkFlavorIncrementsAreValid = Object.values(bulkFlavorGrams).every(
    (grams) => Number.isInteger(grams) && grams >= 0 && grams % 100 === 0,
  );
  const bulkDistributionSummary = cookieFlavors
    .filter((flavor) => bulkFlavorGrams[flavor] > 0)
    .map((flavor) => `${bulkFlavorGrams[flavor]} g ${flavor.toLocaleLowerCase("es")}`)
    .join(" · ");
  const bulkDistributionIsComplete =
    bulkQuantityIsValid &&
    bulkFlavorIncrementsAreValid &&
    bulkAssignedGrams === bulkTargetGrams;

  const adjustBulkFlavor = (flavor: CookieFlavor, change: -100 | 100) => {
    if (!bulkQuantityIsValid) return;
    setBulkFlavorGrams((current) => {
      const assigned = Object.values(current).reduce((total, grams) => total + grams, 0);
      const nextFlavor = current[flavor] + change;
      if (nextFlavor < 0 || assigned + change > bulkTargetGrams) return current;
      return { ...current, [flavor]: nextFlavor };
    });
  };

  const addCookies = () => {
    if (!bulkDistributionIsComplete) return;

    const distribution = cookieFlavors
      .filter((flavor) => bulkFlavorGrams[flavor] > 0)
      .map(
        (flavor) =>
          `${bulkFlavorGrams[flavor]} g de ${flavor.toLocaleLowerCase("es")}`,
      )
      .join(", ");

    if (isBulkWholesaleQuote) {
      setNotice(
        `Solicitud de mayoreo por ${formatWeight(bulkTargetGrams)}: ${distribution}. La cantidad y el precio quedan pendientes de confirmación.`,
      );
      return;
    }

    addCartItem({
      id: `cuisine:guaurricookies:${bulkTargetGrams}:${distribution}`,
      name: "Guaurricookies",
      detail: `${formatWeight(bulkTargetGrams)} · ${distribution}`,
      unitPrice: bulkPrice,
      image: "/cuisine/products/guaurricookies-vitrolero.webp",
      fulfillment: "national",
    });

    setNotice(
      `Guaurricookies ${formatWeight(bulkTargetGrams)} por ${money(bulkPrice)} se agregaron a envío nacional.`,
    );
  };

  if (cookieOpen) {
    return (
      <section className="-m-4 min-h-[32rem] bg-white sm:-m-6">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#b9c8d8] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setCookieOpen(false)}
            className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#425b8c] hover:text-[#263650]"
          >
            ← Volver al catálogo
          </button>
          <span className="rounded-full border border-[#8ba9b5] bg-[#e8f2f4] px-3 py-1.5 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
            Carrito · {count}
          </span>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-10">
          <div className="lg:sticky lg:top-24 lg:z-10 lg:w-full lg:max-w-[min(28rem,calc(100dvh-13rem))] lg:justify-self-center lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#b7c6ce] bg-[#eef4f5]">
              <Image
                src={withBasePath("/cuisine/products/guaurricookies-vitrolero.webp")}
                alt="Galletas Guaurricookies horneadas para mascotas"
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 90vw, 28rem"
                className="object-contain p-7 sm:p-10 lg:p-12"
              />
            </div>
            <p className="mt-3 text-center font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
              Fotografía del catálogo Guaurritas
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-interface text-[10px] font-bold uppercase tracking-[0.2em] text-[#5e96a5]">
              Premios horneados
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#263650] sm:text-4xl">
              Guaurricookies
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-7 text-[#53627a]">
              El clásico de Cuisine: galletitas de harina de avena, horneadas sin azúcar y mezcladas a su gusto.
            </p>

            <div className="mt-5 hidden max-w-xl rounded-2xl border border-[#c8d5dc] bg-[#f8fbfc] p-4 lg:block">
              <p className="font-interface text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e96a5]">
                Antes de pedir
              </p>
              <p className="mt-2 font-interface text-sm leading-6 text-[#657287]">
                Para lomitos. Elige de 300 g a 10 kg, siempre en pasos de 100 g, y reparte el total entre uno o varios sabores: cacahuate con tocino; pollo con calabaza; pollo con zanahoria; o manzana con plátano.
              </p>
              <p className="mt-3 border-t border-[#d7e0e5] pt-3 font-interface text-[10px] leading-5 text-[#718093]">
                <strong className="text-[#53627a]">Guía Cuisine:</strong>{" "}
                es un premio complementario y no sustituye su alimento diario.
              </p>
            </div>

            <div className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                    ¿Cuánto necesitas?
                  </p>
                  <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                    Mínimo 300 g · cantidades de 100 g en 100 g.
                  </p>
                </div>
                {bulkDiscountRate > 0 && (
                  <span className="shrink-0 rounded-full bg-[#e3f1e7] px-2.5 py-1 font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#456a4e]">
                    5% menos
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-[auto_1fr] gap-2 sm:grid-cols-[auto_1fr_auto_auto]">
                <div className="flex rounded-xl border border-[#b9c8d8] bg-white p-1">
                  {(["g", "kg"] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      aria-pressed={bulkUnit === unit}
                      onClick={() => selectBulkUnit(unit)}
                      className={`min-w-12 rounded-lg px-3 py-2 font-interface text-[10px] font-bold uppercase transition ${
                        bulkUnit === unit
                          ? "bg-[#263650] text-white"
                          : "text-[#657287] hover:bg-[#edf3f5]"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>

                <label className="relative min-w-0">
                  <span className="sr-only">Cantidad total en {bulkUnit}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={bulkUnit === "kg" ? 0.3 : 300}
                    max={bulkUnit === "kg" ? 10 : 10000}
                    step={bulkUnit === "kg" ? 0.1 : 100}
                    value={bulkQuantityInput}
                    onChange={(event) => setBulkQuantityInput(event.target.value)}
                    aria-invalid={!bulkQuantityIsValid}
                    className={`h-full min-h-12 w-full rounded-xl border bg-white px-4 pr-12 font-interface text-base font-bold text-[#263650] outline-none transition ${
                      bulkQuantityIsValid
                        ? "border-[#7c9cab] focus:border-[#425b8c]"
                        : "border-[#b96d72] focus:border-[#9f5860]"
                    }`}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-interface text-[10px] font-bold uppercase text-[#718093]">
                    {bulkUnit}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setBulkQuantity(Math.max(300, bulkTargetGrams - 100))}
                  disabled={!bulkQuantityIsValid || bulkTargetGrams <= 300}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-[#b9c8d8] bg-white px-4 font-interface text-lg font-bold text-[#425b8c] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setBulkQuantity(bulkTargetGrams + 100)}
                  disabled={!bulkQuantityIsValid || bulkTargetGrams >= 10000}
                  className="flex min-h-12 items-center justify-center rounded-xl border border-[#5e96a5] bg-[#e8f2f4] px-4 font-interface text-lg font-bold text-[#263650] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <p className={`mt-2 font-interface text-[10px] ${
                bulkQuantityIsValid ? "text-[#718093]" : "font-semibold text-[#9f5860]"
              }`}>
                {bulkQuantityIsValid
                  ? `${formatWeight(bulkTargetGrams)} seleccionados.`
                  : "Ingresa entre 300 g y 10 kg en múltiplos de 100 g."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[300, 500, 1000, 2000].map((grams) => (
                  <button
                    key={grams}
                    type="button"
                    onClick={() => setBulkQuantity(grams)}
                    className={`rounded-full border px-3 py-2 font-interface text-[10px] font-bold transition ${
                      bulkTargetGrams === grams
                        ? "border-[#425b8c] bg-[#e5edf4] text-[#263650]"
                        : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#7c9cab]"
                    }`}
                  >
                    {formatWeight(grams)}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#d1dce1] bg-white px-4 py-3">
                <div>
                  <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#718093]">
                    {isBulkWholesaleQuote ? "Pedido de mayoreo" : "Precio calculado"}
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-[#263650]">
                    {!bulkQuantityIsValid
                      ? "—"
                      : isBulkWholesaleQuote
                        ? "Por cotizar"
                        : money(bulkPrice)}
                  </p>
                </div>
                <div className="text-right font-interface text-[10px] leading-4 text-[#718093]">
                  {isBulkWholesaleQuote ? (
                    <p>Desde 5 kg confirmamos precio y producción.</p>
                  ) : bulkDiscountRate > 0 ? (
                    <>
                      <p className="line-through">Antes {money(bulkBasePrice)}</p>
                      <p className="font-bold text-[#456a4e]">Ahorras {money(bulkSavings)}</p>
                    </>
                  ) : (
                    <p>$60 por cada 100 g</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                    Distribuye tus sabores
                  </p>
                  <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                    Suma o resta porciones de 100 g hasta completar tu presentación.
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 font-interface text-[9px] font-bold uppercase tracking-[0.1em] ${
                  bulkDistributionIsComplete
                    ? "bg-[#e3f1e7] text-[#456a4e]"
                    : "bg-[#dceef0] text-[#425b8c]"
                }`}>
                  {bulkAssignedGrams}/{bulkTargetGrams || "—"} g
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {cookieFlavors.map((flavor) => (
                  <div key={flavor} className="rounded-xl border border-[#d1dce1] bg-white p-3">
                    <p className="font-interface text-[10px] font-bold text-[#53627a]">{flavor}</p>
                    <div className="mt-2 grid grid-cols-[auto_1fr_auto] gap-2">
                      <button
                        type="button"
                        onClick={() => adjustBulkFlavor(flavor, -100)}
                        disabled={bulkFlavorGrams[flavor] <= 0}
                        className="rounded-lg border border-[#b9c8d8] px-3 font-interface text-base font-bold text-[#425b8c] disabled:opacity-30"
                      >
                        −
                      </button>
                      <label className="relative">
                        <input
                          type="number"
                          min={0}
                          max={bulkTargetGrams || 10000}
                          step={100}
                          value={bulkFlavorGrams[flavor]}
                          onChange={(event) => changeBulkFlavorInput(flavor, event.target.value)}
                          className="w-full rounded-lg border border-[#b9c8d8] px-3 py-2 pr-8 text-center text-xs font-bold text-[#263650]"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center font-interface text-[9px] text-[#718093]">g</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => adjustBulkFlavor(flavor, 100)}
                        disabled={!bulkQuantityIsValid || bulkRemainingGrams < 100}
                        className="rounded-lg border border-[#5e96a5] bg-[#e8f2f4] px-3 font-interface text-base font-bold text-[#263650] disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dbe4e8]">
                <span
                  className={`block h-full rounded-full transition-[width] duration-300 ${
                    bulkDistributionIsComplete ? "bg-[#6f9a78]" : "bg-[#5e96a5]"
                  }`}
                  style={{
                    width: bulkQuantityIsValid
                      ? `${Math.min(100, (bulkAssignedGrams / bulkTargetGrams) * 100)}%`
                      : "0%",
                  }}
                />
              </div>

              <p className={`mt-4 font-interface text-[10px] font-semibold ${
                bulkDistributionIsComplete
                  ? "text-[#456a4e]"
                  : bulkRemainingGrams < 0 || !bulkFlavorIncrementsAreValid
                    ? "text-[#9f5860]"
                    : "text-[#718093]"
              }`}>
                {!bulkQuantityIsValid
                  ? "Primero ingresa una cantidad válida."
                  : !bulkFlavorIncrementsAreValid
                    ? "Usa múltiplos de 100 g en cada sabor."
                    : bulkRemainingGrams < 0
                      ? `Reduce ${Math.abs(bulkRemainingGrams)} g de la distribución.`
                      : bulkRemainingGrams === 0
                        ? "Distribución completa."
                        : `Faltan ${bulkRemainingGrams} g por asignar.`}
              </p>
            </div>

            <section className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f8fbfc] p-4 sm:p-5">
              <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                Análisis garantizado por sabor
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {cookieFlavors.map((flavor) => (
                  <details key={flavor} className="rounded-xl border border-[#d1dce1] bg-white p-3">
                    <summary className="cursor-pointer font-interface text-[10px] font-bold text-[#53627a]">
                      {flavor}
                    </summary>
                    <dl className="mt-3 space-y-1.5">
                      {cookieAnalyses[flavor].map((item) => (
                        <div key={item.label} className="flex justify-between gap-3 font-interface text-[9px] text-[#718093]">
                          <dt>{item.label}</dt>
                          <dd className="font-bold text-[#53627a]">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ))}
              </div>
            </section>

            <details className="group mt-7 rounded-2xl border border-[#c8d5dc] bg-[#f8fbfc] p-4 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-interface text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e96a5] marker:content-none">
                <span>Antes de pedir</span>
                <span aria-hidden="true" className="text-base text-[#425b8c] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 font-interface text-sm leading-6 text-[#657287]">
                Para lomitos. Elige de 300 g a 10 kg, siempre en pasos de 100 g, y reparte el total entre uno o varios sabores.
              </p>
            </details>

            <div className="mt-7 flex flex-col gap-3 border-t border-[#d6dee5] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
                  {bulkQuantityIsValid ? formatWeight(bulkTargetGrams) : "cantidad pendiente"} · {bulkDistributionSummary || "distribuye los sabores"}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#263650]">
                  {!bulkQuantityIsValid
                    ? "Ingresa una cantidad válida"
                    : isBulkWholesaleQuote
                      ? "Cotización de mayoreo"
                      : money(bulkPrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={addCookies}
                disabled={!bulkDistributionIsComplete}
                className="border-2 border-[#263650] bg-[#263650] px-6 py-3.5 font-interface text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#77aab6] transition hover:-translate-y-0.5 hover:bg-[#425b8c] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {isBulkWholesaleQuote ? "Solicitar cotización" : "Agregar al carrito"}
              </button>
            </div>

            {!bulkDistributionIsComplete && (
              <p className="mt-3 font-interface text-[10px] leading-4 text-[#718093]">
                {!bulkQuantityIsValid
                  ? "Ingresa una cantidad entre 300 g y 10 kg en múltiplos de 100 g."
                  : !bulkFlavorIncrementsAreValid
                    ? "Escribe los gramos de cada sabor en múltiplos de 100 g."
                    : bulkRemainingGrams < 0
                      ? `Reduce ${Math.abs(bulkRemainingGrams)} g de la distribución.`
                      : bulkAssignedGrams === 0
                        ? `Distribuye los ${bulkTargetGrams} g entre uno o varios sabores.`
                        : `Faltan ${bulkRemainingGrams} g por asignar antes de continuar.`}
              </p>
            )}

            {notice && (
              <p role="status" className="mt-4 rounded-lg border border-[#89a79a] bg-[#edf6f0] px-4 py-3 font-interface text-xs font-semibold text-[#446454]">
                ✓ {notice}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-m-4 min-h-full bg-white p-4 sm:-m-6 sm:p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#c7d1dc] pb-5">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#425b8c]"
            >
              ← Cambiar tipo de entrega
            </button>
            <p className="mt-4 font-interface text-[10px] font-bold uppercase tracking-[0.2em] text-[#5e96a5]">
              📦 Envío nacional
            </p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#263650] sm:text-4xl">
              Cuisine que sí puede viajar
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#657287]">
              Aquí mostramos únicamente productos preparados para paquetería. Los alimentos frescos y decoraciones delicadas siguen disponibles en Entrega en León.
            </p>
          </div>

          <span className="rounded-full border border-[#8ba9b5] bg-[#e8f2f4] px-3 py-2 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
            Carrito · {count}
          </span>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={openCookies}
            className="group overflow-hidden rounded-[1.4rem] border border-[#c2cdd3] bg-white text-left shadow-[0_8px_18px_rgba(38,54,80,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#6f99a5] hover:shadow-[0_15px_28px_rgba(38,54,80,0.14)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#5e96a5]"
          >
            <span className="relative block aspect-[4/3] overflow-hidden border-b border-[#cbd5da] bg-[#eef4f5]">
              <Image
                src={withBasePath("/cuisine/products/guaurricookies-vitrolero.webp")}
                alt="Galletas Guaurricookies horneadas para mascotas"
                fill
                unoptimized
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 23vw"
                className="object-contain p-5 transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-[#263650] px-2.5 py-1 font-interface text-[8px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                Envío nacional
              </span>
            </span>
            <span className="block p-4">
              <span className="font-interface text-[9px] font-bold uppercase tracking-[0.16em] text-[#6b96a1]">
                Premios horneados
              </span>
              <span className="mt-1.5 flex items-start justify-between gap-3">
                <span className="font-serif text-lg font-semibold leading-snug text-[#263650]">
                  Guaurricookies
                </span>
                <span className="shrink-0 font-interface text-xs font-bold text-[#a66271]">
                  $180
                </span>
              </span>
              <span className="mt-2 block min-h-10 font-interface text-[11px] leading-5 text-[#718093]">
                El clásico de Cuisine: galletitas de harina de avena, horneadas sin azúcar y mezcladas a su gusto.
              </span>
              <span className="mt-4 flex items-center justify-between border-t border-[#d7dfe3] pt-3 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#425b8c]">
                Ver producto
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4f0f2] text-base transition group-hover:bg-[#5e96a5] group-hover:text-white" aria-hidden="true">
                  →
                </span>
              </span>
            </span>
          </button>

          {products.map((product) => {
            const optionIndex = selectedOptions[product.id] ?? 0;
            const option = product.options[optionIndex] ?? product.options[0];

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-[1.35rem] border border-[#c4d0d8] bg-white shadow-[0_8px_18px_rgba(38,54,80,0.08)]"
              >
                <div className="relative aspect-[4/3]" style={{ backgroundColor: product.imageTone }}>
                  <Image
                    src={withBasePath(product.image)}
                    alt={product.imageAlt}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 90vw, 22rem"
                    className="object-contain p-6"
                  />
                  {product.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#263650] px-2.5 py-1 font-interface text-[8px] font-bold uppercase tracking-[0.1em] text-white">
                      {product.badge}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="font-interface text-[9px] font-bold uppercase tracking-[0.15em] text-[#5e96a5]">
                    {product.eyebrow}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-[#263650]">
                    {product.name}
                  </h3>
                  <p className="mt-2 min-h-12 text-xs leading-5 text-[#657287]">
                    {product.description}
                  </p>

                  {product.options.length > 1 ? (
                    <select
                      value={optionIndex}
                      onChange={(event) =>
                        setSelectedOptions((current) => ({
                          ...current,
                          [product.id]: Number(event.target.value),
                        }))
                      }
                      className="mt-4 w-full rounded-xl border border-[#b9c8d8] bg-white px-3 py-2.5 font-interface text-[10px] font-semibold text-[#53627a]"
                    >
                      {product.options.map((choice, index) => (
                        <option key={choice.label} value={index}>
                          {choice.label} · {money(choice.price)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-4 font-interface text-[10px] font-semibold text-[#53627a]">
                      {option.label}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <strong className="font-serif text-xl text-[#263650]">
                      {priceFrom(product)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => addRegularProduct(product)}
                      className="border-2 border-[#263650] bg-[#263650] px-4 py-2.5 font-interface text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-[2px_2px_0_#77aab6]"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {notice && (
          <p role="status" className="mt-5 rounded-xl border border-[#89a79a] bg-[#edf6f0] px-4 py-3 font-interface text-xs font-semibold text-[#446454]">
            ✓ {notice}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-[#d5c3a5] bg-[#fbf6ec] px-4 py-4 font-interface text-[10px] leading-5 text-[#6d604f]">
          <strong className="text-[#4d4337]">Próxima fase:</strong> Pizzet Kit, Petcake Kit y otras versiones especiales para viajar se activarán aquí únicamente después de validar empaque y estabilidad.
        </div>
      </div>
    </section>
  );
}
