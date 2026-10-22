import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
export function loadWixSecurity(window, document = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/wix-message-security.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module: mod, exports: mod.exports, window, document, URL });
  return mod.exports;
}
