// Fails CI if a page grows past the performance budget set by the rewrite.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url).pathname;
const BUDGET = { html: 25_000, js: 8_000 }; // bytes, gzip, per page

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) pages.push(p);
  }
};
walk(dist);

const jsOf = (html, seen = new Set()) => {
  for (const [, src] of html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js)"/g)) {
    if (seen.has(src)) continue;
    seen.add(src);
    const code = readFileSync(join(dist, src), "utf8");
    for (const [, dep] of code.matchAll(/from\s*"\.\/([^"]+\.js)"/g)) seen.add(`/_astro/${dep}`);
  }
  return [...seen].reduce((n, src) => n + gz(join(dist, src)), 0);
};

let failed = false;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const sizes = { html: gz(page), js: jsOf(html) };
  for (const k of Object.keys(BUDGET)) {
    if (sizes[k] > BUDGET[k]) {
      failed = true;
      console.error(`${page.replace(dist, "/")}: ${k} ${sizes[k]} B gzip > budget ${BUDGET[k]} B`);
    }
  }
}
console.log(`${pages.length} pages checked against ${JSON.stringify(BUDGET)}`);
process.exit(failed ? 1 : 0);
