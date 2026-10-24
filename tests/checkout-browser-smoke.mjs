import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve(".preview");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (pathname === "/wix-test-host/") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.writeHead(200).end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe id="guaurritas" title="Guaurritas OS" src="/guaurritas-web/" style="display:block;width:100%;height:900px;border:0"></iframe></body></html>');
    return;
  }
  const file = resolve(root, "." + pathname, pathname.endsWith("/") ? "index.html" : "");
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const buffer = await readFile(file);
    res.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
    res.writeHead(200).end(buffer);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));

const base = "http://127.0.0.1:" + server.address().port + "/guaurritas-web/";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
let failures = 0;
try {
  for (const width of [390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      const seededCart = [{
        id: "smoke-test-product",
        name: "Premios prueba",
        detail: "100 g",
        unitPrice: 180,
        image: "/icons/desktop/taskbar-cart.webp",
        quantity: 1,
        fulfillment: "leon",
      }];
      localStorage.setItem("guaurritas-os-cart", JSON.stringify(seededCart));
    });
    const page = await context.newPage();
    const exceptions = [];
    page.on("pageerror", e => exceptions.push(e.message));
    try {
      const result = await page.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.equal(result?.status(), 200, "home must respond");
      await page.locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 25000 });
      assert.equal(await page.getByRole("button", { name: /El carrito no está disponible/ }).count(), 0, "error boundary fallback must not appear");
      await page.getByRole("button", { name: /Carrito con 1 artículo/ }).waitFor({ timeout: 20000 });
      await page.getByRole("button", { name: /Carrito con 1 artículo/ }).click();
      await page.getByRole("button", { name: "Continuar pedido" }).click();
      await page.getByText("Paso 1 de 2 · Entrega").waitFor();
      assert.equal(await page.getByText("Elige cómo pagar").count(), 0, "payment should be hidden until delivery ready");
      await page.getByRole("button", { name: /Continuar al pago/ }).click();
      await page.getByText("Selecciona una fecha disponible.").waitFor();
      await page.locator('input[data-leon-delivery-date]').fill("2099-11-20");
      await page.locator('select[data-leon-preferred-time]').selectOption("13:00");
      await page.getByRole("button", { name: /Continuar al pago/ }).click();
      await page.getByText("Paso 2 de 2 · Pago").waitFor();
      await page.getByText("Elige cómo pagar").waitFor();
      await page.getByRole("button", { name: /Transferencia SPEI/ }).waitFor();
      await page.getByRole("button", { name: /Tarjeta \/ pago en línea/ }).waitFor();
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await page.getByText("Paso 1 de 2 · Entrega").waitFor();
      assert.equal(await page.locator('input[data-leon-delivery-date]').inputValue(), "2099-11-20", "date must persist when editing delivery");
      assert.deepEqual(exceptions, [], "uncaught browser exceptions: " + exceptions.join("; "));
      console.log("PASS checkout browser", width);
    } catch (error) {
      failures++;
      await mkdir("checkout-smoke-artifacts", { recursive: true });
      await page.screenshot({ path: "checkout-smoke-artifacts/checkout-" + width + ".png", fullPage: true }).catch(() => {});
      console.error("FAIL checkout browser " + width + ": " + String(error), "page errors:", exceptions);
    } finally {
      await context.close();
    }
  }

  // Wix-like iframe hosting smoke. The real Wix domain and Safari still need QA.
  const iframeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const iframePage = await iframeContext.newPage();
  const iframeErrors = [];
  iframePage.on("pageerror", error => iframeErrors.push(error.message));
  try {
    await iframePage.goto("http://127.0.0.1:" + server.address().port + "/wix-test-host/", { waitUntil: "domcontentloaded" });
    await iframePage.frameLocator("#guaurritas").locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 30000 });
    assert.deepEqual(iframeErrors, [], "iframe browser exceptions: " + iframeErrors.join("; "));
    console.log("PASS checkout inside local iframe 390");
  } catch (error) {
    failures++;
    await mkdir("checkout-smoke-artifacts", { recursive: true });
    await iframePage.screenshot({ path: "checkout-smoke-artifacts/iframe-390.png", fullPage: true }).catch(() => {});
    console.error("FAIL embedded checkout: " + String(error), "page errors:", iframeErrors);
  } finally {
    await iframeContext.close();
  }
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
if (failures) process.exitCode = 1;
