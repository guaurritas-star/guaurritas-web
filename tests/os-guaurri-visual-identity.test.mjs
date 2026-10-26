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

test("aviso usa mascota real, jerarquía de marca y acción al carrito", () => {
  assert.match(toast, /guaurritas-mascot-hd\.webp/);
  assert.match(toast, /¡Ya quedó en tu carrito!/);
  assert.match(toast, /LISTO PARA CONSENTIR/);
  assert.match(toast, /Ver carrito/);
  assert.match(toast, /requestSystemCartOpen\(\)/);
  assert.match(toast, /onClick=\{dismiss\}/);
  assert.match(toast, /DISMISS_AFTER_MS = 4200/);
  assert.match(toast, /replace\(\/\\s\*se agregó al carrito/);
});

test("tarjetas de ayuda ofrecen copy claro para las ocho apps", () => {
  assert.equal((desktop.match(/mobileDescription: /g) ?? []).length, 8);
  assert.match(desktop, /desktop-shortcut-tooltip-heading/);
  assert.match(desktop, /Ayuda Guaurri/);
  assert.match(desktop, /Compra premios, repostería y accesorios/);
  assert.match(desktop, /Crea el perfil de tu compañero/);
  assert.match(desktop, /Guarda recuerdos y momentos especiales/);
  assert.match(desktop, /aria-label=\{\`\$\{app\.name\}\. \$\{app\.description\}\`\}/);
});

test("los nuevos paneles comparten paleta y tipografía con Guaurritas OS", () => {
  assert.match(styles, /\.desktop-shortcut-tooltip-heading/);
  assert.match(styles, /\.os-cart-notification-mascot/);
  assert.match(styles, /\.os-cart-notification-titlebar[\s\S]*?background: linear-gradient\(90deg, #425b8c, #637aa6\)/);
  assert.match(styles, /\.os-cart-notification-actions button[\s\S]*?background: #d9a689/);
  assert.match(styles, /var\(--font-cinzel\)/);
  assert.match(styles, /var\(--font-mansalva\)/);
});

test("sin interrupciones en móvil ni para usuarios con movimiento reducido", () => {
  assert.match(styles, /\.os-cart-notification \{ display: none; \}/);
  assert.match(styles, /html\.guaurritas-system-cart-open \.os-cart-notification \{ display: none; \}/);
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.desktop-shortcut-description \{/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
