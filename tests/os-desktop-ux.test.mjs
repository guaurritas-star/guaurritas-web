import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const desktop = read("../src/components/desktop/Desktop.tsx");
const toast = read("../src/components/desktop/OsCartNotification.tsx");
const feedback = read("../src/components/cart/AddToCartFeedback.tsx");
const events = read("../src/lib/os-notification-events.ts");
const css = read("../src/app/globals.css");

for (const [name, src] of [["Desktop", desktop], ["CartNotification", toast], ["AddToCartFeedback", feedback], ["NotificationEvents", events]]) {
  test(`${name} no tiene errores de sintaxis TypeScript`, () => {
    const result = ts.transpileModule(src, {
      fileName: name.endsWith("Events") ? `${name}.ts` : `${name}.tsx`,
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    assert.equal(result.diagnostics?.length ?? 0, 0);
  });
}

test("los iconos conservan etiquetas accesibles y utilizan una barra de estado contextual", () => {
  assert.match(desktop, /aria-label=\{\`\$\{app\.name\}\. \$\{app\.description\}\`\}/);
  assert.match(desktop, /onPointerEnter=\{\(\) => setHelpedApp\(app\)\}/);
  assert.match(desktop, /onFocus=\{\(\) => setHelpedApp\(app\)\}/);
  assert.match(desktop, /className="desktop-status-help"/);
  assert.doesNotMatch(desktop, /desktop-shortcut-tooltip|desktop-shortcut-description/);
  assert.match(css, /\.desktop-status-help\[data-visible="true"\]/);
});

test("la barra indica minimizado o activo sin cambiar lógica de ventanas", () => {
  assert.match(desktop, /aria-pressed=\{activeApp === taskApp\.id\}/);
  assert.match(desktop, /onClick=\{toggleTaskApp\}/);
  assert.match(css, /desktop-taskbar-app button\[aria-pressed="true"\]/);
  assert.match(css, /retro-window-dialog:not\(\.welcome-window-dialog\)/);
});

test("notificar solo compras añadidas, no errores ni mayoreo pendiente", () => {
  assert.match(feedback, /blocked \|\| !\/se agregó al carrito\/i\.test\(message\)/);
  assert.match(feedback, /announceCartAddition\(message\)/);
  assert.match(toast, /OS_CART_NOTIFICATION_EVENT/);
  assert.match(toast, /DISMISS_AFTER_MS = 4200/);
  assert.match(toast, /requestSystemCartOpen\(\)/);
});

test("toast nativo se oculta en móvil y cuando se abre el carrito", () => {
  assert.match(css, /\.shopping-window\.os-cart-notification \{ display: none !important; \}/);
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*?\.shopping-window\.os-cart-notification \{/);
  assert.match(css, /guaurritas-system-cart-open \.shopping-window\.os-cart-notification/);
  assert.match(feedback, /role=\{blocked \? "alert" : "status"\}/);
});

test("animación respeta reducir movimiento, drag conserva su transform", () => {
  assert.match(css, /@keyframes os-window-appear/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css.match(/@keyframes os-window-appear \{([\s\S]*?)\}/)?.[1] ?? "", /transform:/);
});


test("la barra de ayuda se dibuja encima de las promociones, sin ocultarse tras ticker", () => {
  const ticker = css.match(/\.promotion-ticker \{([\s\S]*?)\}/)?.[1] ?? "";
  const status = css.match(/\.desktop-status-help \{\s*position: absolute;([\s\S]*?)\}/)?.[1] ?? "";
  const tickerZ = Number(ticker.match(/z-index:\s*(\d+)/)?.[1]);
  const statusZ = Number(status.match(/z-index:\s*(\d+)/)?.[1]);
  assert.ok(statusZ > tickerZ, "La ayuda debe pintarse por encima del ticker");
  assert.match(status, /bottom:\s*calc\(52px \+ 34px \+ 12px\)/);
  assert.match(status, /pointer-events:\s*none/);
  assert.match(css, /\.desktop-status-help\[data-visible="true"\]/);
  assert.match(css, /\.desktop-status-help \{ display: none; \}/);
});
