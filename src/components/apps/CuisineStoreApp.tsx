"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type CategoryId =
  | "all"
  | "snacks"
  | "petcakes"
  | "bakery"
  | "antojitos"
  | "birthday";

type ProductCategory = Exclude<CategoryId, "all">;

type ProductOption = {
  label: string;
  price: number;
};

type CuisineProduct = {
  id: string;
  name: string;
  eyebrow: string;
  category: ProductCategory;
  description: string;
  image: string;
  imageAlt: string;
  options: ProductOption[];
  detail: string;
  customizable?: boolean;
  badge?: string;
  imageTone: string;
  imageScale?: number;
};

const categories: { id: CategoryId; label: string }[] = [
  { id: "all", label: "Todo el menú" },
  { id: "snacks", label: "Premios & snacks" },
  { id: "petcakes", label: "Petcakes" },
  { id: "bakery", label: "Repostería pet" },
  { id: "antojitos", label: "Antojería pet" },
  { id: "birthday", label: "Cumpleaños" },
];

const products: CuisineProduct[] = [
  {
    id: "guaurricookies",
    name: "Guaurricookies",
    eyebrow: "Premios horneados",
    category: "snacks",
    description: "Elige uno o varios sabores en presentación a granel.",
    image: "/cuisine/products/guaurricookies-transparent.png",
    imageAlt: "Galletas Guaurricookies horneadas para mascotas",
    options: [
      { label: "300 g", price: 150 },
      { label: "400 g", price: 225 },
      { label: "500 g", price: 300 },
      { label: "1 kg", price: 600 },
    ],
    detail:
      "Sabores disponibles: cacahuate con tocino, pollo con calabaza, pollo con zanahoria y manzana con plátano.",
    imageTone: "#eef4f5",
  },
  {
    id: "happy-bag",
    name: "Happy Bag",
    eyebrow: "Guaurricookies",
    category: "snacks",
    description: "Bolsita de 100 g para probar sabores o llevar un detalle.",
    image: "/cuisine/products/happy-bag-card-v4.webp",
    imageAlt: "Bolsa de treats horneados Guaurritas",
    options: [{ label: "Bolsa 100 g", price: 85 }],
    detail:
      "Premios horneados pensados para consentir en el día a día. Puedes elegir el sabor al preparar tu pedido.",
    badge: "Favorito",
    imageTone: "#f0e5ea",
    imageScale: 1.18,
  },
  {
    id: "sazonadores",
    name: "Sazonadores",
    eyebrow: "Para elevar su bowl",
    category: "snacks",
    description: "Más sabor e intención para el plato de todos los días.",
    image: "/cuisine/products/sazonadores-card-v3.webp",
    imageAlt: "Sazonadores Guaurritas de pollo y res",
    options: [
      { label: "Res · 60 g", price: 119 },
      { label: "Pollo · 60 g", price: 119 },
    ],
    detail:
      "Línea para perros y gatos disponible en sabor res o pollo. Contenido neto de 60 g.",
    badge: "Nuevo",
    imageTone: "#dce8ef",
  },
  {
    id: "sticks",
    name: "GuaurriSticks",
    eyebrow: "Snack sin carnaza",
    category: "snacks",
    description: "Sticks para perro, prácticos para premiar y consentir.",
    image: "/cuisine/products/sticks-card-v4.webp",
    imageAlt: "Sticks Guaurritas sostenidos en una mano",
    options: [{ label: "Bolsa con 10 sticks", price: 79 }],
    detail: "Snack para perros sin carnaza. Cada bolsita contiene 10 sticks.",
    badge: "Nuevo",
    imageTone: "#e6edf5",
    imageScale: 1.2,
  },
  {
    id: "petcakes",
    name: "Petcakes",
    eyebrow: "Pasteles pet",
    category: "petcakes",
    description: "Elige tamaño, proteína y decoración para su celebración.",
    image: "/cuisine/products/petcakes-transparent.png",
    imageAlt: "Petcake grande decorado para una celebración",
    options: [
      { label: "Chico · betún", price: 150 },
      { label: "Chico · fondant", price: 250 },
      { label: "Mediano · betún", price: 305 },
      { label: "Mediano · fondant", price: 375 },
      { label: "Grande · betún", price: 405 },
      { label: "Grande · fondant", price: 475 },
      { label: "Plus grande · betún", price: 625 },
      { label: "Plus grande · fondant", price: 895 },
    ],
    detail:
      "Proteínas para lomitos: pollo, res o mixto. Para michis: atún, pollo o hígado.",
    customizable: true,
    badge: "Personalizable",
    imageTone: "#dceef0",
  },
  {
    id: "cupcakes",
    name: "Cupcakes",
    eyebrow: "Repostería pet",
    category: "bakery",
    description: "Un detalle pequeño para cumpleaños y mesas dulces.",
    image: "/cuisine/products/cupcakes-card-v4.webp",
    imageAlt: "Cupcake decorado para mascotas",
    options: [
      { label: "Individual", price: 40 },
      { label: "Caja de 4", price: 150 },
    ],
    detail:
      "Proteínas para lomitos: pollo, res o mixto. Para michis: atún, pollo o hígado.",
    customizable: true,
    imageTone: "#f3e0e6",
    imageScale: 1.15,
  },
  {
    id: "cake-pops",
    name: "Cake Pops",
    eyebrow: "Repostería pet",
    category: "bakery",
    description: "Un par de bocaditos para regalar o completar su mesa dulce.",
    image: "/cuisine/products/cake-pops-card-v4.webp",
    imageAlt: "Tres Cake Pops decorados para mascotas",
    options: [{ label: "Pareja", price: 40 }],
    detail:
      "Proteínas para lomitos: pollo, res o mixto. Para michis: atún, pollo o hígado.",
    customizable: true,
    imageTone: "#f5e3e8",
    imageScale: 1.18,
  },
  {
    id: "dognuts",
    name: "Dognuts",
    eyebrow: "Repostería pet",
    category: "bakery",
    description: "Donitas coloridas para regalar o montar una celebración.",
    image: "/cuisine/products/dognuts-transparent.png",
    imageAlt: "Dognuts de colores para mascotas",
    options: [
      { label: "Pack de 3", price: 105 },
      { label: "Pack de 4", price: 140 },
    ],
    detail:
      "Disponibles para lomitos y michis con la proteína apropiada para cada especie.",
    customizable: true,
    imageTone: "#e8e0f0",
  },
  {
    id: "perrundas",
    name: "Perrundas",
    eyebrow: "Repostería pet",
    category: "bakery",
    description: "Premios de arroz, proteína de res y complemento de verduras.",
    image: "/cuisine/products/perrundas-card-v4.webp",
    imageAlt: "Perrundas envueltas y presentadas sobre una charola",
    options: [{ label: "Pack de 4", price: 80 }],
    detail:
      "Una presentación de cuatro piezas para sumar a una celebración o disfrutar como premio complementario.",
    imageTone: "#e5efe8",
    imageScale: 1.15,
  },
  {
    id: "chilaquidogs",
    name: "ChilaquiDogs",
    eyebrow: "Antojería pet",
    category: "antojitos",
    description: "Chilaquiles pet estilo Guaurritas para lomitos.",
    image: "/cuisine/products/chilaquidogs-card-v4.webp",
    imageAlt: "ChilaquiDogs servido en una cajita",
    options: [
      { label: "Petit", price: 65 },
      { label: "Grande", price: 85 },
    ],
    detail: "Elige proteína de res o pollo y salsa roja o verde.",
    imageTone: "#edf1f5",
    imageScale: 1.18,
  },
  {
    id: "pizzet",
    name: "Pizzet",
    eyebrow: "Antojería pet",
    category: "antojitos",
    description: "Pizza individual pet con proteína de res.",
    image: "/cuisine/products/pizzet-card-v4.webp",
    imageAlt: "Pizzet individual para mascota dentro de una caja",
    options: [{ label: "Individual", price: 60 }],
    detail:
      "Antojito especial pensado como premio complementario para lomitos.",
    imageTone: "#eee6dc",
    imageScale: 1.18,
  },
  {
    id: "happy-box",
    name: "Happy Box",
    eyebrow: "Regalo & celebración",
    category: "birthday",
    description: "Cajita surtida de premios Guaurritas más juguete.",
    image: "/cuisine/products/happy-box-card-v3.webp",
    imageAlt: "Caja de regalo Happy Box de Guaurritas",
    options: [
      { label: "Happy Box", price: 160 },
      { label: "Happy Box Deluxe", price: 210 },
    ],
    detail:
      "Ideal para regalo, cumpleaños pequeño o para probar una selección de premios.",
    customizable: true,
    imageTone: "#e8eef1",
  },
  {
    id: "gorrito",
    name: "B’day gorrito",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description: "El toque de fiesta para completar su cumpleaños y sus fotos.",
    image: "/cuisine/products/gorrito-transparent.png",
    imageAlt: "Gorrito azul de cumpleaños para mascota",
    options: [{ label: "Gorrito", price: 50 }],
    detail: "Accesorio de cumpleaños disponible como extra para tu pedido especial.",
    badge: "Nuevo",
    imageTone: "#dceef2",
  },
  {
    id: "velitas",
    name: "Velitas",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description: "Una velita para cerrar el festejo como se merece.",
    image: "/cuisine/products/velitas-transparent.png",
    imageAlt: "Velitas rosas de números para cumpleaños",
    options: [
      { label: "Velita chica", price: 10 },
      { label: "Velita grande", price: 40 },
    ],
    detail: "Elige tamaño y confirma el número que necesitas al personalizar el pedido.",
    customizable: true,
    badge: "Nuevo",
    imageTone: "#f4e2ea",
  },
  {
    id: "pancarta",
    name: "Pancarta",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description: "Banderines para vestir su mesa, sesión o rincón de cumpleaños.",
    image: "/cuisine/products/pancarta-card-v2.png",
    imageAlt: "Pancarta colorida de Happy Birthday",
    options: [{ label: "Pancarta", price: 80 }],
    detail: "Pancarta decorativa para completar su celebración o pedido especial.",
    badge: "Nuevo",
    imageTone: "#f2e6db",
  },
];

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function priceFrom(product: CuisineProduct) {
  const prices = product.options.map((option) => option.price);
  const lowest = Math.min(...prices);
  return prices.some((price) => price !== lowest)
    ? `Desde ${money(lowest)}`
    : money(lowest);
}

