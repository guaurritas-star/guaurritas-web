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

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWeight(grams: number) {
  return grams >= 1000
    ? `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(
        grams / 1000,
      )} kg`
    : `${grams} g`;
}

function cookiePrice(grams: number) {
  const base = grams * 0.6;
  return Math.round(base * (grams >= 2000 ? 0.95 : 1));
}

function emptyDistribution(total = 300) {
  return Object.fromEntries(
    cookieFlavors.map((flavor, index) => [flavor, index === 0 ? total : 0]),
  ) as Record<CookieFlavor, number>;
}

export default function NationalCuisineStoreApp({ onBack }: { onBack: () => void }) {
  const { count } = useCart();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [cookieGrams, setCookieGrams] = useState(300);
  const [cookieDistribution, setCookieDistribution] =
    useState<Record<CookieFlavor, number>>(() => emptyDistribution(300));
  const [notice, setNotice] = useState("");

  const assignedCookieGrams = useMemo(
    () => Object.values(cookieDistribution).reduce((sum, grams) => sum + grams, 0),
    [cookieDistribution],
  );

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

  const changeCookieTotal = (next: number) => {
    const safe = Math.min(4900, Math.max(300, Math.round(next / 100) * 100));
    setCookieGrams(safe);
    setCookieDistribution(emptyDistribution(safe));
  };

  const addCookies = () => {
    if (assignedCookieGrams !== cookieGrams) {
      setNotice(`Distribuye exactamente ${formatWeight(cookieGrams)} antes de agregar.`);
      return;
    }

    const distribution = cookieFlavors
      .filter((flavor) => cookieDistribution[flavor] > 0)
      .map(
        (flavor) =>
          `${cookieDistribution[flavor]} g de ${flavor.toLocaleLowerCase("es")}`,
      )
      .join(", ");

    addCartItem({
      id: `cuisine:guaurricookies:${cookieGrams}:${distribution}`,
      name: "GuaurriCookies",
      detail: `${formatWeight(cookieGrams)} · ${distribution}`,
      unitPrice: cookiePrice(cookieGrams),
      image: "/cuisine/products/guaurricookies-vitrolero.webp",
      fulfillment: "national",
    });

    setNotice(`GuaurriCookies ${formatWeight(cookieGrams)} se agregaron a envío nacional.`);
  };

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
              Aquí mostramos únicamente productos preparados para paquetería. Los
              alimentos frescos y decoraciones delicadas siguen disponibles en
              Entrega en León.
            </p>
          </div>

          <span className="rounded-full border border-[#8ba9b5] bg-[#e8f2f4] px-3 py-2 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
            Carrito · {count}
          </span>
        </header>

        <article className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#b7c6ce] bg-[#f8fbfc]">
          <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="relative min-h-64 bg-[#eef4f5] p-6">
              <div className="relative h-full min-h-56">
                <Image
                  src={withBasePath("/cuisine/products/guaurricookies-vitrolero.webp")}
                  alt="GuaurriCookies para envío nacional"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 28rem"
                  className="object-contain p-4"
                />
              </div>
              <span className="absolute left-4 top-4 rounded-full bg-[#263650] px-3 py-1.5 font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                Envío nacional
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <p className="font-interface text-[10px] font-bold uppercase tracking-[0.18em] text-[#5e96a5]">
                Premios horneados
              </p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-[#263650]">
                GuaurriCookies a granel
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#657287]">
                Elige de 300 g a 4.9 kg en pasos de 100 g y reparte el total entre
                tus sabores favoritos.
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <label className="font-interface text-[10px] font-bold uppercase tracking-[0.1em] text-[#53627a]">
                  Cantidad total
                  <select
                    value={cookieGrams}
                    onChange={(event) => changeCookieTotal(Number(event.target.value))}
                    className="mt-1 block min-w-40 rounded-xl border border-[#b9c8d8] bg-white px-3 py-2.5 text-xs text-[#263650]"
                  >
                    {Array.from({ length: 47 }, (_, index) => 300 + index * 100).map(
                      (grams) => (
                        <option key={grams} value={grams}>
                          {formatWeight(grams)}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <div>
                  <p className="font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#718093]">
                    Precio
                  </p>
                  <strong className="font-serif text-2xl text-[#263650]">
                    {money(cookiePrice(cookieGrams))}
                  </strong>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {cookieFlavors.map((flavor) => (
                  <label
                    key={flavor}
                    className="rounded-xl border border-[#d1dce1] bg-white p-3 font-interface text-[10px] font-bold text-[#53627a]"
                  >
                    {flavor}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={cookieGrams}
                        step={100}
                        value={cookieDistribution[flavor]}
                        onChange={(event) =>
                          setCookieDistribution((current) => ({
                            ...current,
                            [flavor]: Math.max(0, Number(event.target.value) || 0),
                          }))
                        }
                        className="w-full rounded-lg border border-[#b9c8d8] px-3 py-2 text-center text-xs text-[#263650]"
                      />
                      <span>g</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p
                  className={`font-interface text-[10px] font-semibold ${
                    assignedCookieGrams === cookieGrams
                      ? "text-[#456a4e]"
                      : "text-[#9f5860]"
                  }`}
                >
                  {assignedCookieGrams} / {cookieGrams} g distribuidos
                </p>
                <button
                  type="button"
                  onClick={addCookies}
                  disabled={assignedCookieGrams !== cookieGrams}
                  className="border-2 border-[#263650] bg-[#263650] px-5 py-3 font-interface text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_#77aab6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const optionIndex = selectedOptions[product.id] ?? 0;
            const option = product.options[optionIndex] ?? product.options[0];

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-[1.35rem] border border-[#c4d0d8] bg-white shadow-[0_8px_18px_rgba(38,54,80,0.08)]"
              >
                <div
                  className="relative aspect-[4/3]"
                  style={{ backgroundColor: product.imageTone }}
                >
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
                      {money(option.price)}
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
          <p
            role="status"
            className="mt-5 rounded-xl border border-[#89a79a] bg-[#edf6f0] px-4 py-3 font-interface text-xs font-semibold text-[#446454]"
          >
            ✓ {notice}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-[#d5c3a5] bg-[#fbf6ec] px-4 py-4 font-interface text-[10px] leading-5 text-[#6d604f]">
          <strong className="text-[#4d4337]">Próxima fase:</strong> Pizzet Kit,
          Petcake Kit y otras versiones especiales para viajar se activarán aquí
          únicamente después de validar empaque y estabilidad.
        </div>
      </div>
    </section>
  );
}
