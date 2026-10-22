import "server-only";
import { cache } from "react";
import { sanityFetch } from "@/lib/sanity/fetch";
import { merge } from "@/lib/merge";
import { dataset, projectId } from "@/sanity/env";
import { fallbackSettings } from "@/lib/data/site";
import pagesJson from "@/lib/data/pages.json";
import postsJson from "@/lib/data/posts.json";
import resourcesJson from "@/lib/data/resources.json";
import templatesJson from "@/lib/data/templates.json";
import themeJson from "@/lib/data/theme-pages.json";
import iconsJson from "@/lib/data/icons.json";
import type { EbDoc, Page, Post, Resource, SiteSettings, Templates, ThemePage } from "@/lib/types";

/* ==========================================================================
   Content layer
   Every page reads through these functions. Sanity documents win when
   present; anything missing falls back to the built-in content in lib/data
   (converted from the live site), so the site works before the CMS is filled
   in and an empty field never breaks a page.
   ========================================================================== */

export const fallbackPages = pagesJson as unknown as Page[];
export const fallbackPosts = postsJson as unknown as Post[];
export const fallbackResources = resourcesJson as unknown as { datasheets: Resource[]; whitepapers: Resource[] };
export const fallbackTemplates = templatesJson as unknown as Templates;
export const fallbackThemePages = themeJson as unknown as ThemePage[];
export const icons = iconsJson as Record<string, string>;

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

/** Sanity image -> { src, alt, width, height, … }, read straight from the asset reference. */
function toImg(v: Loose) {
  const ref = (v.asset as Loose | undefined)?._ref;
  if (typeof ref !== "string") return null;
  const m = ref.match(/^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-(\w+)$/);
  if (!m) return null;
  const out: Loose = { src: `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}x${m[3]}.${m[4]}`, alt: typeof v.alt === "string" ? v.alt : "", width: Number(m[2]), height: Number(m[3]) };
  for (const k of ["dw", "dh", "sizes", "cls", "style"]) if (v[k] !== undefined && v[k] !== null && v[k] !== "") out[k] = v[k];
  return out;
}

/**
 * Sanity -> site shape: images become Img, slugs strings, element types lose
 * their "w_" prefix (Sanity reserves names like "image"); _type and _key stay.
 */
export function normalize(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(normalize).filter((x) => x !== null && x !== undefined);
  if (!isObj(v)) return v;
  if (v._type === "altImage" || (isObj(v.asset) && typeof v.asset._ref === "string" && v.asset._ref.startsWith("image-"))) return toImg(v);
  if (v._type === "slug") return v.current;
  const out: Loose = {};
  for (const [k, x] of Object.entries(v)) {
    if (k.startsWith("_") && k !== "_type" && k !== "_key") continue;
    if (k === "_type" && typeof x === "string") {
      out._type = x.startsWith("w_") ? x.slice(2) : x;
      continue;
    }
    out[k] = normalize(x);
  }
  return out;
}

const live = `!(_id in path("drafts.**"))`;

/* ---------- settings & templates ---------- */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const cms = await sanityFetch<Loose>(`*[_id == "siteSettings"][0]`, {}, ["siteSettings"]);
  return merge(fallbackSettings, normalize(cms));
});

/** Header, footer, mega menus and shared sections (Elementor templates). */
export const getTemplates = cache(async (): Promise<Templates> => {
  const cms = await sanityFetch<Loose[]>(`*[_type == "template" && ${live}]{templateId, sections}`, {}, ["template"]);
  const byId = new Map((cms ?? []).map((d) => [String(d.templateId), normalize(d.sections) as EbDoc["children"]]));
  const withCms = (doc: EbDoc): EbDoc => {
    const sections = byId.get(doc.id);
    return sections?.length ? { ...doc, children: sections } : doc;
  };
  const t = fallbackTemplates;
  return {
    header: withCms(t.header),
    footer: withCms(t.footer),
    templates: Object.fromEntries(Object.entries(t.templates).map(([k, d]) => [k, withCms(d)])),
  };
});

/* ---------- pages ---------- */

export const getPages = cache(async (): Promise<Page[]> => {
  const cms = await sanityFetch<Loose[]>(`*[_type == "page" && ${live}]{path, seo, sections}`, {}, ["page"]);
  const byPath = new Map((cms ?? []).map((d) => [String(d.path), d]));
  return fallbackPages.map((p) => {
    const c = byPath.get(p.path);
    if (!c) return p;
    const sections = normalize(c.sections) as EbDoc["children"] | undefined;
    return { ...p, seo: merge(p.seo, normalize(c.seo)), doc: sections?.length ? { ...p.doc, children: sections } : p.doc };
  });
});

/* ---------- posts & resources ---------- */

/** CMS documents merge over the built-in item with the same slug; new CMS documents are added when complete (required fields set). */
async function collection<T extends { slug: string }>(type: string, fallback: T[], required: string[]): Promise<T[]> {
  const filter = required.map((f) => `defined(${f})`).join(" && ");
  const cms = await sanityFetch<Loose[]>(`*[_type == $type && defined(slug.current) && ${filter} && ${live}]`, { type }, [type]);
  if (!cms?.length) return fallback;
  const bySlug = new Map(fallback.map((f) => [f.slug, f]));
  const merged = cms.map((raw) => {
    const c = normalize(raw) as Partial<T>;
    const base = bySlug.get(c.slug ?? "");
    return base ? merge(base, c) : (c as T);
  });
  return [...merged, ...fallback.filter((f) => !merged.some((m) => m.slug === f.slug))];
}

export const getPosts = cache(async (): Promise<Post[]> => {
  const list = await collection<Post>("post", fallbackPosts, ["title", "date"]);
  return list
    .map((p) => ({ ...p, path: p.path || `/${p.slug}/`, template: p.template || "1937", bodyCls: p.bodyCls || fallbackPosts[0].bodyCls }))
    .sort((a, b) => b.date.localeCompare(a.date));
});

export const getResources = cache(async (kind: "datasheet" | "whitepaper"): Promise<Resource[]> => {
  const fb = kind === "datasheet" ? fallbackResources.datasheets : fallbackResources.whitepapers;
  const list = await collection<Resource>(kind, fb, ["title"]);
  return list.map((r) => ({ ...r, path: r.path || `/${kind}/${r.slug}/`, template: r.template || fb[0].template, bodyCls: r.bodyCls || fb[0].bodyCls }));
});

export const getThemePages = cache(async (): Promise<ThemePage[]> => fallbackThemePages);
