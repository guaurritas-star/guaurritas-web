import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { preparePages } from "../scripts/prepare-pages.mjs";

test("deploy retains recent hashes without overwriting current assets or copying old HTML", t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "guaurritas-pages-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const out = path.join(root, "out"), previous = path.join(root, "previous");
  const write = (base, file, text) => {
    const target = path.join(base, file);
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); return target;
  };
  write(out, "guaurritas-embed.js", 'const release="__GUAURRITAS_RELEASE__"');
  write(out, "_next/static/current.css", "current");
  write(previous, "_next/static/current.css", "old");
  const cached = write(previous, "_next/static/cached.css", "cached");
  const expired = write(previous, "_next/static/expired.css", "expired");
  const now = Date.now();
  fs.utimesSync(cached, new Date(now - 3600000), new Date(now - 3600000));
  fs.utimesSync(expired, new Date(now - 3 * 86400000), new Date(now - 3 * 86400000));
  write(previous, "index.html", "old html");
  write(out, "index.html", '<link href="/guaurritas-web/_next/static/current.css"><link href="/guaurritas-web/_next/static/cached.css">');
  assert.equal(preparePages(out, [previous], "release123", now), 1);
  assert.equal(fs.readFileSync(path.join(out, "_next/static/current.css"), "utf8"), "current");
  assert.equal(fs.existsSync(path.join(out, "_next/static/expired.css")), false);
  assert.match(fs.readFileSync(path.join(out, "index.html"), "utf8"), /current.css/);
  assert.match(fs.readFileSync(path.join(out, "guaurritas-embed.js"), "utf8"), /release123/);
  assert.equal(Math.round(fs.statSync(path.join(out, "_next/static/cached.css")).mtimeMs), now - 3600000);
});

test("deploy refuses HTML referencing missing assets", t => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "guaurritas-missing-"));
  t.after(() => fs.rmSync(out, { recursive: true, force: true }));
  fs.writeFileSync(path.join(out, "guaurritas-embed.js"), "__GUAURRITAS_RELEASE__");
  fs.writeFileSync(path.join(out, "index.html"), '<script src="/guaurritas-web/_next/static/missing.js"></script>');
  assert.throws(() => preparePages(out, [], "release123"), /Missing asset/);
});
