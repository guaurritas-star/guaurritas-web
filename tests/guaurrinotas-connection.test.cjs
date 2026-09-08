const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual connection effect with a fake clock and fake auth client.
// No network calls, accounts, credentials, or writes to Supabase.
function setup({ rejectSession = false } = {}) {
  const timers = new Map();
  const states = [];
  const refs = [];
  const effects = [];
  const messages = [];
  let index = 0, refIndex = 0, serial = 0, handler;
  const client = { auth: {
    getUser: async () => ({ data: { user: null } }),
    setSession: async () => {
      if (rejectSession) throw new Error('Test network failure');
      return { data: { user: { id: 'fixture' } }, error: null };
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  } };
  const parent = { postMessage: (message) => messages.push(message) };
  const win = {
    self: {}, top: {}, parent,
    location: { search: '', pathname: '/' },
    setTimeout: (fn) => { timers.set(++serial, fn); return serial; },
    clearTimeout: (id) => timers.delete(id),
    addEventListener: (_, fn) => { handler = fn; },
    removeEventListener() {},
  };
  const react = {
    useState: (initial) => {
      const i = index++;
      if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
      return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }];
    },
    useRef: (value) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: value }),
    useEffect: (fn) => effects.push(fn),
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/components/apps/GuaurrinotasAuthGate.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, window: win, URLSearchParams, require: (name) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
    if (name.endsWith('/supabase/client')) return { createClient: () => client };
    if (name.endsWith('.css')) return { default: {} };
    return {};
  } });
  const mount = () => { index = 0; refIndex = 0; effects.length = 0; exports.default(); return effects[0](); };
  const cleanup = mount();
  const send = (data) => handler({ source: parent, data: { source: 'guaurritas-embed', ...data } });
  return { states, timers, messages, cleanup, mount, send,
    expire: () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } },
    error: () => states.find((s) => typeof s === 'string' && /conexión|confirmar tu sesión/.test(s)),
  };
}

test('missing Wix response stops loading instead of waiting forever', async () => {
  const h = setup();
  await Promise.resolve();
  h.send({ type: 'guaurritas:member-state', loggedIn: true });
  h.expire();
  assert.match(h.error(), /no terminó/);
  assert.equal(h.states[3], false); // checking session
  h.cleanup();
});
test('a valid bridge session cancels the deadline', async () => {
  const h = setup();
  await Promise.resolve();
  h.send({ type: 'guaurritas:member-state', loggedIn: true });
  h.send({ type: 'guaurritas:guaurrinotas-session', ok: true, accessToken: 'fixture', refreshToken: 'fixture' });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.timers.size, 0);
  assert.equal(h.states[2].id, 'fixture');
  h.cleanup();
});
test('session rejection is handled and a fresh effect can request again', async () => {
  const h = setup({ rejectSession: true });
  await Promise.resolve();
  h.send({ type: 'guaurritas:member-state', loggedIn: true });
  h.send({ type: 'guaurritas:guaurrinotas-session', ok: true, accessToken: 'fixture', refreshToken: 'fixture' });
  await Promise.resolve(); await Promise.resolve();
  assert.match(h.error(), /confirmar tu sesión/);
  h.cleanup();
  const cleanup = h.mount();
  h.send({ type: 'guaurritas:member-state', loggedIn: true });
  assert.equal(h.messages.filter((m) => m.type === 'guaurritas:guaurrinotas-session-request').length, 2);
  cleanup();
  assert.equal(h.timers.size, 0);
});
