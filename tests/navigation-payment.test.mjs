import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, globals = {}) {
  const cjsModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText, { module: cjsModule, exports: cjsModule.exports, Error, AbortController, ...globals });
  return cjsModule.exports;
}
test('payment sessions change with quantity, price, customization and delivery, but not line order', () => {
  const { paymentSessionKey } = load('src/lib/payment-session.ts');
  const a = { id: 'a', quantity: 1, unitPrice: 50, fulfillment: 'leon', detail: '100g', wix: { supported: false } };
  const b = { ...a, id: 'b' };
  const preferences = { deliveryType: 'pickup' };
  const initial = paymentSessionKey([a, b], preferences);
  assert.equal(initial, paymentSessionKey([b, a], preferences));
  for (const patch of [{ quantity: 2 }, { unitPrice: 60 }, { personalization: 'Luna' }, { fulfillment: 'national' }]) {
    assert.notEqual(initial, paymentSessionKey([{ ...a, ...patch }, b], preferences));
  }
  assert.notEqual(initial, paymentSessionKey([a, b], { deliveryType: 'delivery' }));
});
test('SPEI rejects old, duplicate and unrelated replies across session remounts', () => {
  const { SpeiRequestTracker } = load('src/lib/payment-session.ts', { Date: { now: () => 100 } });
  const first = new SpeiRequestTracker();
  const old = first.issue('details');
  const second = new SpeiRequestTracker();
  const current = second.issue('details');
  assert.ok(current > old);
  assert.equal(second.accept('details', old), false);
  assert.equal(second.accept('upload', current), false);
  assert.equal(second.accept('details', current), true);
  assert.equal(second.accept('details', current), false);
  const replaced = second.issue('upload');
  const latest = second.issue('upload');
  assert.equal(second.acceptError(replaced), false);
  assert.equal(second.acceptError(latest), true);
  assert.equal(second.acceptError(latest), false);
});
test('admin proof updates preserve the delivery draft identity; saved delivery changes reset it', () => {
  const { scheduleDraftKey, readAdminSession, writeAdminSession } = load('src/lib/admin-state.ts', {
    window: { sessionStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } } },
  });
  const order = { id: 'one', scheduledAt: null, deliveryDate: null, deliveryTime: '', deliveryType: 'pickup', deliveryPoint: '', operationalNote: '' };
  assert.equal(scheduleDraftKey(order), scheduleDraftKey({ ...order, status: 'paid', proof: 'updated' }));
  assert.notEqual(scheduleDraftKey(order), scheduleDraftKey({ ...order, deliveryTime: '12:00' }));
  assert.notEqual(scheduleDraftKey(order), scheduleDraftKey({ ...order, id: 'two' }));
  assert.equal(readAdminSession(), '');
  assert.doesNotThrow(() => writeAdminSession('fixture'));
  assert.doesNotThrow(() => writeAdminSession(''));
});
test('catalog resources abort replaced requests and ignore late results through retry and off/on', async () => {
  let memo, deps, state = null, effectDeps, cleanup, queued;
  const equal = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  const react = {
    useMemo(fn, next) { if (!equal(deps, next)) { memo = fn(); deps = next; } return memo; },
    useState() { return [state, value => { state = value; }]; },
    useEffect(fn, next) { if (!equal(effectDeps, next)) { cleanup?.(); queued = fn; effectDeps = next; } },
  };
  const { useAsyncResource: resourceHook } = load('src/lib/use-async-resource.ts', { require: () => react });
  const requests = [];
  const loader = signal => new Promise((resolve, reject) => requests.push({ signal, resolve, reject }));
  const render = key => { const output = resourceHook(loader, key); if (queued) { cleanup = queued(); queued = null; } return output; };
  assert.equal(render('0').loading, true);
  render('1');
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve('stale'); await Promise.resolve();
  assert.equal(render('1').data, null);
  requests[1].resolve('current'); await Promise.resolve();
  assert.equal(render('1').data, 'current');
  assert.equal(render(null).loading, false);
  assert.equal(render('1').loading, true);
  requests[2].reject(Error('network')); await Promise.resolve();
  assert.equal(render('1').error, 'network');
  render('2'); cleanup();
  assert.equal(requests[3].signal.aborted, true);
});
