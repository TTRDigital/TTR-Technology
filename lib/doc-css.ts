import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const cache = new Map<string, string | null>();

/**
 * The live page's own design rules for one Elementor document (lib/data/css/<id>.css),
 * inlined by the page that renders it. Header, footer and menu rules are global
 * (app/styles/elementor.css), so they have no file here.
 */
export function docCss(id: string): string | null {
  if (!cache.has(id)) {
    const file = path.join(process.cwd(), "lib/data/css", `${id}.css`);
    cache.set(id, existsSync(file) ? readFileSync(file, "utf8") : null);
  }
  return cache.get(id)!;
}
