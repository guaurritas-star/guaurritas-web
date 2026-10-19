import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/order-preferences.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports,Intl,Date});
const api=mod.exports;
const base={...api.EMPTY_LEON_ORDER_PREFERENCES,deliveryDate:'2026-11-02',preferredTime:'13:00'};
test('delivery preferences require the chosen point or address and preserve the existing WhatsApp option',()=>{
 assert.equal(api.isLeonOrderPreferencesComplete(base),true);
 assert.equal(api.isLeonOrderPreferencesComplete({...base,deliveryMethod:'pickup_point'}),false);
 assert.equal(api.isLeonOrderPreferencesComplete({...base,deliveryMethod:'pickup_point',deliveryPoint:'Parque Cárcamos'}),true);
 assert.equal(api.isLeonOrderPreferencesComplete({...base,deliveryMethod:'home_delivery',deliveryAddress:'   '}),false);
 assert.equal(api.isLeonOrderPreferencesComplete({...base,deliveryMethod:'home_delivery',deliveryAddress:'Dirección de prueba'}),true);
});
test('checkout and SPEI buyer notes retain the selected delivery preference and structured marker',()=>{
 const preferences={...base,deliveryMethod:'pickup_point',deliveryPoint:'Parque Cárcamos'};
 const note=api.buildOrderBuyerNote([{name:'Petcake',quantity:1,detail:'Chico',personalization:'Luna'}],preferences);
 assert.match(note,/Punto medio · Parque Cárcamos/);
 const marker=JSON.parse(note.split('GUAURRITAS_PREFS:')[1]);
 assert.equal(marker.m,'pickup_point');assert.equal(marker.p,'Parque Cárcamos');assert.equal(marker.a,'');
 const home=api.buildOrderBuyerNote([],{...base,deliveryMethod:'home_delivery',deliveryAddress:'Dirección de prueba'});
 assert.equal(JSON.parse(home.split('GUAURRITAS_PREFS:')[1]).a,'Dirección de prueba');
 assert.ok(home.length<=1000);assert.match(home,/Uber se cotiza aparte/);
});
