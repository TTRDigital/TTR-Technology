import type { Metadata } from "next";
import type { Seo } from "@/lib/types";
import { imgUrl } from "@/components/eb/Img";

const SITE_NAME = "TTR Technology";

/** Rank Math's robots value ("follow, index, max-snippet:-1, …") as Next metadata. */
function robots(value?: string): Metadata["robots"] {
  const v = (value ?? "").toLowerCase();
  if (!v) return undefined;
  return {
    index: !v.includes("noindex"),
    follow: !v.includes("nofollow"),
    ...(v.includes("max-snippet:-1") ? { "max-snippet": -1 } : {}),
    ...(v.includes("max-video-preview:-1") ? { "max-video-preview": -1 } : {}),
    ...(v.includes("max-image-preview:large") ? { "max-image-preview": "large" as const } : {}),
  };
}

/** Title, description, canonical, robots, Open Graph and Twitter tags, as the live page had them. */
export function pageMetadata(seo: Seo, path: string): Metadata {
  const image = seo.ogImage ? (seo.ogImage.startsWith("/images/") ? imgUrl(seo.ogImage, 1200) : seo.ogImage) : undefined;
  const article = seo.ogType === "article";
  return {
    title: { absolute: seo.title },
    description: seo.description || undefined,
    alternates: { canonical: path },
    robots: robots(seo.robots),
    openGraph: {
      type: article ? "article" : "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: seo.title,
      description: seo.description || undefined,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(article && seo.published ? { publishedTime: seo.published } : {}),
      ...(article && seo.modified ? { modifiedTime: seo.modified } : {}),
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description || undefined, ...(image ? { images: [image] } : {}) },
  };
}
