import type { MetadataRoute } from "next";
import { getRoutes, seoOf } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Every indexable URL (one sitemap; the old WordPress sitemaps redirect here). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getRoutes();
  return routes
    .filter((r) => !/noindex/i.test(seoOf(r).robots ?? ""))
    .map((r) => {
      const seo = seoOf(r);
      const lastModified = seo.modified || (r.kind === "post" ? r.post.modified : undefined);
      return { url: absoluteUrl(r.path), ...(lastModified ? { lastModified } : {}) };
    });
}
