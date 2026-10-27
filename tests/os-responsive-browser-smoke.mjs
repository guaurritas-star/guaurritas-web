import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium, webkit } from "playwright";

const engine = process.env.OS_QA_ENGINE === "webkit" ? "webkit" : "chromium";
const launcher = engine === "webkit" ? webkit : chromium;
const root = resolve(".preview");
const mime = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (pathname === "/wix-test-host/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe id="guaurritas" title="Guaurritas OS" src="/guaurritas-web/?app=tienda" style="display:block;width:100%;height:100dvh;border:0"></iframe></body></html>');
    return;
  }
  const file = resolve(root, "." + pathname, pathname.endsWith("/") ? "index.html" : "");
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const bytes = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
    res.end(bytes);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(ok => server.listen(0, "127.0.0.1", ok));
const origin = "http://127.0.0.1:" + server.address().port;
const base = origin + "/guaurritas-web/?app=tienda";
const browser = await launcher.launch({ headless: true, ...(engine === "chromium" ? { args: ["--no-sandbox"] } : {}) });
const seedCart = () => {
  localStorage.setItem("guaurritas-os-cart", JSON.stringify([{
    id: "cuisine:cake-pops", name: "Cake pops prueba", detail: "2 piezas",
    unitPrice: 40, image: "/icons/desktop/taskbar-cart.webp",
    quantity: 1, fulfillment: "leon",
  }]));
};
const artifact = async (page, label) => {
  await mkdir("os-qa-artifacts", { recursive: true });
  await page.screenshot({ path: "os-qa-artifacts/" + engine + "-" + label + ".png", fullPage: true }).catch(() => {});
};
let failures = 0;
try {
  // The store's product buttons must stay clickable even if the toast covers them.
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await context.addInitScript(seedCart);
  const page = await context.newPage();
  const exceptions = [];
  page.on("pageerror", e => exceptions.push(e.message));
  try {
    await page.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(1200);
    console.log("DIAG desktop", JSON.stringify(await page.evaluate(() => ({
      tray: document.querySelector(".taskbar-cart-tray")?.getAttribute("aria-label"),
      cart: localStorage.getItem("guaurritas-os-cart"),
      scripts: document.querySelectorAll("script[src]").length,
      windows: document.querySelectorAll(".retro-window-dialog").length,
    }))));
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("guaurritas:os-cart-notification", {
      detail: "Cake pops prueba se agregó al carrito",
    })));
    const toast = page.locator(".os-cart-notification");
    await toast.waitFor({ state: "visible", timeout: 9000 });
    const rect = await toast.boundingBox();
    assert.ok(rect && rect.y > 0 && rect.y + rect.height < 768 - 52, "toast inside visible desktop safe area");
    const chrome = await toast.evaluate(node => ({
      hit: getComputedStyle(node).pointerEvents,
      close: getComputedStyle(node.querySelector(".os-cart-notification-close")).pointerEvents,
      action: getComputedStyle(node.querySelector(".os-cart-notification-open")).pointerEvents,
      under: (() => {
        const body = node.querySelector(".os-cart-notification-body").getBoundingClientRect();
        const el = document.elementFromPoint(body.x + body.width / 2, body.y + body.height / 2);
        return !node.contains(el);
      })(),
    }));
    assert.equal(chrome.hit, "none", "toast chrome must not intercept background clicks");
    assert.equal(chrome.close, "auto", "close remains clickable");
    assert.equal(chrome.action, "auto", "cart CTA remains clickable");
    assert.equal(chrome.under, true, "clicks through informational area reach underlying store");
    // Verify the close control is topmost; dispatch synchronously before the
    // 4.2s auto-dismiss timer races a WebKit actionability retry.
    const close = toast.getByRole("button", { name: /cerrar aviso/i });
    assert.equal(await close.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    }), true, "close must remain the actual hit target");
    await close.evaluate(node => node.click());
    assert.equal(await toast.count(), 0, "close dismisses toast");
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("guaurritas:os-cart-notification", {
      detail: "Cake pops prueba se agregó al carrito",
    })));
    await toast.getByRole("button", { name: /Ver carrito/ }).click();
    await page.locator("#taskbar-cart-panel").waitFor({ state: "visible" });
    assert.deepEqual(exceptions, [], "desktop browser exceptions: " + exceptions.join("; "));
    console.log("PASS desktop click-through", engine);
  } catch (e) { failures++; await artifact(page, "desktop"); console.error("FAIL desktop", String(e), exceptions); }
  await context.close();

  for (const width of [360, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(seedCart);
    const mobile = await ctx.newPage();
    const mobileErrors = [];
    mobile.on("pageerror", e => mobileErrors.push(e.message));
    try {
      await mobile.goto(base, { waitUntil: "domcontentloaded", timeout: 45000 });
      await mobile.locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 25000 });
      await mobile.waitForTimeout(1200);
      console.log("DIAG mobile", width, JSON.stringify(await mobile.evaluate(() => ({
        tray: document.querySelector(".taskbar-cart-tray")?.getAttribute("aria-label"),
        cart: localStorage.getItem("guaurritas-os-cart"),
        scripts: document.querySelectorAll("script[src]").length,
        windows: document.querySelectorAll(".retro-window-dialog").length,
      }))));
      const tray = mobile.locator(".shopping-store-cart");
      await tray.waitFor({ state: "visible", timeout: 9000 });
      await tray.click();
      const panel = mobile.locator("#taskbar-cart-panel");
      await panel.waitFor({ state: "visible" });
      const snapshot = await panel.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const header = el.querySelector(".taskbar-cart-titlebar").getBoundingClientRect();
        const css = getComputedStyle(el);
        return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom,
          vh: innerHeight, vw: innerWidth, headerY: header.y,
          scroll: css.overflowY, overscroll: css.overscrollBehaviorY,
          headerPos: getComputedStyle(el.querySelector(".taskbar-cart-titlebar")).position };
      });
      assert.ok(snapshot.x >= -1 && snapshot.right <= width + 1, "cart stays within viewport width " + width + ": " + JSON.stringify(snapshot));
      assert.ok(snapshot.y >= 0 && snapshot.bottom <= snapshot.vh + 1, "cart stays within viewport height");
      assert.ok(snapshot.headerY >= -1, "close/header remain on screen");
      assert.equal(snapshot.scroll, "auto");
      assert.equal(snapshot.overscroll, "contain");
      assert.equal(snapshot.headerPos, "sticky");
      await panel.getByRole("button", { name: "Continuar pedido" }).click();
      const checkout = mobile.locator(".taskbar-cart-panel--checkout");
      await checkout.waitFor({ state: "visible" });
      await checkout.getByRole("button", { name: /Cerrar carrito/ }).waitFor();
      const widthCheck = await checkout.evaluate(el => ({
        panel: el.getBoundingClientRect().width,
        viewport: innerWidth,
        overflow: getComputedStyle(el).overflowY,
      }));
      assert.ok(widthCheck.panel <= width + 1, "checkout width within viewport");
      assert.equal(widthCheck.overflow, "auto");
      assert.deepEqual(mobileErrors, [], "mobile browser exceptions: " + mobileErrors.join("; "));
      console.log("PASS mobile cart and checkout", engine, width);
    } catch (e) { failures++; await artifact(mobile, "mobile-" + width); console.error("FAIL mobile", width, String(e), mobileErrors); }
    await ctx.close();
  }

  // A local Wix-like iframe (not the real Wix payment system).
  const host = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await host.addInitScript(seedCart);
  const embed = await host.newPage();
  try {
    await embed.goto(origin + "/wix-test-host/", { waitUntil: "domcontentloaded", timeout: 45000 });
    const frame = embed.frameLocator("#guaurritas");
    await frame.locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 25000 });
    await embed.waitForTimeout(1200);
    console.log("DIAG iframe", JSON.stringify(await frame.locator("body").evaluate(() => ({
      tray: document.querySelector(".taskbar-cart-tray")?.getAttribute("aria-label"),
      cart: localStorage.getItem("guaurritas-os-cart"),
      scripts: document.querySelectorAll("script[src]").length,
    }))));
    await frame.locator(".shopping-store-cart").click({ timeout: 9000 });
    const panel = frame.locator("#taskbar-cart-panel");
    await panel.waitFor({ state: "visible" });
    const snapshot = await panel.evaluate(el => ({
      overscroll: getComputedStyle(el).overscrollBehaviorY,
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      vh: innerHeight,
    }));
    assert.equal(snapshot.overscroll, "contain");
    assert.ok(snapshot.top >= 0 && snapshot.bottom <= snapshot.vh + 1);
    console.log("PASS local Wix-like iframe", engine);
  } catch (e) { failures++; await artifact(embed, "iframe"); console.error("FAIL Wix-like iframe", String(e)); }
  await host.close();
} finally {
  await browser.close();
  await new Promise(ok => server.close(ok));
}
if (failures) process.exitCode = 1;
