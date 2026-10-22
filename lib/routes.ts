import "server-only";
import { cache } from "react";
import { getPages, getPosts, getResources, getThemePages } from "@/lib/content";
import type { EbNode, Page, Post, Resource, ThemePage } from "@/lib/types";
import { stripTags } from "@/lib/text";
import blogSeo from "@/lib/data/blog-seo.json";

/* Every URL of the site, and what renders it. Paths keep the live site's URLs. */

export type Route =
  | { kind: "page"; path: string; page: Page; pageNum?: number }
  | { kind: "post"; path: string; post: Post }
  | { kind: "datasheet" | "whitepaper"; path: string; item: Resource }
  | { kind: "theme"; path: string; page: ThemePage };

export const getRoutes = cache(async (): Promise<Route[]> => {
  const [pages, posts, datasheets, whitepapers, theme] = await Promise.all([getPages(), getPosts(), getResources("datasheet"), getResources("whitepaper"), getThemePages()]);
  const routes: Route[] = [];
  for (const p of pages) {
    routes.push({ kind: "page", path: p.path, page: p });
    if (p.path === "/blog/") {
      // The paginated post list: one extra page per list page after the first.
      const lists = findPaginated(p.doc.children);
      for (let n = 2; n <= lists; n++) {
        const path = `/blog/${n}/`;
        const seo = (blogSeo as Record<string, Page["seo"]>)[path] ?? { ...p.seo, title: `${p.seo.title}` };
        routes.push({ kind: "page", path, page: { ...p, path, seo }, pageNum: n });
      }
    }
  }
  for (const post of posts) routes.push({ kind: "post", path: post.path, post });
  for (const d of datasheets) routes.push({ kind: "datasheet", path: d.path, item: d });
  for (const w of whitepapers) routes.push({ kind: "whitepaper", path: w.path, item: w });
  for (const t of theme) routes.push({ kind: "theme", path: t.path, page: t });
  return routes;
});

function findPaginated(nodes: EbNode[]): number {
  let n = 1;
  const walk = (list: EbNode[]) => {
    for (const x of list) {
      if (x._type === "posts" && Array.isArray(x.pages)) n = Math.max(n, x.pages.length);
      if (x.children) walk(x.children);
    }
  };
  walk(nodes);
  return n;
}

/** SEO fields of any route. */
export function seoOf(r: Route) {
  if (r.kind === "post") return r.post.seo;
  if ("item" in r) return r.item.seo;
  return r.page.seo;
}

/** The live <body> classes of any route. */
export function bodyClsOf(r: Route) {
  if (r.kind === "post") return r.post.bodyCls;
  if ("item" in r) return r.item.bodyCls;
  return r.page.bodyCls;
}

export async function getRoute(path: string) {
  return (await getRoutes()).find((r) => r.path === path);
}

/** A page's display name (its first H1, else its title without the site name). */
export function routeName(r: Route): string {
  if (r.kind === "post") return r.post.title;
  if ("item" in r) return r.item.title;
  if (r.kind === "theme") return r.page.title;
  let h1: string | undefined;
  const walk = (list: EbNode[]) => {
    for (const x of list) {
      if (h1) return;
      if (x._type === "heading" && x.tag === "h1" && typeof x.text === "string") h1 = stripTags(x.text);
      if (x.children) walk(x.children);
    }
  };
  walk(r.page.doc.children);
  return h1 || r.page.seo.title.replace(/\s*[|-]\s*TTR Technology\s*$/i, "").trim();
}
