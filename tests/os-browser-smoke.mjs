import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { chromium, webkit } from "playwright";

const engine = process.env.OS_BROWSER_ENGINE === "webkit" ? "webkit" : "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch({
  headless: true,
  ...(engine === "chromium" ? { args: ["--no-sandbox"] } : {}),
});
const root = resolve(".preview");
const contentTypes = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon",
};
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (path === "/wix-host/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe title="Guaurritas OS" id="os" src="/guaurritas-web/" style="display:block;border:0;width:100%;height:844px"></iframe></body></html>');
    return;
  }
  const target = resolve(root, "." + path, path.endsWith("/") ? "index.html" : "");
  if (!target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    const bytes = await readFile(target);
    res.writeHead(200, { "Content-Type": contentTypes[extname(target)] ?? "application/octet-stream" });
    res.end(bytes);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const site = "http://127.0.0.1:" + server.address().port;
const app = site + "/guaurritas-web/";
let failed = 0;

async function openDesktop(frame) {
  await frame.locator(".desktop-wallpaper").waitFor({ state: "visible", timeout: 25000 });
  const explore = frame.getByRole("button", { name: /Prefiero explorar Guaurritas OS/ });
  const hasWelcome = await explore.waitFor({ state: "visible", timeout: 1600 }).then(() => true).catch(() => false);
  if (hasWelcome) await explore.click();
  await frame.getByRole("button", { name: "Activar sonidos de Guaurritas OS" }).waitFor({ timeout: 12000 });
}
try {
  for (const width of [390, 1366]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 640 ? 844 : 936 },
      isMobile: width < 640, hasTouch: width < 640,
    });
    const page = await context.newPage();
    if (width < 640) await page.emulateMedia({ reducedMotion: "reduce" });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    try {
      const response = await page.goto(app, { waitUntil: "domcontentloaded", timeout: 45000 });
      assert.equal(response?.status(), 200);
      await openDesktop(page);
      assert.equal(await page.evaluate(() => localStorage.getItem("guaurritas-os-sounds-enabled-v1")), null, "audio must start unset / off");
      const enable = page.getByRole("button", { name: "Activar sonidos de Guaurritas OS" });
      assert.equal(await enable.getAttribute("aria-pressed"), "false");
      await enable.click();
      const disable = page.getByRole("button", { name: "Silenciar sonidos de Guaurritas OS" });
      assert.equal(await disable.getAttribute("aria-pressed"), "true");
      assert.equal(await page.evaluate(() => localStorage.getItem("guaurritas-os-sounds-enabled-v1")), "on");

      // Window sounds must not interfere with focus, app opening, or close navigation.
      await page.getByRole("button", { name: "Paint", exact: true }).click();
      await page.getByRole("button", { name: /Cerrar Paint y volver a las aplicaciones/ }).waitFor();
      await page.getByRole("button", { name: /Cerrar Paint y volver a las aplicaciones/ }).click();
      await page.locator(".retro-window-dialog").waitFor({ state: "hidden" });
      await disable.click();
      assert.equal(await page.evaluate(() => localStorage.getItem("guaurritas-os-sounds-enabled-v1")), "off");
      assert.equal(await page.getByRole("button", { name: "Activar sonidos de Guaurritas OS" }).getAttribute("aria-pressed"), "false");
      await page.reload({ waitUntil: "domcontentloaded" });
      await openDesktop(page);
      assert.equal(await page.getByRole("button", { name: "Activar sonidos de Guaurritas OS" }).getAttribute("aria-pressed"), "false", "mute must persist after reload");
      assert.deepEqual(pageErrors, [], "browser errors: " + pageErrors.join("; "));
      console.log("PASS OS audio + windows", engine, width);
    } catch (error) {
      failed++;
      await mkdir("os-smoke-artifacts", { recursive: true });
      await page.screenshot({ path: "os-smoke-artifacts/" + engine + "-" + width + ".png", fullPage: true }).catch(() => {});
      console.error("FAIL OS", engine, width, String(error), pageErrors);
    } finally { await context.close(); }
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto(site + "/wix-host/", { waitUntil: "domcontentloaded", timeout: 45000 });
    const frame = page.frameLocator("#os");
    await openDesktop(frame);
    await frame.getByRole("button", { name: "Activar sonidos de Guaurritas OS" }).click();
    assert.equal(await frame.getByRole("button", { name: "Silenciar sonidos de Guaurritas OS" }).getAttribute("aria-pressed"), "true");
    await frame.getByRole("button", { name: "Silenciar sonidos de Guaurritas OS" }).click();
    assert.deepEqual(errors, [], "iframe errors: " + errors.join("; "));
    console.log("PASS OS inside local iframe", engine);
  } catch (error) {
    failed++;
    await mkdir("os-smoke-artifacts", { recursive: true });
    await page.screenshot({ path: "os-smoke-artifacts/" + engine + "-iframe.png", fullPage: true }).catch(() => {});
    console.error("FAIL OS iframe", engine, String(error), errors);
  } finally { await context.close(); }
} finally {
  await browser.close();
  await new Promise(r => server.close(r));
}
if (failed) process.exitCode = 1;
