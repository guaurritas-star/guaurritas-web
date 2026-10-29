import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function files(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : entry.isFile() ? [file] : [];
  });
}

export function preparePages(out, previous, release, now = Date.now()) {
  if (!/^[a-zA-Z0-9_-]+$/.test(release)) throw new Error("Invalid release identifier");
  // Safari/Wix may reuse HTML from several releases ago. Keep the immutable
  // Next.js CSS/JS/font hashes for a week, never old HTML or app configuration.
  // The previous release artifact already contains earlier retained hashes,
  // making retention cumulative without downloading many whole-site archives.
  const retentionMs = 7 * 24 * 60 * 60 * 1000;
  let retained = 0;
  for (const directory of previous) {
    const staticRoot = path.join(directory, "_next/static");
    for (const source of files(staticRoot)) {
      const stat = fs.statSync(source);
      if (now - stat.mtimeMs > retentionMs) continue;
      const destination = path.join(out, "_next/static", path.relative(staticRoot, source));
      if (fs.existsSync(destination)) continue;
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      fs.utimesSync(destination, stat.atime, stat.mtime);
      retained++;
    }
  }
  const embed = path.join(out, "guaurritas-embed.js");
  const source = fs.readFileSync(embed, "utf8");
  if (!source.includes("__GUAURRITAS_RELEASE__")) throw new Error("Missing release marker");
  fs.writeFileSync(embed, source.replace("__GUAURRITAS_RELEASE__", release));
  // Fail the deploy if a generated page refers to an absent script or stylesheet.
  for (const htmlFile of files(out).filter(file => file.endsWith(".html"))) {
    const html = fs.readFileSync(htmlFile, "utf8");
    for (const match of html.matchAll(/(?:href|src)="([^"?#]*\/_next\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
      const asset = path.join(out, match[1].slice(match[1].indexOf("/_next/") + 1));
      if (!fs.existsSync(asset)) throw new Error(`Missing asset in ${htmlFile}: ${match[1]}`);
    }
  }
  return retained;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const count = preparePages("out", process.argv.slice(2), process.env.GITHUB_SHA || "local-review");
  console.log(`Release prepared; retained ${count} recent static assets.`);
}
