import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium, webkit } from "playwright";

const engine = process.env.WORLD_STORE_BROWSER === "webkit" ? "webkit" : "chromium";
const launcher = engine === "webkit" ? webkit : chromium;
const root = resolve(".preview");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (pathname === "/wix-test-host/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe id="guaurritas" title="Guaurritas OS" src="/guaurritas-web/?app=mundos&amp;world=cuisine" style="display:block;width:100%;height:100dvh;border:0"></iframe></body></html>');
    return;
  }
  const file = resolve(root, "." + pathname, pathname.endsWith("/") ? "index.html" : "");
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(ok => server.listen(0, "127.0.0.1", ok));
const base = "http://127.0.0.1:" + server.address().port;
const browser = await launcher.launch({ headless: true, ...(engine === "chromium" ? { args: ["--no-sandbox"] } : {}) });
const categoryName = id => id === "cuisine" ? "Cuisine" : "Couture";
const seedCart = () => localStorage.setItem("guaurritas-os-cart", JSON.stringify([{
  id: "cuisine:cake-pops", name: "Cake pops prueba", detail: "2 piezas", unitPrice: 40,
  image: "/icons/desktop/taskbar-cart.webp", quantity: 1, fulfillment: "leon",
}]));
async function navMetrics(page) {
  return page.locator(".store-app .shopping-navigation").evaluate(el => ({
    background: getComputedStyle(el).backgroundImage,
    border: getComputedStyle(el).borderBottomColor,
    storeWindow: Boolean(el.closest(".store-window-dialog")),
    scroll: getComputedStyle(el.closest(".store-window-dialog")?.querySelector(".retro-window-client") ?? el).overflowY,
    width: el.getBoundingClientRect().width,
    viewport: innerWidth,
  }));
}
async function capture(page, name) {
  await mkdir("world-store-failures", { recursive: true });
  await page.screenshot({ path: "world-store-failures/" + engine + "-" + name + ".png", fullPage: true }).catch(() => {});
}
let failures = 0;
try {
  for (const width of [1366, 390]) for (const world of ["cuisine", "couture"]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 768 },
      isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    try {
      await page.goto(base + "/guaurritas-web/?app=tienda&world=" + world, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.locator(".store-app .shopping-navigation").waitFor({ state: "visible", timeout: 25000 });
      const native = await navMetrics(page);
      assert.equal(native.storeWindow, true, "main Store should have its chrome");
      assert.equal(await page.getByRole("group", { name: "Catálogo de la tienda" }).count(), 1);

      await page.goto(base + "/guaurritas-web/?app=mundos", { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.getByRole("button", { name: "Explorar Guaurritas " + categoryName(world) }).click({ timeout: 20000 });
      const worldNav = page.locator(".store-app--world .shopping-navigation");
      await worldNav.waitFor({ state: "visible", timeout: 25000 });
      const selected = await navMetrics(page);
      assert.equal(selected.storeWindow, true, "Guaurriverse should reuse native store frame");
      assert.equal(selected.background, native.background, "same Store toolbar design");
      assert.equal(selected.border, native.border, "same Store toolbar border");
      assert.ok(selected.width <= width + 2, "toolbar stays within viewport");
      assert.equal(await page.getByRole("group", { name: "Catálogo de la tienda" }).count(), 0, "no redundant Cuisine/Couture tabs");
      assert.equal(await page.getByText(categoryName(world), { exact: true }).count() > 0, true, "chosen world visible");
      const cart = page.getByRole("button", { name: /Abrir carrito con/ });
      await cart.waitFor({ state: "visible" });
      await page.getByRole("button", { name: /Todo México/ }).click();
      assert.equal(await page.getByRole("button", { name: /Todo México/ }).getAttribute("aria-pressed"), "true", "delivery change available in Guaurriverse");
      await page.getByRole("button", { name: /Volver a explorar los mundos/ }).click();
      await page.getByRole("button", { name: "Explorar Guaurritas " + categoryName(world) }).waitFor({ state: "visible" });
      assert.deepEqual(errors, [], "page errors: " + errors.join("; "));
      console.log("PASS world/store shared design", engine, width, world);
    } catch (e) {
      failures++; await capture(page, "world-" + width + "-" + world);
      console.error("FAIL world/store", engine, width, world, String(e), errors);
    }
    await context.close();
  }

  for (const embedded of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(seedCart);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    try {
      if (embedded) await page.goto(base + "/wix-test-host/", { waitUntil: "domcontentloaded" });
      else await page.goto(base + "/guaurritas-web/?app=mundos&world=cuisine", { waitUntil: "domcontentloaded" });
      const root = embedded ? page.frameLocator("#guaurritas") : page;
      await root.locator(".store-app--world .shopping-navigation").waitFor({ state: "visible", timeout: 25000 });
      await root.getByRole("button", { name: /Abrir carrito con 1 artículo/ }).click();
      const panel = root.locator("#taskbar-cart-panel");
      await panel.waitFor({ state: "visible" });
      await panel.getByRole("button", { name: "Continuar pedido" }).click();
      const steps = root.getByLabel("Progreso del pedido");
      await steps.waitFor({ state: "visible" });
      assert.ok(await steps.isVisible(), "delivery/payment progress visible on mobile");
      assert.match(await steps.innerText(), /1 · Entrega/);
      assert.match(await steps.innerText(), /2 · Pago/);
      await root.getByText("Primero elige cuándo recibir tu pedido y después cómo pagar.").waitFor();
      const checkout = root.locator(".taskbar-cart-panel--checkout");
      const rect = await checkout.boundingBox();
      assert.ok(rect && rect.x >= -1 && rect.x + rect.width <= 392, "checkout fits mobile viewport");
      assert.deepEqual(errors, [], "browser errors: " + errors.join("; "));
      console.log("PASS world checkout steps", engine, embedded ? "iframe" : "direct");
    } catch (e) {
      failures++; await capture(page, embedded ? "checkout-iframe" : "checkout-direct");
      console.error("FAIL world checkout", engine, embedded, String(e), errors);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise(ok => server.close(ok));
}
if (failures) process.exitCode = 1;
