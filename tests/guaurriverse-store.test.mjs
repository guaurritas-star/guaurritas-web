import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const world = read("../src/components/apps/GuaurriverseAppCore.tsx");
const store = read("../src/components/apps/StoreApp.tsx");
const desktop = read("../src/components/desktop/Desktop.tsx");
const checkout = read("../src/components/cart/TaskbarCart.tsx");
const css = read("../src/app/guaurriverse-store.css");
const layout = read("../src/app/layout.tsx");

test("los cuatro componentes modificados siguen siendo TSX válido", () => {
  for (const [fileName, source] of [
    ["GuaurriverseAppCore.tsx", world],
    ["StoreApp.tsx", store],
    ["Desktop.tsx", desktop],
    ["TaskbarCart.tsx", checkout],
  ]) {
    const result = ts.transpileModule(source, {
      fileName, reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    assert.equal(result.diagnostics?.length ?? 0, 0, fileName);
  }
});

test("Guaurriverse ya no abre dos catálogos paralelos: comparte StoreApp", () => {
  assert.match(world, /import StoreApp from "@\/components\/apps\/StoreApp";/);
  assert.doesNotMatch(world, /import (?:CuisineStoreApp|CoutureStoreApp|NationalCuisineStoreApp)/);
  assert.match(world, /selectedWorld\?\.id === "cuisine" \|\| selectedWorld\?\.id === "couture"/);
  assert.match(world, /<StoreApp[\s\S]*lockedCategory=\{selectedWorld\.id\}/);
  assert.match(world, /onBack=\{showAllWorlds\}/);
});

test("StoreApp reutiliza la entrega elegida sin repetir el filtro dentro de mundos", () => {
  assert.match(store, /lockedCategory\?: StoreCategory/);
  assert.match(store, /const activeCategory = lockedCategory \?\? category/);
  assert.match(store, /lockedCategory \? \(/);
  assert.match(store, /Sección elegida en Guaurriverse/);
  assert.match(store, /shopping-world-toolbar/);
  assert.match(store, /Zona de entrega elegida en Guaurriverse/);
  assert.match(store, /lockedCategory \? \(/);
  assert.match(store, /Volver a explorar los mundos/);
  assert.match(store, /shopping-location/);
  assert.match(store, /shopping-store-cart/);
  assert.match(store, /activeCategory === "couture"/);
  assert.match(store, /onFulfillmentChange\?\.\(next\)/);
});

test("mundo Cuisine/Couture utiliza el mismo chrome y scroll que Tienda.exe", () => {
  assert.match(desktop, /const worldStoreOpen = selectedApp\?\.id === "mundos"/);
  assert.match(desktop, /fixedContent=\{selectedApp\.id === "tienda" \|\| worldStoreOpen\}/);
  assert.match(desktop, /Guaurritas Cuisine/);
  assert.match(desktop, /Guaurritas Couture/);
  assert.match(css, /\.store-app--world \.shopping-world-toolbar/);
  assert.match(layout, /import "\.\/guaurriverse-store\.css";/);
});

test("checkout muestra orientación sin cambiar la lógica de pago", () => {
  assert.match(checkout, /taskbar-checkout-steps/);
  assert.match(checkout, /1 · Entrega/);
  assert.match(checkout, /2 · Pago/);
  assert.match(checkout, /Revisa tus productos, elige la entrega y después la forma de pago/);
  assert.match(css, /\.taskbar-checkout-view \.taskbar-checkout-steps\[aria-label="Progreso del pedido"\]/);
  assert.match(checkout, /requestWixCheckout\(items, preferences\)/);
});
