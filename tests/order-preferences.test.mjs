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
test('León dates and times read naturally; punto medio uses the 6:00–9:30 p. m. window',()=>{
 const norm=s=>s.replace(/\s/g,' ');
 assert.equal(api.formatLeonDate('2026-11-10'),'Mar 10 nov');
 assert.match(norm(api.formatLeonTime('13:00')),/^1:00 p\. ?m\.$/);
 assert.equal(api.LEON_PICKUP_POINT_TIME,'18:00-21:30');
 assert.match(norm(api.formatLeonTime(api.LEON_PICKUP_POINT_TIME)),/^6:00 – 9:30 p\. ?m\.$/);
 assert.equal(api.isLeonOrderPreferencesComplete({...base,deliveryMethod:'pickup_point',deliveryPoint:'Plaza Mayor',preferredTime:api.LEON_PICKUP_POINT_TIME}),true);
});
test('León delivers every day with one day of notice; the window depends on the day',()=>{
 assert.equal(api.minimumLeonDeliveryDate(new Date('2026-11-13T18:00:00Z')),'2026-11-14');
 assert.equal(api.isLeonDeliveryDateAllowed('2026-11-14',new Date('2026-11-13T18:00:00Z')),true);
 assert.equal(api.isLeonDeliveryDateAllowed('2026-11-13',new Date('2026-11-13T18:00:00Z')),false);
 assert.equal(api.leonDeliveryWindow('2026-11-13'),'18:00-21:30');
 assert.equal(api.leonDeliveryWindow('2026-11-14'),'13:00-20:00');
 assert.equal(api.leonDeliveryWindow('2026-11-15'),'13:00-20:00');
 assert.match(api.formatLeonTime('13:00-20:00').replace(/\s/g,' '),/^1:00 – 8:00 p\. ?m\.$/);
});
test('León times come every 30 minutes: weekdays 6:00–9:00 p. m., weekends 1:00–7:30 p. m.',()=>{
 assert.equal(api.leonTimeSlots('2026-11-13').join(),'18:00,18:30,19:00,19:30,20:00,20:30,21:00');
 const weekend=api.leonTimeSlots('2026-11-14');
 assert.equal(weekend[0],'13:00'); assert.equal(weekend.at(-1),'19:30'); assert.equal(weekend.length,14);
 assert.equal(api.leonTimeSlots('').length,0);
});
