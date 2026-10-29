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
// Wix-only backend discovery endpoints cannot be called from local GitHub Pages
// test origins. Ignore exactly these known CORS-origin errors, but fail on
// every other JS exception or UI/checkout assertion.
const unexpectedPageErrors = errors => errors.filter(message =>
  !/^\/www\.guaurritas\.com\/_functions\/(?:kitGuaurriCookies|descubreGuaurritas) due to access control checks\.$/.test(message)
);
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
      assert.equal(await page.getByRole("group", { name: "Ubicación de compra" }).count(), 0, "world header must not ask for delivery again");
      assert.equal(await page.locator(".shopping-world-mode").getAttribute("aria-label"), "Zona de entrega elegida en Guaurriverse: León, Guanajuato");
      const back = page.getByRole("button", { name: "Volver a explorar los mundos" });
      await back.click();
      await page.getByRole("button", { name: "Explorar Guaurritas " + categoryName(world) }).waitFor({ state: "visible" });
      const nationalWorldChoice = page.getByRole("button", { name: "Nacional", exact: true });
      await nationalWorldChoice.click();
      assert.equal(await nationalWorldChoice.getAttribute("aria-pressed"), "true", "delivery can be changed at the Guaurriverse entrance");
      await page.getByRole("button", { name: "Explorar Guaurritas " + categoryName(world) }).click();
      await page.locator(".shopping-world-mode").waitFor({ state: "visible" });
      assert.equal(await page.locator(".shopping-world-mode").getAttribute("aria-label"), "Zona de entrega elegida en Guaurriverse: Todo México");
      assert.equal(await page.getByRole("group", { name: "Ubicación de compra" }).count(), 0, "no repeated delivery picker after changing destination");
      const toolbar = page.locator(".shopping-world-toolbar");
      const toolbarBox = await toolbar.boundingBox();
      assert.ok(toolbarBox && toolbarBox.x >= -1 && toolbarBox.x + toolbarBox.width <= width + 2, "world header fits viewport");
      assert.deepEqual(unexpectedPageErrors(errors), [], "page errors: " + errors.join("; "));
      console.log("PASS world/store shared design", engine, width, world);
    } catch (e) {
      failures++; await capture(page, "world-" + width + "-" + world);
      console.error("FAIL world/store", engine, width, world, String(e), errors);
    }
    await context.close();
  }

  // Product configuration UX: guide uses the actual requirements; no checkout mutations.
  for (const width of [1366, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 768 },
      isMobile: width === 390, hasTouch: width === 390,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    try {
      await page.goto(base + "/guaurritas-web/?app=tienda", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Ver opciones de Petcakes" }).click();
      const detail = page.locator(".cuisine-detail-ux");
      await detail.waitFor({ state: "visible" });
      const guide = detail.getByRole("region", { name: "Progreso de configuración" });
      const progress = guide.getByRole("progressbar", { name: "Elecciones de producto completadas" });
      assert.equal(await progress.getAttribute("aria-valuemin"), "0");
      assert.equal(await progress.getAttribute("aria-valuemax"), "5");
      assert.equal(await progress.getAttribute("aria-valuenow"), "1", "default small size is shown as selected");
      assert.match(await guide.innerText(), /Te falta: Acabado, Lomito o michi, Proteína, Personalización/);
      await detail.getByRole("button", { name: /^betún/i }).click();
      await detail.getByRole("button", { name: /Lomito/ }).click();
      await detail.getByRole("button", { name: "Pollo", exact: true }).click();
      await detail.getByRole("button", { name: "No", exact: true }).click();
      assert.equal(await progress.getAttribute("aria-valuenow"), "5", "progress reflects real selections");
      assert.match(await guide.innerText(), /¡Listo para agregar!/);
      assert.equal(await detail.getByRole("button", { name: "Agregar al carrito", exact: true }).isEnabled(), true);
      assert.deepEqual(unexpectedPageErrors(errors), [], "unexpected product detail errors");
      console.log("PASS Cuisine product configuration guide", engine, width);
    } catch (error) {
      failures++; await capture(page, "product-guide-" + width);
      console.error("FAIL Cuisine product guide", engine, width, String(error), errors);
    }
    await context.close();
  }

  // Catalogue UX 2.0: product cards first, search reset and responsive layout.
  for (const width of [1366, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 768 },
      isMobile: width === 390, hasTouch: width === 390,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(base + "/guaurritas-web/?app=tienda", { waitUntil: "domcontentloaded" });
      const menu = page.locator(".cuisine-catalog-ux");
      await menu.waitFor({ state: "visible", timeout: 25000 });
      const cards = menu.locator(".cuisine-catalog-card");
      const initialCount = await cards.count();
      assert.ok(initialCount >= 3, "catalogue shows actual product cards");
      const search = page.getByRole("searchbox", { name: "Buscar en el menú" });
      await search.fill("petcake");
      const filteredCount = await cards.count();
      assert.ok(filteredCount > 0 && filteredCount < initialCount, "search filters real products");
      await page.getByRole("button", { name: "Limpiar búsqueda" }).click();
      assert.equal(await cards.count(), initialCount, "clear search restores products");
      await menu.getByRole("group", { name: "Filtrar productos por categoría" })
        .getByRole("button", { name: "Petcakes" }).click();
      assert.ok(await cards.count() > 0 && await cards.count() < initialCount, "category narrows catalogue");
      await page.getByRole("button", { name: "Limpiar filtros" }).click();
      assert.equal(await cards.count(), initialCount, "reset restores full menu");
      const metrics = await cards.first().evaluate(el => {
        const card = el.getBoundingClientRect();
        const photo = el.querySelector(".cuisine-catalog-card-media").getBoundingClientRect();
        return { x: card.x, right: card.right, width: card.width, photoWidth: photo.width,
          display: getComputedStyle(el).display, viewport: window.innerWidth };
      });
      assert.ok(metrics.x >= -2 && metrics.right <= width + 2, "product card stays inside viewport");
      const tagSample = menu.locator(".cuisine-catalog-card:has(.cuisine-catalog-card-badge)");
      assert.ok(await tagSample.count() >= 2, "seasonal and personalization badges exist");
      const tagFits = await tagSample.evaluateAll(cards => cards.every(card => {
        const tag = card.querySelector(".cuisine-catalog-card-badge").getBoundingClientRect();
        const body = card.querySelector(".cuisine-catalog-card-body").getBoundingClientRect();
        return tag.left >= body.left - 1 && tag.right <= body.right + 1 &&
          tag.top >= body.top - 1 && tag.bottom <= body.bottom + 1;
      }));
      assert.ok(tagFits, "no badge overflows or obscures the product photo");
      const media = await cards.first().evaluate(card => {
        const photo = card.querySelector(".cuisine-catalog-card-media").getBoundingClientRect();
        const shell = card.querySelector(".cuisine-catalog-image-shell").getBoundingClientRect();
        const img = card.querySelector("img");
        return { photoHeight: photo.height, photoWidth: photo.width,
          shellHeight: shell.height, shellWidth: shell.width,
          fit: getComputedStyle(img).objectFit };
      });
      assert.equal(media.fit, "contain", "original product image keeps its proportions");
      if (width === 390) {
        assert.ok(Math.abs(media.shellHeight - media.shellWidth) <= 2, "mobile photo uses a square visual canvas");
        assert.ok(media.shellHeight <= media.photoHeight + 2, "mobile photo fits within its panel");
      }
      if (width === 390) {
        assert.equal(metrics.display, "grid", "mobile presents compact horizontal cards");
        assert.ok(metrics.photoWidth >= 110 && metrics.photoWidth < metrics.width * .55, "photo remains readable without full-width row");
      }
      assert.deepEqual(unexpectedPageErrors(errors), [], "unexpected catalogue errors: " + errors.join("; "));
      console.log("PASS Cuisine catalogue UX 2.0", engine, width);
    } catch (error) {
      failures++; await capture(page, "catalogue-" + width);
      console.error("FAIL Cuisine catalogue UX", engine, width, String(error), errors);
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
      await root.getByText("Revisa tus productos, elige la entrega y después la forma de pago. Fecha y horario se confirman por WhatsApp.").waitFor();
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
