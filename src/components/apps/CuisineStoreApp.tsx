"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { addCartItem, useCart } from "@/lib/cart-store";
import CuisineCartDrawer from "@/components/cart/CuisineCartDrawer";
import { requestSystemCartOpen } from "@/lib/cart-events";
import { withBasePath } from "@/lib/base-path";

type CategoryId =
  | "all"
  | "snacks"
  | "petcakes"
  | "bakery"
  | "antojitos"
  | "birthday";

type ProductCategory = Exclude<CategoryId, "all">;

type GuaranteedAnalysisItem = {
  label: string;
  value: string;
};

type ProductOption = {
  label: string;
  price: number;
  grams?: number;
  image?: string;
  imageAlt?: string;
  ingredients?: string[];
  guaranteedAnalysis?: GuaranteedAnalysisItem[];
};

type PetcakeFinish = "betún" | "fondant";
type PetType = "lomito" | "michi";
type ChilaquiProtein = "Pollo" | "Res";
type ChilaquiSalsa = "Roja" | "Verde";

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

const petcakeSizes = ["Chico", "Mediano", "Grande", "Plus grande"] as const;

const proteinsByPetType: Record<PetType, readonly string[]> = {
  lomito: ["Pollo", "Res", "Mixto"],
  michi: ["Atún", "Pollo", "Hígado"],
};

const bulkFlavors = [
  "Cacahuate con tocino",
  "Pollo con calabaza",
  "Pollo con zanahoria",
  "Manzana con plátano",
] as const;

type BulkFlavor = (typeof bulkFlavors)[number];
type BulkUnit = "g" | "kg";

const cookieFlavorAnalyses: Record<
  BulkFlavor,
  GuaranteedAnalysisItem[]
