// Regresiones de la auditoría UX de noviembre de 2026 (problemas 2, 3, 4, 6 y 7
// y arreglos de textos y accesibilidad). Mismo estilo que el resto: se revisa
// el código fuente, no un navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");
const store = read("../src/components/apps/StoreApp.tsx");
const world = read("../src/components/apps/GuaurriverseAppCore.tsx");
const windowSource = read("../src/components/windows/RetroWindow.tsx");
const cuisine = read("../src/components/apps/CuisineStoreApp.tsx");
const couture = read("../src/components/apps/CoutureStoreApp.tsx");
const cart = read("../src/components/cart/TaskbarCart.tsx");
const toast = read("../src/components/desktop/OsCartNotification.tsx");
const welcome = read("../src/components/apps/WelcomeApp.tsx");
const navCss = read("../src/app/store-nav-compact.css");
const globals = read("../src/app/globals.css");
const layout = read("../src/app/layout.tsx");

test("P3: el resumen de entrega no se duplica y conserva texto accesible", () => {
  // Las reglas viven bajo --compact, que ahora usan ambos encabezados.
  assert.match(store, /className=\{`shopping-navigation shopping-navigation--compact/);
  assert.doesNotMatch(navCss, /\.store-delivery-long \{ display: none; \}/);
  assert.match(navCss, /\.shopping-navigation--compact \.store-delivery-long \{\n  position: absolute;[^}]*clip/);
});

test("P4: dentro de un mundo se puede cambiar la zona con el mismo aviso", () => {
  assert.equal((store.match(/<fieldset className="shopping-location">/g) ?? []).length, 1);
  assert.doesNotMatch(store, /lockedCategory \? \(\s*<div className="shopping-world-toolbar"/);
  assert.match(store, /onClick=\{\(\) => chooseMode\(delivery\)\}/);
  assert.match(store, /aria-current="page"/);
});

test("P2: los mundos disponibles van primero y los próximos no dicen «Explorar»", () => {
  assert.match(world, /const availableWorlds = worlds\.filter\(\(world\) => world\.available\)/);
  assert.match(world, /const upcomingWorlds = worlds\.filter\(\(world\) => !world\.available\)/);
  assert.ok(world.indexOf("availableWorlds.map") < world.indexOf("upcomingWorlds.map"));
  assert.match(world, /Próximamente en el Guaurriverse/);
  assert.doesNotMatch(world, /Desliza para explorar/);
  assert.match(world, /León, Gto\.<\/> : <><SystemIcon name="box" \/> Todo México/);
});

test("P7: × cierra la ventana y los regresos llevan su destino", () => {
  assert.doesNotMatch(windowSource, />←<\/span>/);
  assert.match(cuisine, /retail-system-back-label" aria-hidden="true">Catálogo/);
  assert.doesNotMatch(cart, />\s*‹\s*</);
  assert.match(cart, /\{leonStep === "payment" \? "Entrega" : "Carrito"\}/);
});

test("P6: la confirmación del carrito también se ve en móvil", () => {
  assert.match(globals, /@media \(max-width: 639px\) \{\n  \.shopping-window\.os-cart-notification \{[\s\S]*?z-index: 90;/);
  assert.match(toast, /os-cart-notification-continue[\s\S]*?Seguir comprando/);
  assert.match(globals, /html\.guaurritas-system-cart-open \.shopping-window\.os-cart-notification/);
});

test("textos: Forêt, paso de estilo honesto y línea del carrito sin repeticiones", () => {
  assert.doesNotMatch(couture, /Fôret/);
  assert.match(couture, /data-n="1" data-done=\{styleChosen \? "true" : undefined\}/);
  assert.doesNotMatch(cart, /por unidad\{item\.fulfillment === "leon" \? " · SPEI" : ""\}/);
  assert.doesNotMatch(welcome, /calabazas y un fantasma/);
  assert.doesNotMatch(cuisine, /text-\[#5e96a5\]|text-\[#6b96a1\]/);
});

test("tokens: se cargan justo después de globals y no pisan estilos", () => {
  assert.match(layout, /import "\.\/globals\.css";\nimport "\.\/tokens\.css";/);
  const tokens = read("../src/app/tokens.css");
  assert.match(tokens, /--gu-teal-ink: #3f6670/);
  assert.doesNotMatch(tokens.replace(/:root \{[\s\S]*\}/, ""), /\{/);
});

test("detalle del carrito: solo cambia la presentación", () => {
  const source = cart.match(/function cartItemDetailLabel[\s\S]*?\n\}/)?.[0];
  assert.ok(source);
  const label = new Function(`${source.replace(/\(detail: string\)/, "(detail)")}; return cartItemDetailLabel;`)();
  assert.equal(label("300 g · 300 g de pollo con calabaza"), "300 g · Pollo con calabaza");
  assert.equal(label("1 kg · 1 kg de manzana con plátano"), "1 kg · Manzana con plátano");
  assert.equal(label("500 g · 200 g de pollo, 300 g de manzana"), "500 g · 200 g de pollo, 300 g de manzana");
  assert.equal(label("Mini · Ciel"), "Mini · Ciel");
});
