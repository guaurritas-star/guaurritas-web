import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function session(storage) {
  let getSnapshot;
  const cjsModule = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/welcome-session.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module: cjsModule, exports: cjsModule.exports, URLSearchParams,
    window: { sessionStorage: storage },
    require: () => ({ useSyncExternalStore: (_subscribe, snapshot) => { getSnapshot = snapshot; return snapshot(); } }),
  });
  const api = cjsModule.exports;
  api.useWelcomeAvailable();
  return { ...api, snapshot: () => getSnapshot() };
}

test("general welcome bypasses app/product/world/delivery links, anchors and checkout returns", () => {
  const { isGeneralEntry } = session({ getItem: () => null });
  assert.equal(isGeneralEntry(""), true);
  assert.equal(isGeneralEntry("?utm_source=instagram"), true);
  for (const search of ["?app=tienda", "?app=mascota", "?world=cuisine", "?product=happy-bag", "?fulfillment=leon", "?checkoutId=fixture", "?orderId=fixture", "?paymentStatus=cancelled", "?returnUrl=fixture", "?welcome=0"]) {
    assert.equal(isGeneralEntry(search), false, search);
  }
  assert.equal(isGeneralEntry("", "#comments"), false);
});

test("welcome waits for readiness, persists dismissal and tolerates blocked session storage", () => {
  let saved = null;
  const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
  const first = session(storage);
  assert.equal(first.snapshot(), false);
  first.markWelcomeReady();
  assert.equal(first.snapshot(), true);
  first.dismissWelcome();
  assert.equal(first.snapshot(), false);
  const reload = session(storage);
  reload.markWelcomeReady();
  assert.equal(reload.snapshot(), false);
  const blocked = session({ getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } });
  blocked.markWelcomeReady();
  assert.equal(blocked.snapshot(), true);
  assert.doesNotThrow(() => blocked.dismissWelcome());
  assert.equal(blocked.snapshot(), false);
});
