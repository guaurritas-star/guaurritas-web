// Búsqueda de la tienda: sin acentos y con sinónimos de cómo hablan los clientes.

export function normalizeSearchText(value: string) {
  return String(value || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Cada grupo: palabras que el cliente escribe → palabras que aparecen en los productos.
const SYNONYM_GROUPS: { words: string[]; matches: string[]; label: string }[] = [
  { words: ["gato", "gatos", "gatito", "gatitos", "gata", "michi", "michis", "felino"], matches: ["michi", "gato"], label: "michi" },
  { words: ["perro", "perros", "perrito", "perritos", "perrita", "lomito", "lomitos", "cachorro", "can"], matches: ["lomito", "perro"], label: "lomito" },
  { words: ["pastel", "pasteles", "pastelito", "cumple", "cumpleanos", "fiesta", "celebrar", "celebracion", "torta"], matches: ["petcake", "pastel", "cumple", "celebra", "cupcake", "cake pop"], label: "pasteles y cumpleaños" },
  { words: ["premio", "premios", "snack", "snacks", "golosina", "golosinas", "galleta", "galletas", "cookie", "cookies", "botana"], matches: ["premio", "galleta", "cookie", "snack"], label: "premios y galletas" },
];

const STOP_WORDS = new Set(["de", "del", "la", "el", "los", "las", "para", "mi", "un", "una", "con", "y"]);

export type SearchPlan = { terms: string[][]; synonymLabels: string[] };

/** Divide la búsqueda en palabras; cada palabra acepta sus sinónimos. */
export function buildSearchPlan(query: string): SearchPlan {
  const words = normalizeSearchText(query).split(" ").filter((word) => word && !STOP_WORDS.has(word));
  const labels = new Set<string>();
  const terms = words.map((word) => {
    const group = SYNONYM_GROUPS.find((item) => item.words.includes(word));
    if (!group) return [word];
    labels.add(group.label);
    return Array.from(new Set([word, ...group.matches]));
  });
  return { terms, synonymLabels: Array.from(labels) };
}

/** Coincide si cada palabra (o uno de sus sinónimos) aparece en el texto del producto. */
export function matchesSearch(plan: SearchPlan, haystack: string) {
  if (plan.terms.length === 0) return true;
  const text = normalizeSearchText(haystack);
  return plan.terms.every((options) => options.some((option) => text.includes(option)));
}

export const SEARCH_SUGGESTIONS = ["michi", "lomito", "cumpleaños", "premios"];
