import { existsSync } from "node:fs";
import path from "node:path";
import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import type { Img as ImgT } from "@/lib/types";
import { cssToStyle } from "@/lib/text";
import fileSizes from "@/lib/data/image-sizes.json";

const fileCache = new Map<string, boolean>();

/** True when the image can be shown: a Sanity image, or a local file that exists (some live images were already missing). */
function available(src: string) {
  if (!src) return false;
  if (!src.startsWith("/")) return true;
  if (!fileCache.has(src)) fileCache.set(src, existsSync(path.join(process.cwd(), "public", src)));
  return fileCache.get(src)!;
}

const sizesOf: Record<string, number[]> = fileSizes;

/** Width in pixels of the original file (the resized copies are never larger). */
function originalWidth(img: ImgT) {
  if (img.src.startsWith("/images/")) return sizesOf[img.src]?.[0] ?? img.width;
  if (img.src.startsWith("https://cdn.sanity.io/")) return img.width;
  return undefined;
}

/**
 * The resized copies round their height (640 x 427 for 780 x 520), which would draw each
 * image a fraction of a pixel taller than the live site's file. When the original has the
 * shape of the shown size, its exact proportions are given instead.
 */
function exactRatio(img: ImgT, width: number, height: number): CSSProperties {
  const orig = img.src.startsWith("/images/") ? sizesOf[img.src] : img.width && img.height ? [img.width, img.height] : undefined;
  if (!orig || !width || !height || img.src.endsWith(".svg")) return {};
  return Math.abs(orig[0] / orig[1] - width / height) < 0.01 ? { aspectRatio: `${width} / ${height}` } : {};
}

/**
 * next/image lists every configured width, but a copy of a 500px original
 * asked for at 640 is still 500px wide (local copies and Sanity's fit=max never
 * upscale). Left as "640w", the browser would draw the image at 500/640 of its
 * size wherever the layout sizes it by its own width, so each entry gets the
 * file's real width, or for fixed-size images its real density at the shown
 * width (duplicates dropped).
 */
function realSrcSet(srcSet: string, orig: number, shown: number) {
  const seen = new Set<number>();
  const out: string[] = [];
  for (const entry of srcSet.split(", ")) {
    const [url, d = "1x"] = entry.trim().split(/\s+/);
    const asked = Number(url.match(/-(\d+)\.webp$/)?.[1] ?? url.match(/[?&]w=(\d+)/)?.[1]);
    if (!asked) return srcSet; // e.g. SVG: one file at every width
    const real = Math.min(asked, orig);
    if (seen.has(real)) continue;
    seen.add(real);
    out.push(d.endsWith("w") ? `${url} ${real}w` : `${url} ${Number((real / shown).toFixed(3))}x`);
  }
  return out.join(", ");
}

/**
 * An image as the live page showed it: same width/height attributes and sizes
 * (the layout rules depend on them), served as resized WebP. Lazy unless it is
 * in the first screen (priority: eager + fetchPriority high; eager: loads right
 * away without raising its priority, e.g. the logo, which is never preloaded).
 */
export function Img({ img, className, priority, eager, style, extra }: { img?: ImgT | null; className?: string; priority?: boolean; eager?: boolean; style?: CSSProperties; extra?: Record<string, string> }) {
  if (!img) return null;
  // A file that was already missing on the live site: an empty image there kept one line of
  // height, so an empty <img> (no request) keeps the same space here.
  // eslint-disable-next-line @next/next/no-img-element
  if (!available(img.src)) return <img alt="" className={[className, img.cls].filter(Boolean).join(" ") || undefined} />;
  const width = img.dw ?? img.width ?? 300;
  const height = img.dh ?? img.height ?? (img.width && img.height ? Math.round((width * img.height) / img.width) : width);
  const cls = [className, img.cls].filter(Boolean).join(" ") || undefined;
  const { props } = getImageProps({
    src: img.src,
    alt: img.alt ?? "",
    width,
    height,
    sizes: img.sizes,
    className: cls,
    loading: priority || eager ? "eager" : "lazy",
    fetchPriority: priority ? "high" : undefined,
    style: { ...exactRatio(img, width, height), ...(img.style ? cssToStyle(img.style) : {}), ...style },
  });
  const orig = originalWidth(img);
  if (orig && props.srcSet) props.srcSet = realSrcSet(props.srcSet, orig, width);
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image's own props (alt included), with a corrected srcset
  return <img {...props} {...extra} />;
}

/** Plain URL of a local image at a given width (CSS backgrounds, Open Graph). */
export function imgUrl(src: string, width = 1200) {
  if (!src.startsWith("/images/") || src.endsWith(".svg")) return src;
  return `/_img${src.replace(/\.(jpe?g|png|webp|gif)$/i, "")}-${width}.webp`;
}
