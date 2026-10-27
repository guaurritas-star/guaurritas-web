import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const css = read("../src/app/ux-overlap-fixes.css");
const layout = read("../src/app/layout.tsx");
const toast = read("../src/components/desktop/OsCartNotification.tsx");
const cart = read("../src/components/cart/TaskbarCart.tsx");

test("el pulido de UX se carga tras los estilos de Tienda sin global resets", () => {
  assert.match(layout, /import "\.\/store-native-window\.css";\s*import "\.\/ux-overlap-fixes\.css";/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|\*)\s*\{/);
});

test("el aviso permite hacer clic en botones de producto debajo, pero conserva controles propios", () => {
  assert.match(css, /\.shopping-window\.os-cart-notification\s*\{\s*pointer-events:\s*none !important/);
  assert.match(css, /:is\(\.os-cart-notification-close, \.os-cart-notification-open\)\s*\{\s*pointer-events:\s*auto !important/);
  assert.match(toast, /requestSystemCartOpen\(\)/);
  assert.match(toast, /onClick=\{dismiss\}/);
  assert.match(toast, /DISMISS_AFTER_MS = 4200/);
});

test("un único scroll táctil del carrito y cabecera accesible en móvil", () => {
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /\.taskbar-cart-panel\s*\{\s*overscroll-behavior-y:\s*contain !important/);
  assert.match(css, /\.taskbar-cart-panel \.taskbar-cart-scroll-body\s*\{\s*min-width:\s*0;\s*overflow:\s*visible/);
  assert.match(css, /\.taskbar-cart-panel \.taskbar-cart-titlebar\s*\{\s*position:\s*sticky;\s*top:\s*0;\s*z-index:\s*10/);
  assert.match(cart, /taskbar-cart-panel--checkout/);
});

test("controles de producto y fondo de carrito respetan alcance táctil y safe-area", () => {
  assert.match(css, /padding-bottom:\s*max\(16px, env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /retail-cart-toolbar > button\s*\{\s*flex-shrink:\s*0;\s*min-height:\s*44px/);
  assert.match(css, /retail-system-cart\s*\{\s*max-width:\s*calc\(100% - 56px\)/);
  assert.doesNotMatch(css, /taskbar-checkout-view.*display:\s*none/);
});
