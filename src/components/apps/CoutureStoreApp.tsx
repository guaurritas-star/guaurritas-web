"use client";

import Image from "next/image";
import { useState } from "react";

type CollectionId = "amuleto" | "clasica" | "encanto";
type ViewMode = "product" | "worn";
type SizeId = "mini" | "chica" | "mediana" | "grande" | "xl";

type BandanaColor = {
  id: string;
  name: string;
  swatch: string;
  productImage: string;
  wornImage: string;
};

type BandanaCollection = {
  id: CollectionId;
  name: string;
  eyebrow: string;
  symbol: string;
  description: string;
  detail: string;
  prices: Record<SizeId, number>;
  colors: BandanaColor[];
};

type BandanaSize = {
  id: SizeId;
  name: string;
  neck: string;
  example: string;
};

const commonColors = [
  { id: "terracota", name: "Terracota Solar", swatch: "#bd5c34" },
  { id: "verde", name: "Verde Bosque", swatch: "#365a43" },
  { id: "mostaza", name: "Mostaza Dorada", swatch: "#d09a2d" },
  { id: "camel", name: "Camel Arena", swatch: "#bd966b" },
  { id: "marfil", name: "Marfil Perla", swatch: "#e9dfcc" },
] as const;

function collectionColors(prefix: "amuleto" | "clasica") {
  return commonColors.map((color) => ({
    ...color,
    productImage: `/couture/bandanas/${prefix}-${color.id}.jpg`,
    wornImage: `/couture/bandanas/${prefix}-${color.id}-perro.jpg`,
  }));
}

const collections: BandanaCollection[] = [
  {
    id: "amuleto",
    name: "Bandana Ojo",
    eyebrow: "Colección Amuleto",
    symbol: "✦",
    description: "Un amuleto tejido para cuidar sus aventuras con mucho estilo.",
    detail:
      "Bandana artesanal tejida a mano, con flecos y herraje decorativo de ojo. Se ajusta con sus propias tiras y está pensada como accesorio de uso supervisado.",
    prices: { mini: 219, chica: 279, mediana: 329, grande: 379, xl: 439 },
    colors: collectionColors("amuleto"),
  },
  {
    id: "clasica",
    name: "Bandana Clásica",
    eyebrow: "Colección Clásica",
    symbol: "❧",
    description: "La consentida de diario: artesanal, cómoda y fácil de combinar.",
    detail:
      "Bandana tejida a mano con acabado de flecos y ajuste mediante tiras. Su diseño limpio deja que el color sea protagonista en paseos, fotos y días especiales.",
    prices: { mini: 199, chica: 249, mediana: 299, grande: 349, xl: 399 },
    colors: collectionColors("clasica"),
  },
  {
    id: "encanto",
    name: "Bandana Encanto",
    eyebrow: "Colección Encanto",
    symbol: "❈",
    description: "Textura, color y pompones para personalidades que no pasan desapercibidas.",
    detail:
      "Bandana artesanal tejida a mano con flecos, pompones y ajuste mediante tiras. Una pieza alegre para celebrar el estilo único de cada lomito.",
    prices: { mini: 219, chica: 279, mediana: 329, grande: 379, xl: 439 },
    colors: [
      {
        id: "fucsia",
        name: "Fucsia",
        swatch: "#df2f95",
        productImage: "/couture/bandanas/encanto-fucsia.jpg",
        wornImage: "/couture/bandanas/encanto-fucsia-perro.jpg",
      },
      {
        id: "algodon",
        name: "Algodón",
        swatch: "linear-gradient(135deg,#f2a8d0 0 33%,#c4e5f1 33% 66%,#f0e0a6 66%)",
        productImage: "/couture/bandanas/encanto-algodon.jpg",
        wornImage: "/couture/bandanas/encanto-algodon-perro.jpg",
      },
    ],
  },
];

const sizes: BandanaSize[] = [
  { id: "mini", name: "Mini", neck: "18–25 cm", example: "Chihuahua · Pomerania" },
  { id: "chica", name: "Chica", neck: "25–32 cm", example: "Pug · Salchicha" },
  { id: "mediana", name: "Mediana", neck: "32–40 cm", example: "French · Beagle" },
  { id: "grande", name: "Grande", neck: "40–50 cm", example: "Labrador · Husky" },
  { id: "xl", name: "XL", neck: "Más de 50 cm", example: "Razas extra grandes" },
];

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function recommendedSize(neck: number): SizeId | null {
  if (!Number.isFinite(neck) || neck < 18 || neck > 80) return null;
  if (neck <= 25) return "mini";
  if (neck <= 32) return "chica";
  if (neck <= 40) return "mediana";
  if (neck <= 50) return "grande";
  return "xl";
}

