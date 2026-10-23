import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const cart = fs.readFileSync("src/components/cart/TaskbarCart.tsx", "utf8");
const delivery = fs.readFileSync("src/components/cart/LeonOrderPreferences.tsx", "utf8");

test("progressive checkout components remain valid TSX", () => {
  for (const [file, source] of [
    ["TaskbarCart.tsx", cart],
    ["LeonOrderPreferences.tsx", delivery],
  ]) {
    const result = ts.transpileModule(source, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        jsx: ts.JsxEmit.Preserve,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
    });
    const errors = (result.diagnostics || []).filter(
      (d) => d.category === ts.DiagnosticCategory.Error,
    );
    assert.equal(errors.length, 0, file + ": " + errors.map(
      (e) => ts.flattenDiagnosticMessageText(e.messageText, " "),
    ).join("; "));
  }
});

test("delivery comes before payment; payment is revealed only after validation", () => {
  assert.match(cart, /leonCheckoutStep === "delivery" \? \(/);
  assert.match(cart, /leonCheckoutStep === "payment" \? "#leon-payment-heading"/);
  assert.match(cart, /if \(!isLeonOrderPreferencesComplete\(resolved\) \|\| !validDate\)/);
  assert.match(cart, /setLeonFulfillmentConfirmed\(true\);[\s\S]*?setLeonCheckoutStep\("payment"\)/);
  assert.match(cart, /const editLeonDelivery = \(\) => \{[\s\S]*?setLeonCheckoutStep\("delivery"\);/);
  assert.match(cart, /showErrors=\{leonValidationAttempted\}/);
});

test("editing delivery resets payment selection without changing cart or pricing helpers", () => {
  const edit = cart.match(/const editLeonDelivery = \(\) => \{([\s\S]*?)\n  \};/)?.[1] || "";
  assert.match(edit, /setLeonPaymentMethod\(null\)/);
  assert.match(edit, /setResolvedPaymentPreferences\(null\)/);
  assert.match(cart, /buildProtectedUnitPrices\(leonItems\)\.protectedTotal/);
  assert.match(cart, /requestWixCheckout\(items, preferences\)/);
});

test("form keeps accessible mobile targets and all supported delivery methods", () => {
  assert.match(delivery, /type="date"/);
  assert.match(delivery, /min=\{minDate\}/);
  assert.match(delivery, /aria-invalid=\{dateError \|\| undefined\}/);
  assert.match(delivery, /min-h-12/);
  for (const method of ["pending_whatsapp", "pickup_point", "home_delivery"]) {
    assert.ok(delivery.includes('value="' + method + '"'));
  }
});
