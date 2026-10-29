import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const embed = readFileSync("public/guaurritas-embed.js", "utf8");

test("the Wix boot overlay never disappears on a timeout alone", () => {
  assert.doesNotMatch(embed, /setTimeout\(finishLoading,\s*10000\)/);
  assert.match(embed, /setTimeout\(showConnectionProblem,\s*10000\)/);
  assert.match(embed, /message\.type === READY_MESSAGE[\s\S]*?finishLoading\(\)/);
  assert.match(embed, /bootRecovery\.hidden = false/);
  assert.match(embed, /bootRetry\.addEventListener\("click"/);
  assert.match(embed, /iframeSrc\.searchParams\.set\("attempt", String\(retryCount\)\)/);
  assert.match(embed, /clearTimeout\(loadingFallback\)/);
});

test("the boot recovery UI is visible, accessible and keeps checkout out of its retry path", () => {
  assert.match(embed, /class="guaurritas-boot-recovery" hidden/);
  assert.match(embed, /class="guaurritas-boot-retry" type="button"/);
  assert.match(embed, /\.guaurritas-boot-retry:focus-visible/);
  const retrySection = embed.slice(embed.indexOf('bootRetry.addEventListener("click"'), embed.indexOf("scheduleConnectionCheck();", embed.indexOf('bootRetry.addEventListener("click"')));
  assert.match(retrySection, /iframe\.src = iframeSrc\.href/);
  assert.doesNotMatch(retrySection, /checkout|clearStorage|removeItem|localStorage\.clear/);
});

test("custom element remains syntactically valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(embed, {filename: "guaurritas-embed.js"}));
});
