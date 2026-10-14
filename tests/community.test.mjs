import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/community-reviews.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { module: mod, exports: mod.exports, URL });
const { normalizeReviews, selectReviews } = mod.exports;

test("community rejects invalid/duplicate reviews and untrusted image URLs without changing text", () => {
  const data = normalizeReviews([
    { id: "1", name: "Cliente", text: "Texto real ✨", photo: "https://static.wixstatic.com/media/real.jpg" },
    { id: "1", name: "Duplicado", text: "Duplicado" },
    { id: "2", name: "Cliente 2", text: "Sin foto", photo: "https://example.com/tracker.jpg" },
    { id: "3", name: "", text: "Inválido" }, null,
  ]);
  assert.equal(data.length, 2);
  assert.equal(data[0].text, "Texto real ✨");
  assert.equal(data[1].photo, undefined);
  assert.equal(normalizeReviews({}).length, 0);
});

test("selection varies the first opinion, caps at five, never duplicates or mutates input", () => {
  const data = Array.from({ length: 8 }, (_, i) => ({ id: String(i), name: "Cliente", text: "Real" }));
  const initial = selectReviews(data, undefined, () => 0.5);
  const next = selectReviews(data, initial[0].id, () => 0.5);
  assert.notEqual(next[0].id, initial[0].id);
  assert.equal(next.length, 5);
  assert.equal(new Set(next.map(item => item.id)).size, 5);
  assert.equal(data[0].id, "0");
  assert.equal(selectReviews([]).length, 0);
  assert.equal(selectReviews([data[0]], "0")[0].id, "0");
});