export default function CoutureStoreApp({ onBack }: { onBack: () => void }) {
  const [collectionId, setCollectionId] = useState<CollectionId>("amuleto");
  const [colorId, setColorId] = useState("terracota");
  const [sizeId, setSizeId] = useState<SizeId>("mediana");
  const [viewMode, setViewMode] = useState<ViewMode>("product");
  const [fitHelperOpen, setFitHelperOpen] = useState(false);
  const [neckInput, setNeckInput] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");

  const collection = collections.find((item) => item.id === collectionId)!;
  const color = collection.colors.find((item) => item.id === colorId) ?? collection.colors[0];
  const size = sizes.find((item) => item.id === sizeId)!;
  const neckValue = Number(neckInput);
  const suggestedSizeId = recommendedSize(neckValue);
  const suggestedSize = sizes.find((item) => item.id === suggestedSizeId);
  const price = collection.prices[sizeId];

  const galleryImage = viewMode === "product" ? color.productImage : color.wornImage;
  const galleryAlt =
    viewMode === "product"
      ? `${collection.name} color ${color.name}`
      : `Perrito usando ${collection.name} color ${color.name}`;

  const minimumPrice = Math.min(...Object.values(collection.prices));

  const selectCollection = (next: BandanaCollection) => {
    setCollectionId(next.id);
    setColorId(next.colors[0].id);
    setViewMode("product");
    setNotice("");
  };

  const addToCart = () => {
    setCartCount((count) => count + 1);
    setNotice(
      `${collection.name} · ${color.name} · talla ${size.name} se agregó al carrito.`,
    );
  };

  return (
    <section className="-m-4 min-h-[32rem] bg-[#fffdfd] text-[#2d2030] sm:-m-6">
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[#d8c8d0] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#69415a] transition hover:text-[#2d2030] sm:text-xs"
        >
          ← Volver a los mundos
        </button>
        <span className="rounded-full border border-[#bfa9b4] bg-[#f5edf1] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#432536] sm:text-[10px]">
          Carrito · {cartCount}
        </span>
      </div>

      <header className="border-b border-[#eadde3] bg-[radial-gradient(circle_at_top_left,#f9e7ef,transparent_38%),linear-gradient(135deg,#fffdfd,#f2e8ed)] px-5 py-8 text-center sm:px-8 sm:py-10">
        <p className="font-interface text-[10px] font-bold uppercase tracking-[0.28em] text-[#a66f89]">
          ✦ El armario del Guaurriverse ✦
        </p>
        <h2 className="mt-3 font-title text-3xl font-semibold text-[#3a2030] sm:text-4xl">
          Guaurritas Couture
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-brand text-lg leading-7 text-[#644e5b] sm:text-xl">
          Elige su colección, descubre cada color puesto y encuentra la talla correcta sin adivinar.
        </p>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 lg:px-9">
        <div>
          <p className="font-interface text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6577]">
            1. Elige su estilo
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {collections.map((item) => {
              const active = item.id === collection.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCollection(item)}
                  aria-pressed={active}
                  className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition sm:block sm:p-4 ${
                    active
                      ? "border-[#70425a] bg-[#f6eaf0] shadow-[3px_3px_0_#70425a]"
                      : "border-[#ddcfd6] bg-white hover:border-[#a77d91] hover:bg-[#fff8fb]"
                  }`}
                >
                  <span className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white sm:h-28 sm:w-full">
                    <Image
                      src={item.colors[0].productImage}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 80px, 28vw"
                      className="object-contain p-1 transition duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="min-w-0 sm:mt-3 sm:block">
                    <span className="block font-title text-sm font-semibold text-[#3a2030] sm:text-base">
                      {item.name}
                    </span>
                    <span className="mt-1 block font-interface text-[9px] font-bold uppercase tracking-[0.14em] text-[#97667e]">
                      {item.eyebrow} · Desde {money(Math.min(...Object.values(item.prices)))}
                    </span>
                  </span>
                  {active && (
                    <span className="ml-auto font-interface text-[9px] font-bold uppercase text-[#70425a] sm:mt-2 sm:block">
                      Seleccionada ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:z-10 lg:w-full lg:max-w-[38rem] lg:justify-self-center lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#d3c3cb] bg-white lg:max-h-[min(38rem,calc(100dvh-11rem))]">
              <Image
                key={galleryImage}
                src={galleryImage}
                alt={galleryAlt}
                fill
                priority
                sizes="(max-width: 1024px) 92vw, 38rem"
                className="object-contain p-4 sm:p-7"
              />
              <span className="absolute left-4 top-4 rounded-full border border-white/80 bg-[#42243a]/90 px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.13em] text-white">
                {viewMode === "product" ? "Vista del producto" : "Así se ve puesto"}
              </span>
            </div>

            <div
              className="mt-3 grid grid-cols-2 gap-2 lg:hidden"
              aria-label="Vistas del producto"
            >
              {(["product", "worn"] as const).map((mode) => {
                const active = mode === viewMode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      active
                        ? "border-[#70425a] bg-[#f6eaf0] text-[#3a2030]"
                        : "border-[#ddcfd6] bg-white text-[#76636e] hover:border-[#a77d91]"
                    }`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                      <Image
                        src={mode === "product" ? color.productImage : color.wornImage}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </span>
                    <span className="font-interface text-[10px] font-bold uppercase tracking-[0.08em]">
                      {mode === "product" ? "Producto" : "Puesta en lomito"}
                    </span>
                  </button>
                );
              })}
            </div>

            <fieldset className="mt-4 lg:hidden">
              <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#614456]">
                2. Color: <span className="text-[#a05d7d]">{color.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {collection.colors.map((item) => {
                  const active = item.id === color.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setColorId(item.id);
                        setViewMode("product");
                        setNotice("");
                      }}
                      aria-pressed={active}
                      className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 font-interface text-[10px] font-bold transition ${
                        active
                          ? "border-[#70425a] bg-[#f6eaf0] text-[#3a2030] shadow-[2px_2px_0_#70425a]"
                          : "border-[#d8c9d0] bg-white text-[#71606a] hover:border-[#a77d91]"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-black/15 shadow-inner"
                        style={{ background: item.swatch }}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p className="mt-3 text-center font-interface text-[9px] uppercase tracking-[0.15em] text-[#8d7a84]">
              Fotografías de la colección Guaurritas Couture
            </p>
          </div>

          <div>
            <p className="font-interface text-[10px] font-bold uppercase tracking-[0.2em] text-[#a66f89]">
              {collection.symbol} {collection.eyebrow}
            </p>
            <h3 className="mt-2 font-title text-3xl font-semibold text-[#3a2030] sm:text-4xl">
              {collection.name}
            </h3>
            <p className="mt-3 font-brand text-xl leading-7 text-[#604a57]">
              {collection.description}
            </p>
            <p className="mt-4 font-brand text-base leading-7 text-[#76636e]">
              {collection.detail}
            </p>

            <div className="mt-7 hidden lg:block">
              <p className="font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#614456]">
                Vista del producto
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2" aria-label="Vistas del producto">
                {(["product", "worn"] as const).map((mode) => {
                  const active = mode === viewMode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      aria-pressed={active}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-[#70425a] bg-[#f6eaf0] text-[#3a2030] shadow-[2px_2px_0_#70425a]"
                          : "border-[#ddcfd6] bg-white text-[#76636e] hover:border-[#a77d91]"
                      }`}
                    >
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                        <Image
                          src={mode === "product" ? color.productImage : color.wornImage}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-contain"
                        />
                      </span>
                      <span className="font-interface text-[10px] font-bold uppercase tracking-[0.08em]">
                        {mode === "product" ? "Producto" : "Puesta en lomito"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <fieldset className="mt-7 hidden lg:block">
              <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#614456]">
                2. Color: <span className="text-[#a05d7d]">{color.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {collection.colors.map((item) => {
                  const active = item.id === color.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setColorId(item.id);
                        setViewMode("product");
                        setNotice("");
                      }}
                      aria-pressed={active}
                      className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 font-interface text-[10px] font-bold transition ${
                        active
                          ? "border-[#70425a] bg-[#f6eaf0] text-[#3a2030] shadow-[2px_2px_0_#70425a]"
                          : "border-[#d8c9d0] bg-white text-[#71606a] hover:border-[#a77d91]"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-black/15 shadow-inner"
                        style={{ background: item.swatch }}
                        aria-hidden="true"
                      />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.16em] text-[#614456]">
                  3. Talla
                </legend>
                <button
                  type="button"
                  onClick={() => setFitHelperOpen((open) => !open)}
                  className="font-interface text-[10px] font-bold text-[#8c5470] underline decoration-dotted underline-offset-4"
                  aria-expanded={fitHelperOpen}
                >
                  📏 No sé su talla
                </button>
              </div>

              {fitHelperOpen && (
                <div className="mt-3 rounded-2xl border border-[#ceb9c4] bg-[#fbf3f7] p-4">
                  <p className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#513647]">
                    Mide el cuello en 3 pasos
                  </p>
                  <ol className="mt-2 space-y-1 font-brand text-sm leading-6 text-[#6c5864]">
                    <li>1. Rodea su cuello con una cinta, sin apretar.</li>
                    <li>2. Deja pasar dos dedos entre la cinta y su cuello.</li>
                    <li>3. Escribe la medida. Si queda entre tallas, elige la mayor.</li>
                  </ol>
                  <label className="mt-4 block font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#614456]" htmlFor="couture-neck">
                    Contorno de cuello
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="couture-neck"
                      type="number"
                      min="10"
                      max="80"
                      inputMode="decimal"
                      value={neckInput}
                      onChange={(event) => setNeckInput(event.target.value)}
                      placeholder="Ej. 34"
                      className="min-h-11 w-32 rounded-xl border border-[#bca8b2] bg-white px-3 text-sm text-[#3a2030] outline-none focus:border-[#70425a] focus:ring-2 focus:ring-[#d9bcca]"
                    />
                    <span className="font-interface text-xs text-[#78636e]">cm</span>
                  </div>
                  {neckInput && suggestedSize ? (
                    <button
                      type="button"
                      onClick={() => setSizeId(suggestedSize.id)}
                      className="mt-3 w-full rounded-xl border border-[#70425a] bg-white px-3 py-2 text-left font-interface text-[10px] font-bold text-[#4a2c3e] transition hover:bg-[#f4e6ed]"
                    >
                      Te recomendamos {suggestedSize.name} ({suggestedSize.neck}) · Elegir esta talla →
                    </button>
                  ) : neckInput ? (
                    <p className="mt-3 font-brand text-sm text-[#96546f]">
                      Revisa la medida. Nuestra guía cubre cuellos de 18 a 80 cm.
                    </p>
                  ) : null}
                </div>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sizes.map((item) => {
                  const active = item.id === sizeId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSizeId(item.id);
                        setNotice("");
                      }}
                      aria-pressed={active}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#70425a] bg-[#f5eaf0] shadow-[2px_2px_0_#70425a]"
                          : "border-[#d9ccd2] bg-white hover:border-[#a77d91]"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-interface text-xs font-bold text-[#3a2030]">{item.name}</span>
                        <span className="font-title text-sm font-semibold text-[#70425a]">
                          {money(collection.prices[item.id])}
                        </span>
                      </span>
                      <span className="mt-1 block font-interface text-[9px] font-bold text-[#8b6477]">
                        Cuello {item.neck}
                      </span>
                      <span className="mt-0.5 block font-brand text-sm text-[#786771]">{item.example}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <details className="mt-7 rounded-2xl border border-[#ded1d7] bg-white p-4">
              <summary className="cursor-pointer font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#573b4b]">
                Ajuste, cuidado y uso seguro
              </summary>
              <div className="mt-3 space-y-2 font-brand text-sm leading-6 text-[#71606a]">
                <p>Ajusta las tiras dejando espacio para pasar dos dedos entre la bandana y su cuello.</p>
                <p>Limpia suavemente a mano y deja secar extendida. No uses blanqueador ni secadora.</p>
                <p>Es un accesorio decorativo: úsalo con supervisión y nunca para sujetar la correa.</p>
              </div>
            </details>

            <div className="mt-7 border-t border-[#e0d3d9] pt-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-interface text-[9px] font-bold uppercase tracking-[0.15em] text-[#8a7380]">
                    {color.name} · Talla {size.name}
                  </p>
                  <p className="mt-1 font-title text-3xl font-semibold text-[#3a2030]">{money(price)}</p>
                </div>
                <p className="font-interface text-[9px] uppercase tracking-[0.1em] text-[#907d87]">
                  {minimumPrice === price ? "Precio inicial" : `Desde ${money(minimumPrice)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={addToCart}
                className="mt-4 min-h-12 w-full rounded-xl border-2 border-[#3a2030] bg-[#3a2030] px-5 py-3 font-interface text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_#b98a9f] transition hover:-translate-y-0.5 hover:bg-[#5a3448] active:translate-y-0"
              >
                Agregar al carrito · {money(price)}
              </button>
              {notice && (
                <p className="mt-3 rounded-xl border border-[#b8ccb9] bg-[#eef7ee] px-4 py-3 font-brand text-sm text-[#3d6544]" role="status">
                  ✓ {notice}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
