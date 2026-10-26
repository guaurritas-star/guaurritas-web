import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = name => readFileSync(new URL(name, import.meta.url), "utf8");
const toast = read("../src/components/desktop/OsCartNotification.tsx");
const desktop = read("../src/components/desktop/Desktop.tsx");
const styles = read("../src/app/globals.css");

test("mini ventana y escritorio siguen compilando como TSX válido", () => {
  for (const [fileName, content] of [["OsCartNotification.tsx", toast], ["Desktop.tsx", desktop]]) {
    const result = ts.transpileModule(content, {
      fileName,
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    assert.equal(result.diagnostics?.length ?? 0, 0);
  }
});

test("aviso usa ventana y botón auténticos de Tienda sin adornos añadidos", () => {
  assert.match(toast, /ShoppingWindow, ShoppingWindowHeader/);
  assert.match(toast, /<ShoppingWindow className="os-cart-notification shopping-window"/);
  assert.match(toast, /<ShoppingWindowHeader className="os-cart-notification-titlebar shopping-window-header"/);
  assert.match(toast, /<ShoppingButton[\s\S]*?\$tone="peach"/);
  assert.match(toast, /Carrito\.exe/);
  assert.match(toast, /Se agregó a tu carrito/);
  assert.doesNotMatch(toast, /mascot|LISTO PARA CONSENTIR/);
  assert.match(toast, /requestSystemCartOpen\(\)/);
  assert.match(toast, /onClick=\{dismiss\}/);
  assert.match(toast, /DISMISS_AFTER_MS = 4200/);
  assert.match(toast, /replace\(\/\\s\*se agregó al carrito/);
});

test("barra de ayuda sustituye tooltips y subtítulos de las ocho apps", () => {
  assert.equal((desktop.match(/description: /g) ?? []).length, 8);
  assert.match(desktop, /desktop-status-help/);
  assert.match(desktop, /helpedApp\?\.description/);
  assert.match(desktop, /Compra premios, repostería y accesorios/);
  assert.match(desktop, /Crea el perfil de tu compañero/);
  assert.match(desktop, /Guarda recuerdos y momentos especiales/);
  assert.doesNotMatch(desktop, /desktop-shortcut-tooltip|mobileDescription|desktop-shortcut-description/);
  assert.match(desktop, /aria-label=\{\`\$\{app\.name\}\. \$\{app\.description\}\`\}/);
});

test("mini ventana hereda el sistema visual de Tienda y ayuda discreta", () => {
  assert.match(styles, /\.shopping-window\.os-cart-notification/);
  assert.match(styles, /\.shopping-window-header\.os-cart-notification-titlebar/);
  assert.match(styles, /\.os-cart-notification-actions \.os-cart-notification-open/);
  assert.match(styles, /\.desktop-status-help\[data-visible="true"\]/);
  assert.match(styles, /var\(--font-mansalva\)/);
  assert.doesNotMatch(styles, /\.desktop-shortcut-tooltip-heading|\.os-cart-notification-mascot/);
});

test("sin interrupciones en móvil ni para usuarios con movimiento reducido", () => {
  assert.match(styles, /\.shopping-window\.os-cart-notification \{ display: none !important; \}/);
  assert.match(styles, /html\.guaurritas-system-cart-open \.shopping-window\.os-cart-notification/);
  assert.match(styles, /\.desktop-status-help \{ display: none; \}/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
