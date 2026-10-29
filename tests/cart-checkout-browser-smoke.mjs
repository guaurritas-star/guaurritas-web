import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, webkit } from 'playwright';

const engine = process.env.CART_QA_ENGINE === 'webkit' ? 'webkit' : 'chromium';
const root = resolve('.preview');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/wix-test-host/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}iframe{width:100%;height:100dvh;border:0}</style><iframe id="os" src="/guaurritas-web/?app=tienda"></iframe><script>window.handoffs=[];addEventListener("message",e=>{if(e.source===document.querySelector("iframe").contentWindow&&e.data?.source==="guaurritas-web")handoffs.push(e.data)})</script>');
    return;
  }
  const file = resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(await readFile(file)); }
  catch { res.end(); }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true });
await mkdir('os-qa-artifacts', { recursive: true });
const reference = { appId: 'qa-stores', catalogItemId: 'qa-product', options: { variantId: 'qa-variant', customTextFields: { Nombre: 'Luna' } } };
const fixture = (fulfillment = 'leon', patch = {}) => ({ id: 'qa-order', name: 'Pedido de prueba', detail: 'Chico · Pollo · Betún',
  personalization: 'Luna · sin texto adicional', unitPrice: 200, quantity: 2, fulfillment,
  image: '/icons/desktop/taskbar-cart.webp', reorderReference: reference, shippingWeightKg: 0.2, ...patch });
