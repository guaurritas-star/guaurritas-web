import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('receipt failures render hostile error text without inserting it into HTML', async () => {
  const hostile = '<img src=x onerror="alert(1)">';
  const writes = [];
  const paragraph = { textContent: '' };
  const popup = { document: { open() {}, close() {}, write(html) { writes.push(html); }, getElementById() { return paragraph; } } };
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/orderReceipt.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    module: mod, exports: mod.exports,
    window: { open: () => popup },
    document: { fonts: { ready: Promise.resolve(), load: async () => [] } },
    Image: class { constructor() { throw new Error(hostile); } },
  });
  mod.exports.openOrderReceipt({ reference: 'test', lines: [] });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 2);
  assert.ok(writes.every(html => !html.includes(hostile)));
  assert.ok(paragraph.textContent.includes(hostile), 'Original message remains readable as plain text');
});
