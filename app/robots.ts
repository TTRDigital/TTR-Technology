import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// Everything is open to crawlers except the CMS studio.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/cms/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