> = {
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

function createEmptyBulkDistribution(): Record<BulkFlavor, number> {
  return Object.fromEntries(
    bulkFlavors.map((flavor) => [flavor, 0]),
  ) as Record<BulkFlavor, number>;
}

function formatBulkWeight(grams: number) {
  if (grams >= 1000) {
    return `${new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 1,
    }).format(grams / 1000)} kg`;
  }

  return `${grams} g`;
}

const recipeProductIds = new Set(["petcakes", "cupcakes", "cake-pops", "dognuts"]);
const nonFoodProductIds = new Set(["gorrito", "velitas", "pancarta"]);

const MAX_INSPIRATION_PHOTOS = 5;
const MAX_INSPIRATION_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_INSPIRATION_TOTAL_BYTES = 20 * 1024 * 1024;
const inspirationPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function PetRecipeFields({
  petType,
  petProtein,
  onPetTypeChange,
  onPetProteinChange,
  firstStep,
}: {
  petType: PetType | null;
  petProtein: string | null;
  onPetTypeChange: (petType: PetType) => void;
  onPetProteinChange: (protein: string) => void;
  firstStep: number;
}) {
  return (
    <>
      <fieldset className="mt-5">
        <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
          {firstStep}. ¿Para quién es?
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["lomito", "michi"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => onPetTypeChange(kind)}
              className={`rounded-xl border px-3 py-3 font-interface text-[11px] font-bold capitalize transition ${
                petType === kind
                  ? "border-[#5e96a5] bg-[#e8f2f4] text-[#263650] shadow-[2px_2px_0_#5e96a5]"
                  : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#5e96a5]"
              }`}
            >
              {kind === "lomito" ? "🐶 Lomito" : "🐱 Michi"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
          {firstStep + 1}. Proteína
        </legend>
        {petType ? (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {proteinsByPetType[petType].map((protein) => (
              <button
                key={protein}
                type="button"
                onClick={() => onPetProteinChange(protein)}
                className={`rounded-xl border px-2 py-3 font-interface text-[10px] font-bold transition ${
                  petProtein === protein
                    ? "border-[#5e96a5] bg-[#e8f2f4] text-[#263650] shadow-[2px_2px_0_#5e96a5]"
                    : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#5e96a5]"
                }`}
              >
                {protein}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-[#b9c8d8] bg-white px-3 py-3 font-interface text-[10px] text-[#718093]">
            Primero elige lomito o michi para mostrar las proteínas disponibles.
          </p>
        )}
      </fieldset>
    </>
  );
}

const products: CuisineProduct[] = [
  {
    id: "guaurricookies",
    name: "Guaurricookies",
    eyebrow: "Premios horneados",
    category: "snacks",
    description:
      "El clásico de Cuisine: galletitas de harina de avena, horneadas sin azúcar y mezcladas a su gusto.",
    image: "/cuisine/products/guaurricookies-vitrolero.webp",
    imageAlt: "Galletas Guaurricookies horneadas para mascotas",
    options: [
      { label: "300 g", price: 180, grams: 300 },
      { label: "400 g", price: 240, grams: 400 },
      { label: "500 g", price: 300, grams: 500 },
      { label: "1 kg", price: 600, grams: 1000 },
    ],
    detail:
      "Para lomitos. Elige de 300 g a 10 kg, siempre en pasos de 100 g, y reparte el total entre uno o varios sabores: cacahuate con tocino; pollo con calabaza y coco rallado; pollo con zanahoria y cúrcuma; o manzana con plátano.",
    imageTone: "#eef4f5",
  },
  {
    id: "happy-bag",
    name: "Happy Bag",
    eyebrow: "Guaurricookies",
    category: "snacks",
    description:
      "Una probadita del recetario Guaurritas: 100 g de Guaurricookies horneadas para premiar o llevar un detalle.",
    image: "/cuisine/products/happy-bag-flavors-v6/peanut-bacon.webp",
    imageAlt: "Bolsa de treats horneados Guaurritas",
    options: [
      {
        label: "Cacahuate con tocino · 100 g",
        price: 85,
        image: "/cuisine/products/happy-bag-flavors-v6/peanut-bacon.webp",
        imageAlt: "Happy Bag sabor cacahuate con tocino",
        guaranteedAnalysis: cookieFlavorAnalyses["Cacahuate con tocino"],
      },
      {
        label: "Pollo con zanahoria · 100 g",
        price: 85,
        image: "/cuisine/products/happy-bag-flavors-v6/chicken-carrot.webp",
        imageAlt: "Happy Bag sabor pollo con zanahoria",
        guaranteedAnalysis: cookieFlavorAnalyses["Pollo con zanahoria"],
      },
      {
        label: "Pollo con calabaza · 100 g",
        price: 85,
        image: "/cuisine/products/happy-bag-flavors-v6/chicken-pumpkin.webp",
        imageAlt: "Happy Bag sabor pollo con calabaza",
        guaranteedAnalysis: cookieFlavorAnalyses["Pollo con calabaza"],
      },
      {
        label: "Manzana con plátano · 100 g",
        price: 85,
        image: "/cuisine/products/happy-bag-flavors-v6/apple-banana.webp",
        imageAlt: "Happy Bag sabor manzana con plátano",
        guaranteedAnalysis: cookieFlavorAnalyses["Manzana con plátano"],
      },
    ],
    detail:
      "Elige un sabor por bolsa: cacahuate con tocino; pollo con zanahoria y cúrcuma; pollo con calabaza y coco rallado; o manzana con plátano. Se preparan con harina de avena y sin azúcar para lomitos.",
    badge: "Favorito",
    imageTone: "#f0e5ea",
    imageScale: 1.18,
  },
  {
    id: "sazonadores",
    name: "Sazonadores",
    eyebrow: "Para elevar su bowl",
    category: "snacks",
    description:
      "Proteína deshidratada, cereales y verduras para complementar su alimento habitual con más aroma, sabor y variedad.",
    image: "/cuisine/products/sazonadores-card-v3.webp",
    imageAlt: "Sazonadores Guaurritas de pollo y res",
    options: [
      {
        label: "Res · 60 g",
        price: 119,
        ingredients: [
          "Res deshidratada",
          "Camote",
          "Avena",
          "Arroz inflado",
          "Betabel",
          "Zanahoria",
          "Calabaza",
          "Nopal",
        ],
        guaranteedAnalysis: [
          { label: "Proteína", value: "25%" },
          { label: "Grasa cruda", value: "4%" },
          { label: "Carbohidratos", value: "30%" },
          { label: "Fibra", value: "6%" },
          { label: "Humedad", value: "5%" },
          { label: "Cenizas", value: "4%" },
        ],
      },
      {
        label: "Pollo · 60 g",
        price: 119,
        ingredients: [
          "Pollo deshidratado",
          "Calabaza",
          "Avena",
          "Zanahoria",
          "Amaranto",
          "Nopal",
        ],
        guaranteedAnalysis: [
          { label: "Proteína", value: "25%" },
          { label: "Grasa cruda", value: "9%" },
          { label: "Carbohidratos", value: "30%" },
          { label: "Fibra", value: "6%" },
          { label: "Humedad", value: "5%" },
          { label: "Cenizas", value: "4%" },
        ],
      },
    ],
    detail:
      "Para lomitos y michis. Espolvorea una pequeña cantidad sobre su alimento habitual para sumar sabor y variedad. Cada frasco contiene 60 g; selecciona res o pollo para consultar su fórmula correspondiente.",
    badge: "Nuevo",
    imageTone: "#dce8ef",
  },
  {
    id: "sticks",
    name: "GuaurriSticks",
    eyebrow: "Snack sin carnaza",
    category: "snacks",
    description:
      "Premios masticables sabor res para lomitos, elaborados sin carnaza y presentados en una práctica bolsita con 10 sticks.",
    image: "/cuisine/products/sticks-card-v5.webp",
    imageAlt: "GuaurriSticks Guaurritas sin carnaza",
    options: [
      {
        label: "Bolsa con 10 sticks",
        price: 79,
        ingredients: [
          "Harina de maíz",
          "Fibra de chícharo",
          "Glicerina vegetal",
          "Grenetina",
          "Carbonato de calcio",
          "Aceite vegetal",
          "Carne de res",
          "Dextrosa",
          "Extracto de levadura",
          "Ácido láctico",
          "Caldo de pollo",
          "Ácido sórbico como conservador",
          "Colorantes naturales (anato y riboflavina)",
        ],
        guaranteedAnalysis: [
          { label: "Proteína cruda", value: "15% mínimo" },
          { label: "Grasa cruda", value: "1.5% mínimo" },
          { label: "Fibra cruda", value: "5% máximo" },
          { label: "Ceniza", value: "10% máximo" },
          { label: "Humedad", value: "12% máximo" },
          { label: "Extracto libre de nitrógeno (ELN)", value: "56.5%" },
        ],
      },
    ],
    detail:
      "Los GuaurriSticks son una opción práctica para premiar, consentir o acompañar los paseos de tu lomito. Están elaborados sin carnaza y cuentan con una textura firme y duradera que genera fricción durante la masticación, ayudando a complementar su rutina de cuidado bucal mientras disfruta su sabor.",
    badge: "Nuevo",
    imageTone: "#e6edf5",
    imageScale: 1,
  },
  {
    id: "petcakes",
    name: "Petcakes",
    eyebrow: "Pasteles pet",
    category: "petcakes",
    description:
      "El centro de su fiesta, hecho para su pancita y vestido para su momento más Guaurritas.",
    image: "/cuisine/products/petcakes-transparent.png",
    imageAlt: "Petcake grande decorado para una celebración",
    options: [
      {
        label: "Chico · betún",
        price: 150,
        image: "/cuisine/products/petcakes-sizes-v2/chico.webp",
        imageAlt: "Petcake chico personalizado para michi",
      },
      {
        label: "Chico · fondant",
        price: 250,
        image: "/cuisine/products/petcakes-sizes-v2/chico.webp",
        imageAlt: "Petcake chico personalizado para michi",
      },
      {
        label: "Mediano · betún",
        price: 305,
        image: "/cuisine/products/petcakes-sizes-v2/mediano.webp",
        imageAlt: "Petcake mediano con decoración de Halloween",
      },
      {
        label: "Mediano · fondant",
        price: 375,
        image: "/cuisine/products/petcakes-sizes-v2/mediano.webp",
        imageAlt: "Petcake mediano con decoración de Halloween",
      },
      { label: "Grande · betún", price: 405 },
      { label: "Grande · fondant", price: 475 },
      {
        label: "Plus grande · betún",
        price: 625,
        image: "/cuisine/products/petcakes-sizes-v2/plus-grande.webp",
        imageAlt: "Petcake plus grande con decoración colorida",
      },
      {
        label: "Plus grande · fondant",
        price: 895,
        image: "/cuisine/products/petcakes-sizes-v2/plus-grande.webp",
        imageAlt: "Petcake plus grande con decoración colorida",
      },
    ],
    detail:
      "Su base se prepara con harina de avena e ingredientes naturales. El betún es a base de papa; el fondant pet se elabora con leche deslactosada, ingredientes naturales y probióticos. Elige tamaño, acabado, lomito o michi, proteína y decoración; después puedes enviarnos hasta 5 fotos de inspiración.",
    customizable: true,
    badge: "Personalizable",
    imageTone: "#dceef0",
  },
  {
    id: "cupcakes",
    name: "Cupcakes",
    eyebrow: "Repostería pet",
    category: "bakery",
    description:
      "Una mini celebración horneada para que lomitos y michis también tengan su momento Cuisine.",
    image: "/cuisine/products/cupcakes-card-v4.webp",
    imageAlt: "Cupcake decorado para mascotas",
    options: [
      { label: "Individual", price: 40 },
      { label: "Caja de 4", price: 150 },
    ],
    detail:
      "Se preparan con harina de avena e ingredientes naturales. Puedes pedir uno o una caja de 4, elegir lomito o michi y seleccionar su proteína: pollo, res o mixto para lomitos; atún, pollo o hígado para michis.",
    customizable: true,
    imageTone: "#f3e0e6",
    imageScale: 1.15,
  },
  {
    id: "cake-pops",
    name: "Cake Pops",
    eyebrow: "Repostería pet",
    category: "bakery",
    description:
      "Dos bocaditos de fiesta para sumar color, proteína y espíritu Guaurritas a su mesa dulce.",
    image: "/cuisine/products/cake-pops-card-v4.webp",
    imageAlt: "Tres Cake Pops decorados para mascotas",
    options: [{ label: "Pareja", price: 40 }],
    detail:
      "La presentación incluye 2 Cake Pops elaborados con harina de avena, ingredientes naturales y fondant especial para mascotas. Elige lomito o michi y su proteína: pollo, res o mixto; o atún, pollo o hígado, respectivamente.",
    customizable: true,
    imageTone: "#f5e3e8",
    imageScale: 1.18,
  },
  {
    id: "dognuts",
    name: "Dognuts",
    eyebrow: "Repostería pet",
    category: "bakery",
    description:
      "Donitas horneadas, coloridas y listas para convertir cualquier festejo en capítulo del Guaurriverse.",
    image: "/cuisine/products/dognuts-card-v7.webp",
    imageAlt: "Cuatro Dognuts decoradas como caritas de lomitos",
    options: [
      { label: "Pack de 3", price: 105 },
      { label: "Pack de 4", price: 140 },
    ],
    detail:
      "Hechas con harina de avena, ingredientes naturales y fondant especial para mascotas. Elige pack de 3 o 4, lomito o michi y la proteína correspondiente: pollo, res o mixto; o atún, pollo o hígado.",
    customizable: true,
    imageTone: "#e8e0f0",
  },
  {
    id: "perrundas",
    name: "Perrundas",
    eyebrow: "Repostería pet",
    category: "bakery",
    description:
      "La corunda se volvió Perrunda: un antojito Cuisine de arroz, res y verduras para lomitos.",
    image: "/cuisine/products/perrundas-card-v4.webp",
    imageAlt: "Perrundas envueltas y presentadas sobre una charola",
    options: [{ label: "Pack de 4", price: 80 }],
    detail:
      "Cada pedido incluye 4 piezas elaboradas con base de arroz, proteína de res y verduras. Son ideales para compartir durante una celebración o repartir como premios ocasionales.",
    imageTone: "#e5efe8",
    imageScale: 1.15,
  },
  {
    id: "chilaquidogs",
    name: "ChilaquiDogs",
    eyebrow: "Antojería pet",
    category: "antojitos",
    description:
      "El desayuno más mexicano entró a Cuisine: ChilaquiDogs para lomitos, con totopos de avena y salsa de verduras.",
    image: "/cuisine/products/chilaquidogs-card-v4.webp",
    imageAlt: "ChilaquiDogs servido en una cajita",
    options: [
      { label: "Petit", price: 65 },
      { label: "Grande", price: 85 },
    ],
    detail:
      "Los totopos se preparan con harina de avena. Elige proteína de res o pollo y salsa roja de zanahoria con manzana, o verde de calabaza con manzana. La receta incorpora probióticos y está disponible en tamaño Petit o Grande.",
    imageTone: "#edf1f5",
    imageScale: 1.18,
  },
  {
    id: "pizzet",
    name: "Pizzet",
    eyebrow: "Antojería pet",
    category: "antojitos",
    description:
      "Una pizza que sí pertenece a su menú: pequeña, horneada y hecha especialmente para lomitos.",
    image: "/cuisine/products/pizzet-card-v4.webp",
    imageAlt: "Pizzet individual para mascota dentro de una caja",
    options: [{ label: "Individual", price: 60 }],
    detail:
      "La Pizzet individual se prepara con harina de avena, zanahoria, manzana y carne de res. Es un antojito para perro pensado como premio complementario, no como reemplazo de su comida habitual.",
    imageTone: "#eee6dc",
    imageScale: 1.18,
  },
  {
    id: "happy-box",
    name: "Happy Box",
    eyebrow: "Regalo & celebración",
    category: "birthday",
    description:
      "Una caja sorpresa del Guaurriverse con premios surtidos y un juguete para regalar sin improvisar.",
    image: "/cuisine/products/happy-box-card-v3.webp",
    imageAlt: "Caja de regalo Happy Box de Guaurritas",
    options: [
      { label: "Happy Box", price: 160 },
      { label: "Happy Box Deluxe", price: 210 },
    ],
    detail:
      "Elige Happy Box o Happy Box Deluxe. Ambas reúnen una selección surtida de premios Guaurritas más un juguete; el contenido puede variar según disponibilidad y puedes contarnos para quién es al personalizar el pedido.",
    customizable: true,
    imageTone: "#e8eef1",
  },
  {
    id: "gorrito",
    name: "B’day gorrito",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description:
      "El uniforme oficial de quien cumple años en el Guaurriverse: listo para la foto y el apapacho.",
    image: "/cuisine/products/gorrito-transparent.png",
    imageAlt: "Gorrito azul de cumpleaños para mascota",
    options: [{ label: "Gorrito", price: 50 }],
    detail:
      "Incluye un gorrito de cumpleaños como extra decorativo. Colócalo solo durante la celebración y siempre con supervisión para que el festejado esté cómodo.",
    badge: "Nuevo",
    imageTone: "#dceef2",
  },
  {
    id: "velitas",
    name: "Velitas",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description:
      "Porque toda vuelta al sol merece su número, su foto y su deseo dentro del Guaurriverse.",
    image: "/cuisine/products/velitas-transparent.png",
    imageAlt: "Velitas rosas de números para cumpleaños",
    options: [
      { label: "Velita chica", price: 10 },
      { label: "Velita grande", price: 40 },
    ],
    detail:
      "Elige velita chica o grande y escribe el número al personalizar. Es un elemento decorativo: mantenlo fuera del alcance de la mascota y retíralo del pastel antes de servir.",
    customizable: true,
    badge: "Nuevo",
    imageTone: "#f4e2ea",
  },
  {
    id: "pancarta",
    name: "Pancarta",
    eyebrow: "Extra de celebración",
    category: "birthday",
    description:
      "Banderines para declarar oficialmente que hoy su rincón pertenece al Guaurriverse.",
    image: "/cuisine/products/pancarta-card-v2.png",
    imageAlt: "Pancarta colorida de Happy Birthday",
    options: [{ label: "Pancarta", price: 80 }],
    detail:
      "Incluye una pancarta decorativa de cumpleaños para vestir la mesa, la sesión de fotos o su rincón de celebración. No incluye pastel ni otros accesorios.",
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
  const [petcakeSize, setPetcakeSize] = useState(0);
  const [petcakeFinish, setPetcakeFinish] =
    useState<PetcakeFinish | null>(null);
  const [petType, setPetType] = useState<PetType | null>(null);
  const [petProtein, setPetProtein] = useState<string | null>(null);
  const [chilaquiProtein, setChilaquiProtein] =
    useState<ChilaquiProtein | null>(null);
  const [chilaquiSalsa, setChilaquiSalsa] =
    useState<ChilaquiSalsa | null>(null);
  const [bulkFlavorGrams, setBulkFlavorGrams] = useState<
    Record<BulkFlavor, number>
  >(createEmptyBulkDistribution);
  const [bulkUnit, setBulkUnit] = useState<BulkUnit>("g");
  const [bulkQuantityInput, setBulkQuantityInput] = useState("300");
  const [inspirationPhotos, setInspirationPhotos] = useState<File[]>([]);
  const [inspirationFeedback, setInspirationFeedback] = useState("");
  const [inspirationInputKey, setInspirationInputKey] = useState(0);
  const [personalizationPetName, setPersonalizationPetName] = useState("");
  const [personalizationIdea, setPersonalizationIdea] = useState("");
  const [notice, setNotice] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const productViewRef = useRef<HTMLElement | null>(null);
  const { count: cartCount } = useCart();

  const openCartDrawer = () => {
    setCartOpen(true);

    window.requestAnimationFrame(() => {
      const scrollContainer =
        productViewRef.current?.closest(".retro-window-content");

      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    });
  };

  const continueFromCuisineCart = () => {
    setCartOpen(false);
    requestSystemCartOpen();
  };

  const inspirationPreviews = useMemo(
    () =>
      inspirationPhotos.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [inspirationPhotos],
  );

  useEffect(
    () => () => {
      inspirationPreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    },
    [inspirationPreviews],
  );

  useEffect(() => {
    if (!selectedProduct) return;

    const frame = window.requestAnimationFrame(() => {
      const scrollContainer = productViewRef.current?.closest(".retro-window-content");
      if (scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedProduct]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesSearch =
        !normalizedQuery ||
        `${product.name} ${product.eyebrow} ${product.description}`
          .concat(` ${product.detail}`)
          .toLocaleLowerCase("es")
          .includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [category, query]);

  const openProduct = (product: CuisineProduct) => {
    setSelectedProduct(product);
    setSelectedOption(0);
    setCustomize(null);
    setPetcakeSize(0);
    setPetcakeFinish(null);
    setPetType(null);
    setPetProtein(null);
    setChilaquiProtein(null);
    setChilaquiSalsa(null);
    setBulkFlavorGrams(createEmptyBulkDistribution());
    setBulkUnit("g");
    setBulkQuantityInput("300");
    setInspirationPhotos([]);
    setInspirationFeedback("");
    setInspirationInputKey((key) => key + 1);
    setPersonalizationPetName("");
    setPersonalizationIdea("");
    setNotice("");
  };

  const selectInspirationPhotos = (files: FileList | null) => {
    if (!files?.length) return;

    const existingSignatures = new Set(
      inspirationPhotos.map(
        (file) => `${file.name}-${file.size}-${file.lastModified}`,
      ),
    );
    const accepted: File[] = [];
    let totalBytes = inspirationPhotos.reduce(
      (total, file) => total + file.size,
      0,
    );
    let rejectedByFormat = 0;
    let rejectedBySize = 0;
    let rejectedByTotal = 0;
    let rejectedAsDuplicate = 0;
    let rejectedByLimit = 0;

    Array.from(files).forEach((file) => {
      const signature = `${file.name}-${file.size}-${file.lastModified}`;

      if (inspirationPhotos.length + accepted.length >= MAX_INSPIRATION_PHOTOS) {
        rejectedByLimit += 1;
      } else if (!inspirationPhotoTypes.has(file.type)) {
        rejectedByFormat += 1;
      } else if (file.size > MAX_INSPIRATION_PHOTO_BYTES) {
        rejectedBySize += 1;
      } else if (existingSignatures.has(signature)) {
        rejectedAsDuplicate += 1;
      } else if (totalBytes + file.size > MAX_INSPIRATION_TOTAL_BYTES) {
        rejectedByTotal += 1;
      } else {
        accepted.push(file);
        existingSignatures.add(signature);
        totalBytes += file.size;
      }
    });

    if (accepted.length) {
      setInspirationPhotos((current) => [...current, ...accepted]);
    }

    const messages: string[] = [];
    if (accepted.length) {
      messages.push(
        `${accepted.length} ${accepted.length === 1 ? "foto agregada" : "fotos agregadas"}`,
      );
    }
    if (rejectedByLimit) messages.push("límite de 5 fotos alcanzado");
    if (rejectedByFormat) messages.push("usa solo JPEG, PNG o WebP");
    if (rejectedBySize) messages.push("cada foto debe pesar máximo 5 MB");
    if (rejectedByTotal) messages.push("las fotos no deben superar 20 MB en total");
    if (rejectedAsDuplicate) messages.push("omitimos fotos repetidas");

    setInspirationFeedback(messages.join(" · "));
    setInspirationInputKey((key) => key + 1);
  };

  const removeInspirationPhoto = (index: number) => {
    setInspirationPhotos((current) =>
      current.filter((_, photoIndex) => photoIndex !== index),
    );
    setInspirationFeedback("Foto eliminada. Puedes agregar otra si lo necesitas.");
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
    setBulkQuantityInput(
      bulkUnit === "kg"
        ? String(Number((grams / 1000).toFixed(1)))
        : String(grams),
    );
  };

  const changeBulkFlavorInput = (flavor: BulkFlavor, value: string) => {
    const numericValue = Number(value);
    setBulkFlavorGrams((current) => ({
      ...current,
      [flavor]: value === "" || !Number.isFinite(numericValue)
        ? 0
        : Math.max(0, numericValue),
    }));
  };

  const adjustBulkFlavor = (
    flavor: BulkFlavor,
    change: -100 | 100,
    targetGrams: number,
  ) => {
    setBulkFlavorGrams((current) => {
      const assignedGrams = Object.values(current).reduce(
        (total, grams) => total + grams,
        0,
      );
      const nextFlavorGrams = current[flavor] + change;

      if (nextFlavorGrams < 0 || assignedGrams + change > targetGrams) {
        return current;
      }

      return { ...current, [flavor]: nextFlavorGrams };
    });
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const isPetcake = selectedProduct.id === "petcakes";
    const optionIndex = isPetcake
      ? petcakeSize * 2 + (petcakeFinish === "fondant" ? 1 : 0)
      : selectedOption;
    const cartOption =
      selectedProduct.options[optionIndex] ?? selectedProduct.options[0];
    const cartImage = cartOption.image ?? selectedProduct.image;

    if (selectedProduct.id === "guaurricookies") {
      const quantityValue = Number(bulkQuantityInput);
      const totalGrams = Math.round(
        bulkUnit === "kg" ? quantityValue * 1000 : quantityValue,
      );
      const distribution = bulkFlavors
        .filter((flavor) => bulkFlavorGrams[flavor] > 0)
        .map((flavor) => `${bulkFlavorGrams[flavor]} g de ${flavor.toLocaleLowerCase("es")}`)
        .join(", ");

      if (totalGrams >= 5000) {
        setNotice(
          `Solicitud de mayoreo por ${formatBulkWeight(totalGrams)}: ${distribution}. La cantidad y el precio quedan pendientes de confirmación.`,
        );
        return;
      }

      const discountRate = totalGrams >= 2000 ? 0.05 : 0;
      const calculatedPrice = Math.round(
        totalGrams * 0.6 * (1 - discountRate),
      );
      const detail = `${formatBulkWeight(totalGrams)} · ${distribution}`;
      addCartItem({
        id: `cuisine:${selectedProduct.id}:${totalGrams}:${distribution}`,
        name: selectedProduct.name,
        detail,
        unitPrice: calculatedPrice,
        image: cartImage,
      });
      setNotice(
        `${selectedProduct.name} ${formatBulkWeight(totalGrams)} por ${money(calculatedPrice)}: ${distribution}. Se agregó al carrito.`,
      );
      return;
    }

    if (selectedProduct.id === "chilaquidogs") {
      const size = cartOption.label;
      const detail = `${size} · ${chilaquiProtein} · salsa ${chilaquiSalsa?.toLocaleLowerCase("es")}`;
      addCartItem({
        id: `cuisine:${selectedProduct.id}:${selectedOption}:${chilaquiProtein}:${chilaquiSalsa}`,
        name: selectedProduct.name,
        detail,
        unitPrice: cartOption.price,
        image: cartImage,
      });
      setNotice(
        `${selectedProduct.name} ${detail} se agregó al carrito.`,
      );
      return;
    }

    const inspirationSuffix =
      customize === "yes" && inspirationPhotos.length > 0
        ? ` con ${inspirationPhotos.length} ${
            inspirationPhotos.length === 1
              ? "foto de inspiración"
              : "fotos de inspiración"
          }`
        : "";
    const personalizationText =
      customize === "yes"
        ? [
            personalizationPetName.trim()
              ? `Mascota: ${personalizationPetName.trim()}`
              : "",
            personalizationIdea.trim()
              ? `Idea: ${personalizationIdea.trim()}`
              : "",
          ]
            .filter(Boolean)
            .join(" · ")
        : "";
    const detail = [
      cartOption.label,
      petType,
      petProtein,
      customize === "yes" ? "personalizado" : null,
    ]
      .filter(Boolean)
      .join(" · ");
    addCartItem({
      id: `cuisine:${selectedProduct.id}:${optionIndex}:${petType ?? ""}:${petProtein ?? ""}:${customize ?? ""}:${inspirationPhotos.length}:${encodeURIComponent(personalizationText).slice(0, 72)}`,
      name: selectedProduct.name,
      detail,
      personalization: personalizationText,
      unitPrice: cartOption.price,
      image: cartImage,
    });
    setNotice(`${selectedProduct.name}${inspirationSuffix} se agregó al carrito.`);
  };

  const cuisineCartTrigger = (
    <button
      type="button"
      onClick={openCartDrawer}
      aria-label={`Abrir carrito con ${cartCount} ${cartCount === 1 ? "artículo" : "artículos"}`}
      className="group flex shrink-0 items-center gap-2 rounded-full border border-[#8ba9b5] bg-white px-2.5 py-1.5 font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650] shadow-[1px_1px_0_rgba(66,91,140,0.12)] transition hover:border-[#a66d88] hover:bg-[#fff7fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#425b8c]"
    >
      <span className="relative h-7 w-7 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
        <Image
          src={withBasePath("/icons/desktop/taskbar-cart.webp")}
          alt=""
          fill
          unoptimized
          sizes="28px"
          className="object-contain"
        />
      </span>
      <span>Carrito · {cartCount}</span>
    </button>
  );

  const cuisineCartDrawer = (
    <CuisineCartDrawer
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      onContinue={continueFromCuisineCart}
    />
  );

  if (selectedProduct) {
    const isPetcake = selectedProduct.id === "petcakes";
    const isBulkCookies = selectedProduct.id === "guaurricookies";
    const isChilaquidogs = selectedProduct.id === "chilaquidogs";
    const isSticks = selectedProduct.id === "sticks";
    const isEdibleProduct = !nonFoodProductIds.has(selectedProduct.id);
    const needsRecipe = recipeProductIds.has(selectedProduct.id);
    const usesDecorationPersonalization = recipeProductIds.has(selectedProduct.id);
    const petcakeFinishOffset = petcakeFinish === "fondant" ? 1 : 0;
    const currentOption = isPetcake
      ? selectedProduct.options[petcakeSize * 2 + petcakeFinishOffset]
      : selectedProduct.options[selectedOption];
    const currentProductImage = currentOption.image ?? selectedProduct.image;
    const currentProductImageAlt =
      currentOption.imageAlt ?? selectedProduct.imageAlt;
    const bulkNumericInput = Number(bulkQuantityInput);
    const bulkEnteredGrams =
      isBulkCookies && bulkQuantityInput.trim() !== "" && Number.isFinite(bulkNumericInput)
        ? bulkUnit === "kg"
          ? Math.round(bulkNumericInput * 1000)
          : Math.round(bulkNumericInput)
        : 0;
    const bulkQuantityIsValid =
      isBulkCookies &&
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
    const bulkAssignedGrams = Object.values(bulkFlavorGrams).reduce(
      (total, grams) => total + grams,
      0,
    );
    const bulkRemainingGrams = bulkTargetGrams - bulkAssignedGrams;
    const bulkFlavorIncrementsAreValid = Object.values(bulkFlavorGrams).every(
      (grams) => Number.isInteger(grams) && grams >= 0 && grams % 100 === 0,
    );
    const bulkDistributionSummary = bulkFlavors
      .filter((flavor) => bulkFlavorGrams[flavor] > 0)
      .map((flavor) => `${bulkFlavorGrams[flavor]} g ${flavor.toLocaleLowerCase("es")}`)
      .join(" · ");
    const bulkDistributionIsComplete =
      isBulkCookies &&
      bulkQuantityIsValid &&
      bulkFlavorIncrementsAreValid &&
      bulkAssignedGrams === bulkTargetGrams;
    const needsChoice = selectedProduct.customizable && customize === null;
    const needsRecipeConfiguration =
      needsRecipe && (petType === null || petProtein === null);
    const needsPetcakeFinish = isPetcake && petcakeFinish === null;
    const needsChilaquiConfiguration =
      isChilaquidogs && (chilaquiProtein === null || chilaquiSalsa === null);
    const needsBulkDistribution =
      isBulkCookies &&
      (!bulkQuantityIsValid ||
        !bulkFlavorIncrementsAreValid ||
        bulkAssignedGrams !== bulkTargetGrams);
    const canAdd =
      !needsChoice &&
      !needsRecipeConfiguration &&
      !needsPetcakeFinish &&
      !needsChilaquiConfiguration &&
      !needsBulkDistribution;

    return (
      <section ref={productViewRef} className="relative -m-4 min-h-[32rem] bg-white sm:-m-6">
        {cuisineCartDrawer}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#b9c8d8] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#425b8c] hover:text-[#263650]"
          >
            ← Volver al catálogo
          </button>
          {cuisineCartTrigger}
        </div>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-10">
          <div className="lg:sticky lg:top-24 lg:z-10 lg:w-full lg:max-w-[min(28rem,calc(100dvh-13rem))] lg:justify-self-center lg:self-start">
            <div
              className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-[#b7c6ce]"
              style={{ backgroundColor: selectedProduct.imageTone }}
            >
              <span className="absolute inset-0">
                <Image
                  src={withBasePath(currentProductImage)}
                  alt={currentProductImageAlt}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 28rem"
                  className="object-contain p-7 sm:p-10 lg:p-12"
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
            <div className="mt-5 hidden max-w-xl rounded-2xl border border-[#c8d5dc] bg-[#f8fbfc] p-4 lg:block">
              <p className="font-interface text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e96a5]">
                Antes de pedir
              </p>
              <p className="mt-2 font-interface text-sm leading-6 text-[#657287]">
                {selectedProduct.detail}
              </p>
              {isEdibleProduct && !isSticks && (
                <p className="mt-3 border-t border-[#d7e0e5] pt-3 font-interface text-[10px] leading-5 text-[#718093]">
                  <strong className="text-[#53627a]">Guía Cuisine:</strong>{" "}
                  es un premio complementario y no sustituye su alimento diario.
                  Si tu lomito o michi tiene alergias, intolerancias o una dieta
                  indicada por su veterinario, consúltanos antes de pedir.
                </p>
              )}
            </div>

            {isPetcake ? (
              <div className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                      Configura su Petcake
                    </p>
                    <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                      Completa las cuatro elecciones para continuar.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#dceef0] px-2.5 py-1 font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#425b8c]">
                    Paso a paso
                  </span>
                </div>

                <fieldset className="mt-5">
                  <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
                    1. Tamaño
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {petcakeSizes.map((size, index) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPetcakeSize(index)}
                        className={`rounded-xl border px-3 py-3 text-left font-interface text-[11px] font-semibold transition ${
                          petcakeSize === index
                            ? "border-[#425b8c] bg-[#e5edf4] text-[#263650] shadow-[2px_2px_0_#425b8c]"
                            : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#7c9cab]"
                        }`}
                      >
                        <span className="block">{size}</span>
                        <span className="mt-1 block text-[9px] font-normal text-[#718093]">
                          Desde {money(selectedProduct.options[index * 2].price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-5">
                  <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
                    2. Acabado
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["betún", "fondant"] as const).map((finish, index) => (
                      <button
                        key={finish}
                        type="button"
                        onClick={() => setPetcakeFinish(finish)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left font-interface text-[11px] transition ${
                          petcakeFinish === finish
                            ? "border-[#a66271] bg-[#fcf2f4] text-[#6f3f4a] shadow-[2px_2px_0_#a66271]"
                            : "border-[#d2c4c8] bg-white text-[#657287] hover:border-[#a66271]"
                        }`}
                      >
                        <span className="font-semibold capitalize">{finish}</span>
                        <strong>{money(selectedProduct.options[petcakeSize * 2 + index].price)}</strong>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <PetRecipeFields
                  petType={petType}
                  petProtein={petProtein}
                  onPetTypeChange={(kind) => {
                    setPetType(kind);
                    setPetProtein(null);
                  }}
                  onPetProteinChange={setPetProtein}
                  firstStep={3}
                />
              </div>
            ) : (
              <>
                {!isBulkCookies && (
                  <div
                    key={`${selectedProduct.id}-${currentOption.label}`}
                    className="mt-6 flex items-center gap-3 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-3 lg:hidden"
                    aria-live="polite"
                  >
                    <span
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#d1dce1]"
                      style={{ backgroundColor: selectedProduct.imageTone }}
                    >
                      <span
                        className="absolute inset-0"
                        style={{ transform: `scale(${selectedProduct.imageScale ?? 1})` }}
                      >
                        <Image
                          src={withBasePath(currentProductImage)}
                          alt={currentProductImageAlt}
                          fill
                          unoptimized
                          sizes="96px"
                          className="object-contain p-2"
                        />
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-interface text-[9px] font-bold uppercase tracking-[0.13em] text-[#5e96a5]">
                        Tu selección se ve así
                      </span>
                      <span className="mt-1 block font-interface text-xs font-bold leading-5 text-[#263650]">
                        {currentOption.label}
                      </span>
                      <span className="mt-1 block font-interface text-[9px] leading-4 text-[#718093]">
                        La imagen cambia al elegir otra presentación.
                      </span>
                    </span>
                  </div>
                )}

                {isBulkCookies ? (
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
                          onChange={(event) =>
                            setBulkQuantityInput(event.target.value)
                          }
                          aria-invalid={!bulkQuantityIsValid}
                          aria-describedby="bulk-quantity-help"
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
                        onClick={() =>
                          setBulkQuantity(Math.max(300, bulkTargetGrams - 100))
                        }
                        disabled={!bulkQuantityIsValid || bulkTargetGrams <= 300}
                        aria-label="Restar 100 gramos a la cantidad total"
                        className="flex min-h-12 items-center justify-center rounded-xl border border-[#b9c8d8] bg-white px-4 font-interface text-lg font-bold text-[#425b8c] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkQuantity(bulkTargetGrams + 100)}
                        disabled={!bulkQuantityIsValid || bulkTargetGrams >= 10000}
                        aria-label="Agregar 100 gramos a la cantidad total"
                        className="flex min-h-12 items-center justify-center rounded-xl border border-[#5e96a5] bg-[#e8f2f4] px-4 font-interface text-lg font-bold text-[#263650] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <p
                      id="bulk-quantity-help"
                      className={`mt-2 font-interface text-[10px] ${
                        bulkQuantityIsValid
                          ? "text-[#718093]"
                          : "font-semibold text-[#9f5860]"
                      }`}
                    >
                      {bulkQuantityIsValid
                        ? `${formatBulkWeight(bulkTargetGrams)} seleccionados.`
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
                          {formatBulkWeight(grams)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#d1dce1] bg-white px-4 py-3">
                      <div>
                        <p className="font-interface text-[9px] font-bold uppercase tracking-[0.12em] text-[#718093]">
                          {isBulkWholesaleQuote
                            ? "Pedido de mayoreo"
                            : "Precio calculado"}
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
                            <p className="font-bold text-[#456a4e]">
                              Ahorras {money(bulkSavings)}
                            </p>
                          </>
                        ) : (
                          <p>$60 por cada 100 g</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                <fieldset className="mt-7">
                  <legend className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                    Elige una presentación
                  </legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedProduct.options.map((option, index) => (
                      <button
                        key={`${option.label}-${option.price}`}
                        type="button"
                        onClick={() => {
                          setSelectedOption(index);
                          if (isBulkCookies) {
                            setBulkFlavorGrams(createEmptyBulkDistribution());
                          }
                        }}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left font-interface text-xs transition ${
                          selectedOption === index
                            ? "border-[#425b8c] bg-[#e5edf4] text-[#263650] shadow-[2px_2px_0_#425b8c]"
                            : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#7c9cab]"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {option.image && (
                            <span
                              className={`relative shrink-0 overflow-hidden rounded-lg border border-[#d7dfe3] bg-white transition-all ${
                                selectedOption === index
                                  ? "h-16 w-12"
                                  : "h-10 w-7"
                              }`}
                            >
                              <Image
                                src={withBasePath(option.image)}
                                alt=""
                                fill
                                unoptimized
                                sizes={selectedOption === index ? "48px" : "28px"}
                                className="object-contain p-0.5"
                              />
                            </span>
                          )}
                          <span>{option.label}</span>
                        </span>
                        <strong>{money(option.price)}</strong>
                      </button>
                    ))}
                  </div>
                </fieldset>
                )}

                {!isBulkCookies &&
                  (currentOption.ingredients?.length ||
                    currentOption.guaranteedAnalysis?.length) && (
                    <section
                      key={currentOption.label}
                      className="mt-7 grid gap-3"
                      aria-live="polite"
                    >
                      {!!currentOption.ingredients?.length && (
                        <details className="group rounded-2xl border border-[#b9c8d8] bg-[#f8fbfc] p-4 sm:p-5">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
                            <span>
                              <span className="block font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                                Ingredientes
                              </span>
                              <span className="mt-1 block font-interface text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5e96a5]">
                                {currentOption.label}
                              </span>
                            </span>
                            <span aria-hidden="true" className="shrink-0 font-interface text-lg font-bold text-[#425b8c]">
                              <span className="group-open:hidden">+</span>
                              <span className="hidden group-open:inline">−</span>
                            </span>
                          </summary>
                          <p className="mt-3 border-t border-[#d7e0e5] pt-3 font-interface text-sm leading-6 text-[#657287]">
                            {currentOption.ingredients.join(", ")}.
                          </p>
                        </details>
                      )}

                      {!!currentOption.guaranteedAnalysis?.length && (
                        <details className="group rounded-2xl border border-[#b9c8d8] bg-[#f8fbfc] p-4 sm:p-5">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
                            <span>
                              <span className="block font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                                Análisis garantizado
                              </span>
                              <span className="mt-1 block font-interface text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5e96a5]">
                                {currentOption.label}
                              </span>
                            </span>
                            <span aria-hidden="true" className="shrink-0 font-interface text-lg font-bold text-[#425b8c]">
                              <span className="group-open:hidden">+</span>
                              <span className="hidden group-open:inline">−</span>
                            </span>
                          </summary>
                          <dl className="mt-3 grid gap-2 border-t border-[#d7e0e5] pt-3 sm:grid-cols-2">
                            {currentOption.guaranteedAnalysis.map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center justify-between gap-4 rounded-xl border border-[#d1dce1] bg-white px-3 py-2.5"
                              >
                                <dt className="font-interface text-[10px] font-semibold leading-4 text-[#657287]">
                                  {item.label}
                                </dt>
                                <dd className="shrink-0 font-interface text-[10px] font-bold text-[#263650]">
                                  {item.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                    </section>
                  )}

                {isBulkCookies && (
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
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 font-interface text-[9px] font-bold uppercase tracking-[0.1em] ${
                          bulkDistributionIsComplete
                            ? "bg-[#e3f1e7] text-[#456a4e]"
                            : "bg-[#dceef0] text-[#425b8c]"
                        }`}
                        aria-live="polite"
                      >
                        {bulkAssignedGrams} / {bulkQuantityIsValid ? bulkTargetGrams : "—"} g
                      </span>
                    </div>

                    <div
                      className="mt-4 h-2 overflow-hidden rounded-full bg-[#dce4e9]"
                      role="progressbar"
                      aria-label="Gramos distribuidos"
                      aria-valuemin={0}
                      aria-valuemax={bulkTargetGrams}
                      aria-valuenow={bulkAssignedGrams}
                    >
                      <span
                        className={`block h-full rounded-full transition-[width] duration-300 ${
                          bulkDistributionIsComplete
                            ? "bg-[#6f9a78]"
                            : "bg-[#5e96a5]"
                        }`}
                        style={{
                          width: bulkQuantityIsValid
                            ? `${Math.min(
                                100,
                                (bulkAssignedGrams / bulkTargetGrams) * 100,
                              )}%`
                            : "0%",
                        }}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {bulkFlavors.map((flavor) => {
                        const grams = bulkFlavorGrams[flavor];
                        return (
                          <div
                            key={flavor}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                              grams > 0
                                ? "border-[#7c9cab] bg-white shadow-[2px_2px_0_#d0e2e6]"
                                : "border-[#d1d9df] bg-white/75"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-interface text-[10px] font-bold leading-4 text-[#53627a]">
                                {flavor}
                              </p>
                              <p className="mt-0.5 font-interface text-[10px] text-[#718093]">
                                {grams === 0 ? "Sin asignar" : `${grams} g asignados`}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  adjustBulkFlavor(flavor, -100, bulkTargetGrams)
                                }
                                disabled={!bulkQuantityIsValid || grams < 100}
                                aria-label={`Restar 100 gramos de ${flavor}`}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#b9c8d8] bg-white font-interface text-lg font-bold text-[#425b8c] transition hover:border-[#5e96a5] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                −
                              </button>
                              <label className="relative">
                                <span className="sr-only">
                                  Gramos de {flavor}
                                </span>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={bulkQuantityIsValid ? bulkTargetGrams : 10000}
                                  step={100}
                                  value={grams}
                                  onChange={(event) =>
                                    changeBulkFlavorInput(
                                      flavor,
                                      event.target.value,
                                    )
                                  }
                                  aria-invalid={
                                    !Number.isInteger(grams) || grams % 100 !== 0
                                  }
                                  className={`h-9 w-[4.75rem] rounded-lg border bg-white px-2 pr-5 text-center font-interface text-[11px] font-bold text-[#263650] outline-none ${
                                    Number.isInteger(grams) && grams % 100 === 0
                                      ? "border-[#b9c8d8] focus:border-[#5e96a5]"
                                      : "border-[#b96d72] focus:border-[#9f5860]"
                                  }`}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center font-interface text-[8px] font-bold text-[#718093]">
                                  g
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  adjustBulkFlavor(flavor, 100, bulkTargetGrams)
                                }
                                disabled={
                                  !bulkQuantityIsValid || bulkRemainingGrams < 100
                                }
                                aria-label={`Agregar 100 gramos de ${flavor}`}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5e96a5] bg-[#e8f2f4] font-interface text-lg font-bold text-[#263650] transition hover:bg-[#d6eaee] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p
                      className={`mt-4 font-interface text-[10px] font-semibold ${
                        bulkDistributionIsComplete
                          ? "text-[#456a4e]"
                          : bulkRemainingGrams < 0 || !bulkFlavorIncrementsAreValid
                            ? "text-[#9f5860]"
                            : "text-[#718093]"
                      }`}
                      aria-live="polite"
                    >
                      {!bulkQuantityIsValid
                        ? "Primero ingresa una cantidad total válida."
                        : !bulkFlavorIncrementsAreValid
                          ? "Cada sabor debe escribirse en múltiplos de 100 g."
                          : bulkRemainingGrams < 0
                            ? `Reduce ${Math.abs(bulkRemainingGrams)} g para coincidir con el total.`
                            : bulkRemainingGrams === 0
                              ? "✓ Distribución completa"
                              : `Faltan ${bulkRemainingGrams} g por asignar.`}
                    </p>
                  </div>
                )}

                {isBulkCookies && (
                  <section className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f8fbfc] p-4 sm:p-5">
                    <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                      Análisis garantizado por sabor
                    </p>
                    <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                      Consulta los valores de cada receta incluida en tu mezcla.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {bulkFlavors.map((flavor) => (
                        <details
                          key={flavor}
                          className="group rounded-xl border border-[#d1dce1] bg-white p-3 open:shadow-[2px_2px_0_#d0e2e6]"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-interface text-[10px] font-bold text-[#53627a] marker:content-none">
                            <span>{flavor}</span>
                            <span
                              aria-hidden="true"
                              className="text-base font-bold text-[#5e96a5]"
                            >
                              <span className="group-open:hidden">+</span>
                              <span className="hidden group-open:inline">−</span>
                            </span>
                          </summary>
                          <dl className="mt-3 grid gap-1.5 border-t border-[#e0e6ea] pt-3">
                            {cookieFlavorAnalyses[flavor].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center justify-between gap-4 font-interface text-[10px]"
                              >
                                <dt className="text-[#718093]">{item.label}</dt>
                                <dd className="font-bold text-[#263650]">
                                  {item.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      ))}
                    </div>
                  </section>
                )}

                {isChilaquidogs && (
                  <div className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                          Arma sus ChilaquiDogs
                        </p>
                        <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                          Elige una proteína y una salsa para completar su platito.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#dceef0] px-2.5 py-1 font-interface text-[9px] font-bold uppercase tracking-[0.1em] text-[#425b8c]">
                        2 elecciones
                      </span>
                    </div>

                    <fieldset className="mt-5">
                      <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
                        1. Proteína
                      </legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(["Pollo", "Res"] as const).map((protein) => (
                          <button
                            key={protein}
                            type="button"
                            aria-pressed={chilaquiProtein === protein}
                            onClick={() => setChilaquiProtein(protein)}
                            className={`rounded-xl border px-3 py-3 font-interface text-[11px] font-bold transition ${
                              chilaquiProtein === protein
                                ? "border-[#5e96a5] bg-[#e8f2f4] text-[#263650] shadow-[2px_2px_0_#5e96a5]"
                                : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#5e96a5]"
                            }`}
                          >
                            {protein}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset className="mt-5">
                      <legend className="font-interface text-[10px] font-bold uppercase tracking-[0.12em] text-[#53627a]">
                        2. Salsa
                      </legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(["Roja", "Verde"] as const).map((salsa) => (
                          <button
                            key={salsa}
                            type="button"
                            aria-pressed={chilaquiSalsa === salsa}
                            onClick={() => setChilaquiSalsa(salsa)}
                            className={`rounded-xl border px-3 py-3 font-interface text-[11px] font-bold transition ${
                              chilaquiSalsa === salsa
                                ? salsa === "Roja"
                                  ? "border-[#b96d72] bg-[#fbebed] text-[#743d45] shadow-[2px_2px_0_#b96d72]"
                                  : "border-[#789477] bg-[#edf4e9] text-[#425d42] shadow-[2px_2px_0_#789477]"
                                : "border-[#c7d1dc] bg-white text-[#657287] hover:border-[#7c9cab]"
                            }`}
                          >
                            Salsa {salsa.toLocaleLowerCase("es")}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {needsRecipe && (
                  <div className="mt-7 rounded-2xl border border-[#b9c8d8] bg-[#f6fafb] p-4 sm:p-5">
                    <p className="font-interface text-xs font-bold uppercase tracking-[0.12em] text-[#263650]">
                      Configura su receta
                    </p>
                    <p className="mt-1 font-interface text-[10px] leading-4 text-[#718093]">
                      La proteína disponible cambia según sea para lomito o michi.
                    </p>
                    <PetRecipeFields
                      petType={petType}
                      petProtein={petProtein}
                      onPetTypeChange={(kind) => {
                        setPetType(kind);
                        setPetProtein(null);
                      }}
                      onPetProteinChange={setPetProtein}
                      firstStep={1}
                    />
                  </div>
                )}
              </>
            )}

            <details className="group mt-7 rounded-2xl border border-[#c8d5dc] bg-[#f8fbfc] p-4 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-interface text-[10px] font-bold uppercase tracking-[0.14em] text-[#5e96a5] marker:content-none">
                <span>Antes de pedir</span>
                <span
                  aria-hidden="true"
                  className="text-base text-[#425b8c] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 font-interface text-sm leading-6 text-[#657287]">
                {selectedProduct.detail}
              </p>
              {isEdibleProduct && !isSticks && (
                <p className="mt-3 border-t border-[#d7e0e5] pt-3 font-interface text-[10px] leading-5 text-[#718093]">
                  <strong className="text-[#53627a]">Guía Cuisine:</strong>{" "}
                  es un premio complementario y no sustituye su alimento diario.
                  Si tu lomito o michi tiene alergias, intolerancias o una dieta
                  indicada por su veterinario, consúltanos antes de pedir.
                </p>
              )}
            </details>

            {selectedProduct.customizable && (
              <div className="mt-7 rounded-2xl border border-[#d2a5ad] bg-[#fcf2f4] p-4 sm:p-5">
                <p className="font-interface text-xs font-bold uppercase tracking-[0.1em] text-[#263650]">
                  {usesDecorationPersonalization
                    ? "¿Quieres personalizar la decoración?"
                    : "¿Quieres personalizar tu producto?"}
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
                        value={personalizationPetName}
                        onChange={(event) => setPersonalizationPetName(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#d2a5ad] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#a66271]"
                        placeholder="Ej. Bruno"
                      />
                    </label>
                    <label className="font-interface text-[11px] font-semibold text-[#53627a]">
                      Tema, colores o número
                      <input
                        type="text"
                        value={personalizationIdea}
                        onChange={(event) => setPersonalizationIdea(event.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[#d2a5ad] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#a66271]"
                        placeholder="Cuéntanos tu idea"
                      />
                    </label>

                    <div className="mt-2 rounded-xl border border-[#e1bcc3] bg-white/80 p-3 sm:col-span-2 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-interface text-[11px] font-bold text-[#53627a]">
                            Fotos de inspiración
                            <span className="ml-1 font-normal text-[#8a6a72]">
                              (opcional)
                            </span>
                          </p>
                          <p
                            id="inspiration-photo-help"
                            className="mt-1 font-interface text-[9px] leading-4 text-[#718093]"
                          >
                            Hasta 5 fotos · JPEG, PNG o WebP · máximo 5 MB por
                            foto y 20 MB en total.
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f5e4e8] px-2.5 py-1 font-interface text-[9px] font-bold text-[#7a5660]">
                          {inspirationPhotos.length}/{MAX_INSPIRATION_PHOTOS}
                        </span>
                      </div>

                      {inspirationPreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {inspirationPreviews.map(({ file, url }, index) => (
                            <div
                              key={`${file.name}-${file.size}-${file.lastModified}`}
                              className="group relative aspect-square overflow-hidden rounded-lg border border-[#d2a5ad] bg-[#f8eef0]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Inspiración ${index + 1}: ${file.name}`}
                                className="h-full w-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => removeInspirationPhoto(index)}
                                aria-label={`Quitar foto de inspiración ${index + 1}`}
                                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-[#263650]/90 font-interface text-sm font-bold text-white shadow-sm transition hover:bg-[#9f5860]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        key={inspirationInputKey}
                        id="inspiration-photos"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={
                          inspirationPhotos.length >= MAX_INSPIRATION_PHOTOS
                        }
                        aria-describedby="inspiration-photo-help inspiration-photo-feedback"
                        onChange={(event) =>
                          selectInspirationPhotos(event.target.files)
                        }
                        className="sr-only"
                      />
                      <label
                        htmlFor="inspiration-photos"
                        aria-disabled={
                          inspirationPhotos.length >= MAX_INSPIRATION_PHOTOS
                        }
                        className={`mt-3 flex min-h-11 items-center justify-center rounded-lg border border-dashed px-4 py-2.5 font-interface text-[10px] font-bold uppercase tracking-[0.08em] transition ${
                          inspirationPhotos.length >= MAX_INSPIRATION_PHOTOS
                            ? "cursor-not-allowed border-[#d9cbd0] bg-[#f3edef] text-[#a48d94]"
                            : "cursor-pointer border-[#a66271] bg-white text-[#7a4c57] hover:bg-[#fcf2f4]"
                        }`}
                      >
                        {inspirationPhotos.length >= MAX_INSPIRATION_PHOTOS
                          ? "Límite de 5 fotos alcanzado"
                          : inspirationPhotos.length === 0
                            ? "+ Agregar fotos de inspiración"
                            : "+ Agregar otra foto"}
                      </label>

                      <p
                        id="inspiration-photo-feedback"
                        role="status"
                        className="mt-2 min-h-4 font-interface text-[9px] leading-4 text-[#7a5660]"
                      >
                        {inspirationFeedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 border-t border-[#d6dee5] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-interface text-[10px] uppercase tracking-[0.13em] text-[#718093]">
                  {isPetcake
                    ? `${petcakeSizes[petcakeSize]} · ${petcakeFinish ?? "elige acabado"}`
                    : isBulkCookies
                      ? `${
                          bulkQuantityIsValid
                            ? formatBulkWeight(bulkTargetGrams)
                            : "cantidad pendiente"
                        } · ${
                          bulkDistributionSummary || "distribuye los sabores"
                        }`
                    : isChilaquidogs
                      ? `${currentOption.label} · ${chilaquiProtein ?? "elige proteína"} · ${
                          chilaquiSalsa
                            ? `salsa ${chilaquiSalsa.toLocaleLowerCase("es")}`
                            : "elige salsa"
                        }`
                    : currentOption.label}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#263650]">
                  {isBulkCookies
                    ? !bulkQuantityIsValid
                      ? "Ingresa una cantidad válida"
                      : isBulkWholesaleQuote
                        ? "Cotización de mayoreo"
                        : money(bulkPrice)
                    : isPetcake && petcakeFinish === null
                      ? "Selecciona el acabado"
                      : money(currentOption.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!canAdd}
                className="border-2 border-[#263650] bg-[#263650] px-6 py-3.5 font-interface text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[3px_3px_0_#77aab6] transition hover:-translate-y-0.5 hover:bg-[#425b8c] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {isBulkWholesaleQuote
                  ? "Solicitar cotización"
                  : "Agregar al carrito"}
              </button>
            </div>

            {!canAdd && (
              <p className="mt-3 font-interface text-[10px] leading-4 text-[#718093]">
                {needsBulkDistribution
                  ? !bulkQuantityIsValid
                    ? "Ingresa una cantidad entre 300 g y 10 kg en múltiplos de 100 g."
                    : !bulkFlavorIncrementsAreValid
                      ? "Escribe los gramos de cada sabor en múltiplos de 100 g."
                      : bulkRemainingGrams < 0
                        ? `Reduce ${Math.abs(bulkRemainingGrams)} g de la distribución.`
                        : bulkAssignedGrams === 0
                          ? `Distribuye los ${bulkTargetGrams} g entre uno o varios sabores.`
                          : `Faltan ${bulkRemainingGrams} g por asignar antes de continuar.`
                  : needsChilaquiConfiguration
                  ? "Selecciona la proteína y la salsa para agregar sus ChilaquiDogs."
                  : needsPetcakeFinish || needsRecipeConfiguration
                  ? isPetcake
                    ? "Completa tamaño, acabado, tipo de mascota y proteína para agregarlo."
                    : "Elige si es para lomito o michi y selecciona su proteína para agregarlo."
                  : "Indica si deseas personalizarlo para agregarlo."}
              </p>
            )}

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
    <section ref={productViewRef} className="relative -m-4 min-h-[32rem] bg-white sm:-m-6">
      {cuisineCartDrawer}
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
          {cuisineCartTrigger}
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
                    src={withBasePath(product.image)}
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