let passed = 0, failed = 0;
async function scenario(width, embed, label, items, run) {
  const context = await browser.newContext({ viewport: { width, height: width < 640 ? 844 : 900 },
    reducedMotion: 'reduce', hasTouch: width < 640, isMobile: width < 640 });
  // Keep catalog discovery offline. No checkout, order, upload or payment service is called.
  await context.route('**/www.guaurritas.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await context.addInitScript(items => localStorage.setItem('guaurritas-os-cart', JSON.stringify(items)), items);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base + (embed ? '/wix-test-host/' : '/guaurritas-web/?app=tienda'));
    const surface = embed ? page.frameLocator('#os') : page;
    await surface.locator('.shopping-store-cart').click();
    const panel = surface.locator('#taskbar-cart-panel');
    await panel.waitFor();
    await run({ page, surface, panel });
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `os-qa-artifacts/cart-${engine}-${width}-${embed ? 'iframe' : 'direct'}-${label}.png` });
    passed++; console.log('PASS', engine, width, embed ? 'iframe' : 'direct', label);
  } catch (error) {
    failed++; console.error('FAIL', engine, width, embed, label, error);
    await page.screenshot({ path: `os-qa-artifacts/cart-${engine}-${width}-${embed}-${label}-FAIL.png` }).catch(() => {});
  } finally { await context.close(); }
}
const expectText = async (locator, pattern) => assert.match(await locator.innerText(), pattern);
const isFocusedAfterPaint = locator => locator.evaluate(el => new Promise(resolve =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve(document.activeElement === el)))));
const prefs = async panel => {
  await panel.locator('[data-leon-delivery-date]').fill('2030-12-02');
  await panel.locator('[data-leon-preferred-time]').selectOption('13:00');
  await panel.getByRole('checkbox').check();
};
try {
  for (const width of [390, 1366]) for (const embed of [false, true]) {
    await scenario(width, embed, 'leon', [fixture()], async ({ panel, page }) => {
      await expectText(panel, /Personalización: Luna/);
      await panel.getByRole('button', { name: 'Agregar otra unidad de Pedido de prueba' }).click();
      await expectText(panel.locator('.taskbar-cart-quantity'), /3/);
      await panel.getByRole('button', { name: 'Quitar una unidad de Pedido de prueba' }).click();
      await panel.getByRole('button', { name: 'Continuar pedido', exact: true }).click();
      await expectText(panel.locator('details'), /2 × Pedido de prueba/);
      await expectText(panel.locator('details'), /Chico · Pollo · Betún/);
      await expectText(panel.locator('details'), /Personalización: Luna/);
      await panel.getByRole('button', { name: /Transferencia SPEI/ }).click();
      assert.equal(await isFocusedAfterPaint(panel.locator('[data-leon-delivery-date]')), true);
      // Native date controls may have internal tab stops; verify keyboard escape
      // after persistence below instead of assuming a browser-specific tab order.
      await expectText(panel.locator('#leon-date-error'), /Elige una fecha/);
      await expectText(panel.locator('#leon-time-error'), /horario/);
      assert.equal(await panel.getByRole('button', { name: 'Continuar con transferencia' }).count(), 0);
      await prefs(panel);
      await panel.getByRole('button', { name: /Transferencia SPEI/ }).click();
      await expectText(panel.getByRole('region', { name: 'Revisa antes de pagar' }), /Por confirmar por WhatsApp/);
      await panel.getByRole('button', { name: 'Continuar con transferencia' }).click();
      if (embed) {
        await page.waitForFunction(() => handoffs.some(m => m.type === 'guaurritas:spei-request'));
        const spei = await page.evaluate(() => handoffs.find(m => m.type === 'guaurritas:spei-request'));
        assert.equal(spei.items[0].quantity, 2);
        assert.deepEqual(spei.items[0].catalogReference, reference);
        assert.equal(JSON.parse(spei.buyerNote.split('GUAURRITAS_PREFS:')[1]).m, 'pending_whatsapp');
      } else await expectText(panel, /Abre esta tienda desde guaurritas.com para usar transferencia SPEI/);
      await panel.getByRole('combobox', { name: 'Forma de entrega en León' }).selectOption('pickup_point');
      await panel.getByRole('button', { name: /Tarjeta \/ pago en línea/ }).click();
      assert.equal(await isFocusedAfterPaint(panel.getByRole('combobox', { name: 'Punto medio preferido' })), true);
      await panel.getByRole('combobox', { name: 'Punto medio preferido' }).selectOption('Parque Cárcamos');
      await panel.getByRole('button', { name: /Tarjeta \/ pago en línea/ }).click();
      const review = panel.getByRole('region', { name: 'Revisa antes de pagar' });
      await expectText(review, /Parque Cárcamos/);
      await expectText(review, /2030-12-02 · 13:00/);
      await expectText(review, /\$425.00/);
      await panel.getByRole('combobox', { name: 'Forma de entrega en León' }).selectOption('home_delivery');
      assert.equal(await review.count(), 0, 'delivery edits reset chosen payment');
      await panel.getByRole('button', { name: /Transferencia SPEI/ }).click();
      await expectText(panel.locator('#leon-address-error'), /dirección/);
      await panel.getByRole('textbox', { name: 'Dirección para cotizar Uber' }).fill('Calle Prueba 123, León');
      await panel.getByRole('button', { name: /Transferencia SPEI/ }).click();
      await expectText(review, /\$400.00/);
      await expectText(review, /Uber.*costo se cotiza aparte/);
      assert.equal(await panel.getByRole('button', { name: /Transferencia SPEI/ }).getAttribute('aria-pressed'), 'true');
      await panel.getByRole('button', { name: 'Continuar con transferencia' }).waitFor();
      await panel.getByRole('button', { name: /Tarjeta \/ pago en línea/ }).click();
      const pay = panel.getByRole('button', { name: 'Pagar $425.00 con tarjeta', exact: true });
      await pay.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `os-qa-artifacts/cart-review-${engine}-${width}-${embed ? 'iframe' : 'direct'}.png` });
      await pay.click();
      if (embed) {
        await page.waitForFunction(() => handoffs.some(m => m.type === 'guaurritas:checkout'));
        const messages = await page.evaluate(() => handoffs.filter(m => m.type === 'guaurritas:checkout'));
        assert.equal(messages.length, 1);
        assert.equal(messages[0].items[0].quantity, 2);
        assert.deepEqual(messages[0].items[0].catalogReference, reference);
        assert.equal(messages[0].items[0].catalogOverrideFields.price, '212.50');
        const marker = JSON.parse(messages[0].buyerNote.split('GUAURRITAS_PREFS:')[1]);
        assert.equal(marker.m, 'home_delivery'); assert.equal(marker.a, 'Calle Prueba 123, León');
        assert.equal(marker.d, '2030-12-02'); assert.equal(marker.t, '13:00');
        await panel.getByText('No se abrió el pago. Puedes intentarlo otra vez sin recargar la página.', { exact: true }).waitFor({ timeout: 12000 });
        assert.equal(await pay.isEnabled(), true, 'timeout unlocks retry without losing cart');
      } else {
        await expectText(panel, /Abre esta tienda desde guaurritas.com/);
      }
      await panel.getByRole('button', { name: /Editar cantidades o quitar productos/ }).click();
      await panel.getByRole('button', { name: 'Continuar pedido', exact: true }).click();
      assert.equal(await panel.locator('[data-leon-delivery-date]').inputValue(), '2030-12-02');
      assert.equal(await panel.getByRole('textbox', { name: 'Dirección para cotizar Uber' }).inputValue(), 'Calle Prueba 123, León');
      const bounds = await panel.evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, viewport: innerWidth }));
      assert.ok(bounds.scroll <= bounds.width + 1 && bounds.left >= -1 && bounds.right <= bounds.viewport + 1, JSON.stringify(bounds));
      if (width < 640) assert.ok(await panel.locator('[data-leon-delivery-date]').evaluate(el => el.getBoundingClientRect().height >= 48));
      await panel.getByRole('button', { name: /Editar cantidades o quitar productos/ }).click();
      await page.reload();
      const reopened = embed ? page.frameLocator('#os') : page;
      await reopened.locator('.shopping-store-cart').click();
      await expectText(panel, /Personalización: Luna/);
      assert.equal(await panel.locator('.taskbar-cart-quantity b').innerText(), '2');
      await page.keyboard.press('Escape');
      assert.equal(await panel.count(), 0);
      await reopened.locator('.shopping-store-cart').click();
      await panel.getByRole('button', { name: 'Eliminar Pedido de prueba del carrito' }).click();
      await expectText(panel, /Tu carrito está esperando/);
    });
    for (const [label, price, weight, total, enabled] of [
      ['below-minimum', 100, 0.2, null, false], ['standard', 400, 0.2, 479, true],
      ['free', 900, 0.2, 900, true], ['overweight', 900, 6, null, false],
    ]) await scenario(width, embed, label, [fixture('national', { unitPrice: price, quantity: 1, shippingWeightKg: weight })], async ({ panel, page }) => {
      const summary = panel.getByRole('region', { name: 'Desglose de envío nacional' });
      if (total === null) await expectText(summary, /Por confirmar/);
      else await expectText(summary, new RegExp('Total estimado\\s+\\$' + total + '.00'));
      await expectText(summary, /total final se revisan en el checkout seguro de Wix/);
      const pay = panel.getByRole('button', { name: enabled ? 'Pagar nacional' : label === 'overweight' ? 'Envío especial' : /Mín\./ }).filter({ visible: true });
      assert.equal(await pay.isEnabled(), enabled);
      if (enabled) {
        await pay.click();
        if (embed) {
          await page.waitForFunction(() => handoffs.some(m => m.type === 'guaurritas:checkout'));
          const message = await page.evaluate(() => handoffs.find(m => m.type === 'guaurritas:checkout'));
          assert.equal(message.items[0].catalogOverrideFields.price, price.toFixed(2));
          assert.deepEqual(message.items[0].catalogReference, reference);
        } else await expectText(panel, /Abre esta tienda desde guaurritas.com/);
      }
    });
    await scenario(width, embed, 'mixed', [fixture(), fixture('national', { id: 'qa-national' })], async ({ panel }) => {
      await expectText(panel.getByRole('alert'), /dos tipos de entrega/);
      assert.equal(await panel.getByRole('button', { name: 'Continuar pedido', exact: true }).isDisabled(), true);
      for (const button of await panel.getByRole('button', { name: 'Pagar nacional' }).all()) assert.equal(await button.isDisabled(), true);
      await panel.getByRole('button', { name: 'Eliminar Pedido de prueba del carrito' }).last().click();
      assert.equal(await panel.getByRole('button', { name: 'Continuar pedido', exact: true }).isEnabled(), true);
    });
  }
} finally { await browser.close(); await new Promise(ok => server.close(ok)); }
console.log(`Cart/checkout ${engine}: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
