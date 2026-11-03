import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const desktop = readFileSync("src/components/desktop/Desktop.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

test("Only Tienda launcher gets white app tile with integrated name", () => {
  assert.match(desktop, /app\.id === "tienda" \? \(/);
  assert.match(desktop, /className="desktop-tienda-app-icon"/);
  assert.match(desktop, /className="desktop-tienda-app-title">Tienda/);
  assert.match(desktop, /src=\{desktopIconImages\.cart\}/);
  assert.match(desktop, /<DesktopAppIcon kind=\{app\.icon\} className="h-full w-full" \/>/);
  assert.match(css, /\.desktop-shortcut--tienda-app-icon \.desktop-shortcut-label/);
  assert.match(css, /visibility: hidden/);
});

test("Pilot leaves window and taskbar icon paths and buying behavior unchanged", () => {
  assert.match(desktop, /onClick=\{\(\) => app\.id === "tienda" \? openStore\(\) : launchApp\(app\.id\)\}/);
  assert.match(desktop, /icon=\{<DesktopAppIcon kind=\{selectedApp\.icon\} className="h-full w-full" \/>\}/);
  assert.match(desktop, /<TaskbarCart/);
  assert.doesNotMatch(css.slice(css.indexOf("/* Tienda app-icon pilot")), /\.retro-window-dialog|\.desktop-taskbar\s*\{/);
});