export default function CuisineStoreApp({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<CuisineProduct | null>(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [customize, setCustomize] = useState<"yes" | "no" | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesSearch =
        !normalizedQuery ||
        `${product.name} ${product.eyebrow} ${product.description}`
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  const openProduct = (product: CuisineProduct) => {
    setSelectedProduct(product);
    setSelectedOption(0);
    setCustomize(null);
    setNotice("");
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    setCartCount((count) => count + 1);
    setNotice(`${selectedProduct.name} se agregó al carrito.`);
  };

  if (selectedProduct) {
    const currentOption = selectedProduct.options[selectedOption];
    const needsChoice = selectedProduct.customizable && customize === null;
    const canAdd = !needsChoice;

    return (
      <section className="-m-4 min-h-[32rem] bg-white sm:-m-6">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#b9c8d8] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#425b8c] hover:text-[#263650]"
          >
            ← Volver al catálogo
          </button>
          <span className="rounded-full border border-[#8ba9b5] bg-[#e8f2f4] px-3 py-1.5 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
            Carrito · {cartCount}
          </span>
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-10">
          <div>
            <div
              className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#b7c6ce]"
              style={{ backgroundColor: selectedProduct.imageTone }}
            >
              <span
                className="absolute inset-0"
                style={{ transform: `scale(${selectedProduct.imageScale ?? 1})` }}
              >
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.imageAlt}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="object-contain p-7 sm:p-10"
                />
              </span>
              {selectedProduct.badge && (
                <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-[#263650] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.13em] text-white shadow-sm">
                  {selectedProduct.badge}
                </span>
              )}
            </div>
            <p className="mt-3 text-center font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
              Fotografía del catálogo Guaurritas
            </p>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-interface text-[10px] font-bold uppercase tracking-[0.2em] text-[#5e96a5]">
              {selectedProduct.eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-[#263650] sm:text-4xl">
              {selectedProduct.name}
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-7 text-[#53627a]">
              {selectedProduct.description}
            </p>
            <p className="mt-4 font-interface text-sm leading-6 text-[#657287]">
              {selectedProduct.detail}
            </p>

            <fieldset className="mt-7">
              <legend className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                Elige una presentación
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedProduct.options.map((option, index) => (
                  <button
                    key={`${option.label}-${option.price}`}
                    type="button"
                    onClick={() => setSelectedOption(index)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left font-interface text-xs transition ${
                      selectedOption === index
                        ? "border-[#425b8c] bg-[#e5edf4] text-[#263650] shadow-[2px_2px_0_#425b8c]"
                        : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#7c9cab]"
                    }`}
                  >
                    <span>{option.label}</span>
                    <strong>{money(option.price)}</strong>
                  </button>
                ))}
              </div>
            </fieldset>

            {selectedProduct.customizable && (
              <div className="mt-7 rounded-2xl border border-[#d2a5ad] bg-[#fcf2f4] p-4 sm:p-5">
                <p className="font-interface text-xs font-bold uppercase tracking-[0.1em] text-[#263650]">
                  ¿Quieres personalizar tu producto?
                </p>
                <div className="mt-3 flex gap-2">
                  {(["yes", "no"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setCustomize(choice)}
                      className={`min-w-20 rounded-full border px-4 py-2 font-interface text-xs font-bold ${
                        customize === choice
                          ? "border-[#a66271] bg-[#a66271] text-white"
                          : "border-[#d2a5ad] bg-white text-[#7a5660]"
                      }`}
                    >
                      {choice === "yes" ? "Sí" : "No"}
                    </button>
                  ))}
                </div>

                {customize === "yes" && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="font-interface text-[11px] font-semibold text-[#53627a]">
                      Nombre de tu mascota
                      <input
                        type="text"
                        className="mt-1.5 w-full rounded-lg border border-[#d2a5ad] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#a66271]"
                        placeholder="Ej. Bruno"
                      />
                    </label>
                    <label className="font-interface text-[11px] font-semibold text-[#53627a]">
                      Tema, colores o número
                      <input
                        type="text"
                        className="mt-1.5 w-full rounded-lg border border-[#d2a5ad] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#a66271]"
                        placeholder="Cuéntanos tu idea"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 border-t border-[#d6dee5] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
                  {currentOption.label}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#263650]">
                  {money(currentOption.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!canAdd}
                className="border-2 border-[#263650] bg-[#263650] px-6 py-3.5 font-interface text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#77aab6] transition hover:-translate-y-0.5 hover:bg-[#425b8c] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                Agregar al carrito
              </button>
            </div>

            {notice && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-[#89a79a] bg-[#edf6f0] px-4 py-3 font-interface text-xs font-semibold text-[#446454]"
              >
                ✓ {notice}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="-m-4 min-h-[32rem] bg-white sm:-m-6">
      <div className="border-b border-[#b9c8d8] bg-[#eef5f7] px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#425b8c] hover:text-[#263650] sm:text-xs"
          >
            ← Guaurriverse
          </button>
          <p className="hidden font-interface text-[10px] font-bold uppercase tracking-[0.18em] text-[#5e7685] sm:block">
            GuaurritasCuisine.exe
          </p>
          <span className="rounded-full border border-[#8ba9b5] bg-white px-3 py-1.5 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
            Carrito · {cartCount}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-9">
        <header className="grid items-end gap-6 border-b border-[#c8d5dc] pb-7 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="font-interface text-[10px] font-bold uppercase tracking-[0.22em] text-[#5e96a5]">
              ✦ Menú Guaurritas Cuisine ✦
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight text-[#263650] sm:text-4xl">
              Premios, antojitos y repostería hechos para ellos
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#53627a] sm:text-base">
              Elige según especie, proteína y momento de consumo. Para celebrar,
              premiar o consentir sin improvisar.
            </p>
          </div>
          <div className="hidden rotate-1 border-2 border-[#425b8c] bg-white px-5 py-4 text-center shadow-[4px_4px_0_#9bc3ca] lg:block">
            <span className="block font-serif text-lg font-semibold text-[#263650]">
              Hecho para ellos
            </span>
            <span className="mt-1 block font-interface text-[9px] uppercase tracking-[0.16em] text-[#68808c]">
              Con el sello Guaurritas
            </span>
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`shrink-0 rounded-full border px-4 py-2 font-interface text-[10px] font-bold uppercase tracking-[0.09em] transition ${
                  category === item.id
                    ? "border-[#263650] bg-[#263650] text-white"
                    : "border-[#b8c8d1] bg-white text-[#5f7180] hover:border-[#5e96a5] hover:bg-[#eef5f7]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="relative block w-full xl:w-72">
            <span className="sr-only">Buscar en el menú</span>
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6c8190]"
              aria-hidden="true"
            >
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar en el menú..."
              className="w-full rounded-full border border-[#b8c8d1] bg-white py-2.5 pl-9 pr-4 text-xs text-[#263650] outline-none placeholder:text-[#8997a3] focus:border-[#5e96a5]"
            />
          </label>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openProduct(product)}
              className="group overflow-hidden rounded-[1.4rem] border border-[#c2cdd3] bg-white text-left shadow-[0_8px_18px_rgba(38,54,80,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#6f99a5] hover:shadow-[0_15px_28px_rgba(38,54,80,0.14)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#5e96a5]"
            >
              <span
                className="relative block aspect-[4/3] overflow-hidden border-b border-[#cbd5da]"
                style={{ backgroundColor: product.imageTone }}
              >
                <span
                  className="absolute inset-0"
                  style={{ transform: `scale(${product.imageScale ?? 1})` }}
                >
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 44vw, 23vw"
                    className="object-contain p-5 transition duration-500 group-hover:scale-105"
                  />
                </span>
                {product.badge && (
                  <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-[#263650] px-2.5 py-1 font-interface text-[8px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                    {product.badge}
                  </span>
                )}
              </span>
              <span className="block p-4">
                <span className="font-interface text-[9px] font-bold uppercase tracking-[0.16em] text-[#6b96a1]">
                  {product.eyebrow}
                </span>
                <span className="mt-1.5 flex items-start justify-between gap-3">
                  <span className="font-serif text-lg font-semibold leading-snug text-[#263650]">
                    {product.name}
                  </span>
                  <span className="shrink-0 font-interface text-xs font-bold text-[#a66271]">
                    {priceFrom(product)}
                  </span>
                </span>
                <span className="mt-2 block min-h-10 font-interface text-[11px] leading-5 text-[#718093]">
                  {product.description}
                </span>
                <span className="mt-4 flex items-center justify-between border-t border-[#d7dfe3] pt-3 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#425b8c]">
                  Ver producto
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e4f0f2] text-base transition group-hover:bg-[#5e96a5] group-hover:text-white"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>

        {visibleProducts.length === 0 && (
          <div className="mt-7 border border-dashed border-[#9fb1bb] px-6 py-12 text-center">
            <p className="font-serif text-xl font-semibold text-[#263650]">
              No encontramos ese producto
            </p>
            <p className="mt-2 font-interface text-xs text-[#718093]">
              Prueba con otro nombre o cambia la categoría.
            </p>
          </div>
        )}

        <footer className="mt-9 border-t border-[#c8d5dc] pt-5 text-center font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
          Premios complementarios · No sustituyen su alimento diario
        </footer>
      </div>
    </section>
  );
}
