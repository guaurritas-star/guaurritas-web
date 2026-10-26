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

test("los iconos tienen etiquetas útiles y explicación táctil", () => {
  assert.match(desktop, /data-description=\{app\.description\}/);
  assert.match(desktop, /aria-label=\{\`\$\{app\.name\}\. \$\{app\.description\}\`\}/);
  assert.match(desktop, /desktop-shortcut-description/);
  assert.match(css, /@media \(max-width: 639px\)[\s\S]*?desktop-shortcut-description/);
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

test("toast discreto sólo en desktop; móvil conserva mensaje original", () => {
  assert.match(css, /\.os-cart-notification \{ display: none; \}/);
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*?\.os-cart-notification \{/);
  assert.match(css, /guaurritas-system-cart-open \.os-cart-notification \{ display: none; \}/);
  assert.match(feedback, /role=\{blocked \? "alert" : "status"\}/);
});

test("animación respeta reducir movimiento, drag conserva su transform", () => {
  assert.match(css, /@keyframes os-window-appear/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css.match(/@keyframes os-window-appear \{([\s\S]*?)\}/)?.[1] ?? "", /transform:/);
});
