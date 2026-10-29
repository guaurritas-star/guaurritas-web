import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, imports = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module: mod, exports: mod.exports, Intl, Date,
    require: name => { if (!(name in imports)) throw Error(name); return imports[name]; } });
  return mod.exports;
}
const prefs = load('src/lib/order-preferences.ts');
const { leonCheckoutErrors } = load('src/lib/checkout-ux.ts', { '@/lib/order-preferences': prefs });

test('checkout guidance identifies missing fields without changing delivery eligibility', () => {
  const base = { ...prefs.EMPTY_LEON_ORDER_PREFERENCES };
  const variants = [base,
    { ...base, deliveryDate: '2026-11-02' },
    { ...base, deliveryDate: '2026-11-02', preferredTime: '13:00' },
  ];
  for (const value of variants) for (const deliveryMethod of ['pending_whatsapp', 'pickup_point', 'home_delivery', 'uber_eats']) {
    for (const deliveryPoint of ['', 'invalid', 'Parque Cárcamos']) for (const deliveryAddress of ['', '   ', 'Calle de prueba 123']) {
      const input = { ...value, deliveryMethod, deliveryPoint, deliveryAddress };
      const snapshot = JSON.stringify(input);
      assert.equal(Object.values(leonCheckoutErrors(input)).every(error => !error), prefs.isLeonOrderPreferencesComplete(input));
      assert.equal(JSON.stringify(input), snapshot, 'guidance must never mutate order preferences');
    }
  }
  assert.match(leonCheckoutErrors(base).date, /fecha/);
  assert.match(leonCheckoutErrors(base).time, /horario/);
  assert.match(leonCheckoutErrors({ ...base, deliveryMethod: 'pickup_point' }).point, /punto medio/);
  assert.match(leonCheckoutErrors({ ...base, deliveryMethod: 'home_delivery' }).address, /dirección/);
});

test('Wix handoff retains quantities, variants, custom fields and protected online totals', () => {
  const pricing = load('src/lib/payment-pricing.ts');
  const messages = [];
  const mod = { exports: {} };
  const self = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/wix-checkout-bridge.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: mod.exports, module: mod, window: { self, top: {}, parent: { postMessage: data => messages.push(data) } },
    require: name => name === '@/lib/payment-pricing' ? pricing : prefs });
  const item = { id: 'fixture', name: 'Petcake', detail: 'Chico · Pollo', quantity: 2, unitPrice: 199,
    fulfillment: 'leon', personalization: 'Luna', wix: { supported: true, catalogReference: {
      appId: 'stores', catalogItemId: 'product', options: { variantId: 'variant', customTextFields: { Nombre: 'Luna' } },
    } } };
  const preferences = { ...prefs.EMPTY_LEON_ORDER_PREFERENCES, deliveryDate: '2026-11-02', preferredTime: '13:00' };
  assert.equal(mod.exports.requestWixCheckout([item], preferences).ok, true);
  const payload = messages[0];
  assert.equal(payload.items[0].quantity, 2);
  assert.equal(payload.items[0].catalogReference, item.wix.catalogReference);
  assert.equal(Number(payload.items[0].catalogOverrideFields.price) * 2, pricing.buildProtectedUnitPrices([item]).protectedTotal);
  assert.match(payload.buyerNote, /Luna/);
  assert.match(payload.buyerNote, /GUAURRITAS_PREFS:/);
  assert.equal(mod.exports.requestWixCheckout([{ ...item, fulfillment: 'national' }]).ok, true);
  assert.equal(messages[1].items[0].catalogOverrideFields.price, '199.00');
  assert.equal(mod.exports.requestWixCheckout([{ ...item, wix: { supported: false } }]).ok, false);
  assert.equal(messages.length, 2);
});
