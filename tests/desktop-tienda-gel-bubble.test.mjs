import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/globals.css", "utf8");
const desktop = readFileSync("src/components/desktop/Desktop.tsx", "utf8");
const gel = css.slice(css.indexOf("/* Tienda app-icon pilot"));

test("Tienda icon has a white glossy bubble with a clear rim, raised border and soft depth", () => {
  assert.match(gel, /border-radius: 30%/);
  assert.match(gel, /radial-gradient\(ellipse 100% 72%/);
  assert.match(gel, /box-shadow:[\s\S]*?inset -3px -6px 10px/);
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
