import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/store-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports});
const api=mod.exports;
const find=(q,text)=>api.matchesSearch(api.buildSearchPlan(q),text);
test('store search understands how customers name pets and occasions',()=>{
 assert.equal(find('gato','Petcake · elige lomito o michi'),true);
 assert.equal(find('perrito','Petcake · elige lomito o michi'),true);
 assert.equal(find('pastel','Petcakes de cumpleaños'),true);
 assert.equal(find('cumpleaños','Petcake para celebrar'),true);
 assert.equal(find('premios','Guaurricookies galletas horneadas'),true);
 assert.equal(find('gato','Guaurristick premio para lomito'),false);
});
test('store search ignores accents and needs every word',()=>{
 assert.equal(find('higado','Atún, pollo o hígado'),true);
 assert.equal(find('cookie','Guaurricookies'),true);
 assert.equal(find('pastel para gato','Petcake para michi'),true);
 assert.equal(find('pastel gato','Guaurricookies para michi'),false);
 assert.equal(find('','Cualquier cosa'),true);
 assert.deepEqual([...api.buildSearchPlan('gatito').synonymLabels],['michi']);
});
