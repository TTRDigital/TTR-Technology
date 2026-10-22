/*
 * After `next build`: the exported pages are static HTML that needs no React in
 * the browser (every interactive part runs from the small inline runtime,
 * lib/runtime-script.ts). This removes Next.js's client scripts and the page
 * data it embeds for hydration from every page except the /cms studio, which
 * halves the HTML and removes the main-thread work a phone would spend on it.
 */
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out");
let pages = 0;
let before = 0;
let after = 0;
let removedTxt = 0;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (full === path.join(OUT, "cms") || full === path.join(OUT, "_next")) continue;
      yield* walk(full);
    } else yield full;
  }
}

for await (const file of walk(OUT)) {
  if (file.endsWith(".txt") && (path.basename(file) === "index.txt" || path.basename(file).startsWith("__next."))) {
    // React Server Component payloads, only used by client-side navigation (not used here).
    await rm(file);
    removedTxt++;
    continue;
  }
  if (!file.endsWith(".html")) continue;
  const html = await readFile(file, "utf8");
  const out = html
    // Next.js / React client bundles and their preloads
    .replace(/<script\b[^>]*\bsrc="\/_next\/[^"]*"[^>]*><\/script>/g, "")
    .replace(/<link\b[^>]*\bas="script"[^>]*\/?>/g, "")
    // React preloads every image that is not lazy (the logo, badges); only the
    // hero images (fetchPriority high) are meant to be preloaded
    .replace(/<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="image")(?![^>]*\bfetchPriority="high")[^>]*\/?>/g, "")
    // the hydration payload and bootstrap
    .replace(/<script\b(?![^>]*type="application\/ld\+json")(?![^>]*id="ttr-runtime")[^>]*>(?:(?!<\/script>)[\s\S])*?(?:self\.__next_f|__next_s|\$RC|\$RS|requestAnimationFrame\(function\(\)\{\$RT)(?:(?!<\/script>)[\s\S])*<\/script>/g, "")
    .replace(/<script id="_R_">(?:(?!<\/script>)[\s\S])*<\/script>/g, "");
  pages++;
  before += html.length;
  after += out.length;
  if (out !== html) await writeFile(file, out);
}
console.log(`[static-html] ${pages} pages: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB of HTML; ${removedTxt} RSC payload files removed`);
