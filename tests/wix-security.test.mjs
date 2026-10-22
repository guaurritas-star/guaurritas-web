import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadWixSecurity } from './helpers/wix-security.mjs';

test('Wix responses require both the trusted origin and the real parent', () => {
  const parent = {};
  const api = loadWixSecurity({ parent });
  for (const origin of ['https://www.guaurritas.com', 'https://guaurritas.com']) {
    assert.equal(api.isTrustedWixMessage({ source: parent, origin }), true);
    assert.equal(api.isTrustedWixMessage({ source: {}, origin }), false);
  }
  for (const origin of ['null', '', 'http://www.guaurritas.com', 'https://www.guaurritas.com.evil.example', 'https://evil.example']) {
    assert.equal(api.isTrustedWixMessage({ source: parent, origin, data: { source: 'guaurritas-embed' } }), false);
  }
});

test('sensitive outbound payloads use an exact destination even with a hostile referrer', () => {
  for (const referrer of ['', 'not-a-url', 'https://evil.example/frame', 'https://guaurritas.com/page', 'https://www.guaurritas.com/guaurrinicio']) {
    const sent = [];
    const api = loadWixSecurity({ parent: { postMessage: (...args) => sent.push(args) } }, { referrer });
    const payload = { type: 'checkout', buyerNote: 'test-only' };
    api.postToWixParent(payload);
    assert.equal(sent.length, 1);
    assert.equal(sent[0][0], payload);
    assert.equal(sent[0][1], referrer.startsWith('https://guaurritas.com/') ? 'https://guaurritas.com' : 'https://www.guaurritas.com');
  }
});
