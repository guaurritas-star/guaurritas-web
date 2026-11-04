import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
const desktop = readFileSync("src/components/desktop/Desktop.tsx", "utf8");
const gel = css.slice(css.indexOf("/* Tienda app-icon pilot"));

test("Tienda icon is a transparent raised bubble, not an opaque white tile", () => {
  const surface = gel.slice(gel.indexOf(".desktop-tienda-app-icon {"), gel.indexOf(".desktop-tienda-app-icon::before"));
  assert.match(surface, /border-radius: 30%/);
  assert.match(surface, /radial-gradient\(ellipse 100% 54%/);
  assert.match(surface, /rgba\(255,255,255,\.035\)/);
  assert.match(surface, /rgba\(186,220,255,\.11\)/);
  assert.match(surface, /-webkit-backdrop-filter: blur\(4px\)/);
  assert.match(surface, /backdrop-filter: blur\(4px\)/);
  assert.doesNotMatch(surface, /#[fF]{3,6}/);
  assert.match(surface, /box-shadow:[\s\S]*?inset -3px -4px 8px/);
  assert.match(gel, /\.desktop-tienda-app-icon::before/);
  assert.match(gel, /\.desktop-tienda-app-icon::after/);
  assert.match(gel, /pointer-events: none/);
  assert.match(gel, /\.desktop-tienda-app-art \{[\s\S]*?z-index: 1/);
});

test("The bubble changes no launcher action, other app icons or checkout", () => {
  assert.match(desktop, /app\.id === "tienda" \? openStore\(\) : launchApp\(app\.id\)/);
  assert.match(desktop, /className="desktop-tienda-app-icon"/);
  assert.match(desktop, /<DesktopAppIcon kind=\{app\.icon\} className="h-full w-full" \/>/);
  assert.match(desktop, /className="desktop-tienda-app-title">Tienda/);
  assert.match(css, /\.desktop-shortcut--tienda-app-icon \.desktop-shortcut-label/);
  assert.doesNotMatch(gel, /\.retro-window-dialog|\.desktop-taskbar\s*\{|\.product-purchase-summary/);
});
