import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, imports = {}, date = '2026-10-16T12:00:00-06:00') {
  const mod = { exports: {} };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [date])); } }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports: mod.exports, module: mod, Date: Clock, require: name => { if (!(name in imports)) throw new Error(name); return imports[name]; } });
  return mod.exports;
}
const promo = load('src/lib/seasonal-promotions.ts');
const pricing = load('src/lib/national-pricing.ts', { '@/lib/seasonal-promotions': promo });
test('Halloween is limited to October in Mexico and unrelated products keep their price', () => {
  assert.equal(promo.halloweenIsActive(new Date('2026-10-15T23:59:59-06:00')), false);
  assert.equal(promo.halloweenIsActive(new Date('2026-10-31T23:59:59-06:00')), true);
  assert.equal(promo.halloweenIsActive(new Date('2026-11-01T00:00:00-06:00')), false);
  assert.equal(promo.halloweenPrice('chilaquidogs', 65), 65);
  assert.equal(promo.halloweenPrice('dognuts', 105, new Date('2026-11-01T00:00:00-06:00')), 105);
});
test('Halloween prices retain cents and the correct local/national base without stacking bulk offers', () => {
  assert.equal(pricing.getCuisineOptionPrice('dognuts', 0, 105, 'leon'), 89.25);
  assert.equal(pricing.getCuisineOptionPrice('dognuts', 1, 140, 'leon'), 119);
  assert.equal(pricing.getCuisineOptionPrice('happy-bag', 0, 85, 'leon'), 72.25);
  assert.equal(pricing.getCuisineOptionPrice('happy-bag', 0, 85, 'national'), 84.15);
  assert.equal(pricing.getCuisineCookiePrice(300, 180, 'leon'), 153);
  assert.equal(pricing.getCuisineCookiePrice(300, 180, 'national'), 177.65);
  assert.equal(pricing.getCuisineCookiePrice(2000, 1140, 'leon'), 1020);
  assert.equal(promo.halloweenPrice('guaurricookies-kit', 299), 254.15);
  assert.equal(promo.halloweenPrice('bandana', 219), 197.10);
  assert.equal(promo.halloweenPrice('bandana', 249), 224.10);
});
test('national cart hydration reprices from its source once, never discounts the saved offer twice', () => {
  assert.equal(pricing.getNationalPriceForCartItemId('cuisine:happy-bag:0:flavor', 84.15), 84.15);
  assert.equal(pricing.getNationalPriceForCartItemId('cuisine:guaurricookies:300:flavors', 177.65), 177.65);
  assert.equal(pricing.getNationalPriceForCartItemId('couture:amulette:mini:ciel', 224.10), 224.10);
});
test('saved carts receive current campaign prices without removing quantities or stacking discounts', () => {
  assert.equal(pricing.getCurrentCartPrice('cuisine:dognuts:0:dog:chicken', 105, 105, 'leon'), 89.25);
  assert.equal(pricing.getCurrentCartPrice('cuisine:dognuts:0:dog:chicken', 105, 89.25, 'leon'), 89.25);
  assert.equal(pricing.getCurrentCartPrice('cuisine:guaurricookies:2000:flavors', 1140, 1140, 'leon'), 1020);
  assert.equal(pricing.getCurrentCartPrice('couture:amulette:ciel:mini', 197.10, 197.10, 'leon'), 197.10);
  assert.equal(pricing.getCurrentCartPrice('cuisine:chilaquidogs:0:Pollo:Roja', 65, 55.25, 'leon'), 65);
  const expiredPromo = load('src/lib/seasonal-promotions.ts', {}, '2026-11-01T00:00:00-06:00');
  const expiredPricing = load('src/lib/national-pricing.ts', { '@/lib/seasonal-promotions': expiredPromo });
  assert.equal(expiredPricing.getCurrentCartPrice('cuisine:dognuts:0:dog:chicken', 105, 89.25, 'leon'), 105);
  assert.equal(expiredPricing.getCurrentCartPrice('couture:amulette:ciel:mini', 197.10, 197.10, 'leon'), 219);
});
