import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const sound = readFileSync(new URL("../src/components/desktop/OsSoundControl.tsx", import.meta.url), "utf8");
const desktop = readFileSync(new URL("../src/components/desktop/Desktop.tsx", import.meta.url), "utf8");

test("el control de volumen es TSX válido", () => {
  const result = ts.transpileModule(sound, {
    fileName: "OsSoundControl.tsx",
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  assert.deepEqual(result.diagnostics ?? [], []);
});

test("sonido activo inicialmente, pero respeta silencio almacenado", () => {
  assert.match(sound, /\[enabled, setEnabled\] = useState\(true\)/);
  assert.match(sound, /localStorage\.getItem\(STORAGE_KEY\) !== "false"/);
  assert.match(sound, /localStorage\.setItem\(STORAGE_KEY, String\(next\)\)/);
  assert.match(sound, /aria-pressed=\{enabled\}/);
});

test("bocina Windows muestra ondas activa y una X silenciada", () => {
  assert.match(sound, /data-os-sound-state=\{enabled \? "on" : "muted"\}/);
  assert.match(sound, /<svg[\s\S]*<path d="M11 5 6 9H3v6h3l5 4V5Z"/);
  assert.match(sound, /enabled \? \([\s\S]*<path d="M18\.5 5\.5a9 9 0 0 1 0 13"/);
  assert.match(sound, /<path d="m16 9 5 6"/);
  assert.match(sound, /Silenciar sonido de Guaurritas OS/);
  assert.match(sound, /Activar sonido de Guaurritas OS/);
});

test("la bocina aparece a la derecha del carrito y antes del reloj", () => {
  assert.match(desktop, /<TaskbarCart onShop=\{openStore\} \/>\s*<OsSoundControl \/>\s*<span className="desktop-taskbar-divider"[^>]*\/>\s*<DesktopClock \/>/);
});

test("el silencio detiene el audio; la página no reproduce sonidos al entrar", () => {
  assert.match(sound, /audioContext\.current\.suspend\(\)/);
  assert.match(sound, /if \(!ready \|\| !enabled\) return/);
  assert.match(sound, /document\.addEventListener\("click", onClick, true\)/);
  assert.doesNotMatch(sound, /useEffect\(\(\) => \{\s*play\(/);
});
