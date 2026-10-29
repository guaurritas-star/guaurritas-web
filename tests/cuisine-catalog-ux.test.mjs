import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const cuisine = readFileSync("src/components/apps/CuisineStoreApp.tsx", "utf8");
const css = readFileSync("src/app/cuisine-catalog-ux.css", "utf8");
const layout = readFileSync("src/app/layout.tsx", "utf8");

test("Cuisine catalogue remains valid TSX with its existing purchase logic", () => {
  const output = ts.transpileModule(cuisine, {
    fileName: "CuisineStoreApp.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  assert.equal(output.diagnostics?.length ?? 0, 0);
  assert.match(cuisine, /const visibleProducts = useMemo/);
  assert.match(cuisine, /getCuisineOptionPrice/);
  assert.match(cuisine, /getCuisineRegularOptionPrice/);
  assert.match(cuisine, /const addToCart = \(\) =>/);
});

test("The product-first menu is scoped only to Cuisine listing", () => {
  assert.match(cuisine, /boutique-catalog cuisine-catalog-ux/);
  assert.match(cuisine, /cuisine-catalog-intro/);
  assert.match(cuisine, /cuisine-catalog-tools/);
  assert.match(cuisine, /cuisine-catalog-grid/);
  assert.match(cuisine, /cuisine-catalog-card-media/);
  assert.match(cuisine, /cuisine-catalog-product-price/);
  assert.match(cuisine, /cuisine-catalog-image-shell/);
  assert.match(cuisine, /cuisine-catalog-card-meta/);
  assert.match(cuisine, /cuisine-catalog-card-badge/);
  assert.doesNotMatch(cuisine, /absolute left-3 top-3 rounded-full border border-white\/70/);
  assert.match(css, /transform: translateY\(-50%\)/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(cuisine, /Ver opciones de \$\{product\.name\}/);
  assert.match(css, /\.cuisine-catalog-ux \.cuisine-catalog-card/);
  assert.doesNotMatch(css, /(^|\n)\s*(html|body|\.taskbar-cart-panel|\.boutique-couture)\s*\{/);
  assert.match(layout, /import "\.\/cuisine-catalog-ux\.css";/);
});

test("Search, categories and reset preserve original filters", () => {
  assert.match(cuisine, /onChange=\{\(event\) => setQuery\(event\.target\.value\)\}/);
  assert.match(cuisine, /aria-label="Filtrar productos por categoría"/);
  assert.match(cuisine, /aria-pressed=\{category === item\.id\}/);
  assert.match(cuisine, /Limpiar búsqueda/);
  assert.match(cuisine, /Limpiar filtros/);
  assert.match(cuisine, /setCategory\("all"\)/);
});

test("Cuisine detail reflects checkout requirements without changing cart actions", () => {
  assert.match(cuisine, /const selectionSteps: \{ label: string; complete: boolean \}\[\]/);
  assert.match(cuisine, /const pendingSteps = selectionSteps\.filter/);
  assert.match(cuisine, /aria-label="Elecciones de producto completadas"/);
  assert.match(cuisine, /role="progressbar"/);
  assert.match(cuisine, /aria-pressed=\{petType === kind\}/);
  assert.match(cuisine, /aria-pressed=\{petProtein === protein\}/);
  assert.match(cuisine, /aria-pressed=\{customize === choice\}/);
  assert.match(cuisine, /disabled=\{!canAdd\}/);
  const css = readFileSync("src/app/cuisine-product-ux.css", "utf8");
  assert.match(css, /\.cuisine-detail-ux \.cuisine-selection-guide/);
  assert.doesNotMatch(css, /\.taskbar-cart-panel|\.boutique-couture/);
  assert.match(layout, /import "\.\/cuisine-product-ux\.css"/);
});

test("Configured product guide counts only customer decisions and offers a safe shortcut", () => {
  assert.doesNotMatch(cuisine, /label: `Tamaño: \$\{petcakeSizes\[petcakeSize\]\}`, complete: true/);
  assert.doesNotMatch(cuisine, /selectionSteps\.push\(\{ label: `Presentación:/);
  assert.match(cuisine, /const presetSelection = isPetcake/);
  assert.match(cuisine, /const scrollToPurchaseNextStep =/);
  assert.match(cuisine, /className="cuisine-selection-jump"/);
  assert.match(cuisine, /ref=\{purchaseSummaryRef\}/);
  assert.match(cuisine, /ref=\{customizationRef\}/);
  assert.match(cuisine, /const showCustomizationShortcut = selectedProduct\.customizable && customize === "yes"/);
  const productCss = readFileSync("src/app/cuisine-product-ux.css", "utf8");
  assert.match(productCss, /\.cuisine-detail-ux \.product-gallery/);
  assert.match(productCss, /\.cuisine-detail-ux \.cuisine-selection-jump/);
});
