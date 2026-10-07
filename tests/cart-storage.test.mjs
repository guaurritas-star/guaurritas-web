import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, window, imports) {
  const cjsModule = { exports: {} };
  const context = { module: cjsModule, exports: cjsModule.exports, window, require: (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return cjsModule.exports;
}

const product = { id: 'fixture', name: 'Premio', detail: '100 g', unitPrice: 50, image: '/fixture.png' };

function cart(storage) {
  let subscribe;
  const window = { localStorage: storage };
  const fulfillment = load('src/lib/fulfillment-store.ts', window, {});
  const api = load('src/lib/cart-store.ts', window, {
    react: { useSyncExternalStore: (listen, snapshot) => { subscribe = listen; return snapshot(); } },
    '@/lib/fulfillment-store': fulfillment,
    '@/lib/wix-commerce-map': { resolveCuisineWixBinding: () => ({ supported: false }) },
    '@/lib/national-pricing': { getNationalPriceForCartItemId: (_, price) => price },
  });
  return { api, fulfillment, listen: (callback) => { api.useCart(); return subscribe(callback); } };
}

test('blocked reads and quota failures do not interrupt cart notifications or delivery choice', () => {
  const storage = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceededError'); } };
  const { api, fulfillment, listen } = cart(storage);
  let updates = 0;
  listen(() => updates++);
  assert.doesNotThrow(() => api.hydrateCart());
  assert.equal(fulfillment.getFulfillmentMode(), 'leon');
  assert.doesNotThrow(() => fulfillment.setFulfillmentMode('national'));
  api.addCartItem(product);
  assert.equal(api.useCart().count, 1);
  assert.equal(api.useCart().items[0].fulfillment, 'national');
  assert.equal(api.useCart().total, 50);
  api.changeCartQuantity('fixture', 1, 'national');
  assert.equal(api.useCart().count, 2);
  api.removeCartItem('fixture', 'national');
  assert.equal(api.useCart().count, 0);
  assert.equal(updates, 4);
});

test('hydration rejects negative stored prices and preserves valid existing items', () => {
  let saved;
  const storage = {
    getItem: (key) => key === 'guaurritas-os-cart' ? JSON.stringify([
      { ...product, quantity: 2, fulfillment: 'leon' },
      { ...product, id: 'bad', unitPrice: -50, quantity: 1 },
    ]) : 'leon',
    setItem: (key, value) => { if (key === 'guaurritas-os-cart') saved = JSON.parse(value); },
  };
  const { api } = cart(storage);
  api.hydrateCart();
  assert.equal(api.useCart().count, 2);
  assert.equal(api.useCart().total, 100);
  api.addCartItem(product);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].quantity, 3);
});

test('checkout locks only mobile Wix scrolling and releases on desktop resize', () => {
  let mobile = false;
  const messages = [], listeners = new Map();
  const source = fs.readFileSync('src/components/cart/CartPersistenceGuard.tsx', 'utf8');
  let cleanup;
  const context = {
    exports: {},
    require: () => ({ useEffect: (effect) => { cleanup = effect(); } }),
    window: {
      matchMedia: () => ({ matches: mobile }),
      parent: { postMessage: (message) => messages.push(message) },
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    document: { querySelector: () => ({}), body: {}, addEventListener() {}, removeEventListener() {} },
    MutationObserver: class { observe() {} disconnect() {} },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  context.exports.default();
  assert.equal(messages.at(-1).locked, false);
  mobile = true;
  listeners.get('resize')();
  assert.equal(messages.at(-1).locked, true);
  mobile = false;
  listeners.get('resize')();
  assert.equal(messages.at(-1).locked, false);
  cleanup();
  assert.equal(listeners.size, 0);
});

test('cart blocks opposite delivery without losing items, and unlocks when emptied', () => {
  const { api } = cart({ getItem: () => null, setItem() {} });
  api.addCartItem({ ...product, fulfillment: 'leon' });
  assert.throws(() => api.addCartItem({ ...product, id: 'national', fulfillment: 'national' }), /Tu carrito ya contiene/);
  assert.equal(api.useCart().count, 1);
  assert.equal(api.useCart().items[0].id, 'fixture');
  api.removeCartItem('fixture', 'leon');
  api.addCartItem({ ...product, fulfillment: 'national' });
  assert.equal(api.useCart().items[0].fulfillment, 'national');
  assert.throws(() => api.addCartItem({ ...product, fulfillment: 'leon' }), /Tu carrito ya contiene/);
});

test('reorder rejects mixed and conflicting batches atomically', () => {
  const { api } = cart({ getItem: () => null, setItem() {} });
  const item = { ...product, quantity: 2, fulfillment: 'national', reorderReference: { catalogItemId: 'fixture' } };
  assert.throws(() => api.addReorderItems([item, { ...item, id: 'leon', fulfillment: 'leon' }]), /no puede combinar/);
  assert.equal(api.useCart().count, 0);
  api.addCartItem({ ...product, fulfillment: 'leon' });
  assert.throws(() => api.addReorderItems([item]), /Tu carrito ya contiene/);
  assert.equal(api.useCart().count, 1);
  api.addReorderItems([{ ...item, fulfillment: 'leon' }]);
  assert.equal(api.useCart().count, 3);
});

test('national recompra follows the existing national catalog; Petcakes remain local', () => {
  const { canRepeatNational } = load('src/lib/national-catalog.ts', {}, {});
  assert.equal(canRepeatNational([{ name: 'Petcakes', world: 'cuisine' }, { name: 'Velitas', world: 'cuisine' }]), false);
  assert.equal(canRepeatNational([{ name: 'Happy Bag', world: 'cuisine' }, { name: 'Amulette', world: 'couture' }]), true);
});
