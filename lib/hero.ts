import type { EbDoc, EbNode } from "@/lib/types";
import { docCss } from "@/lib/doc-css";

/*
 * The first screen of a page: its first sections. Images in them load eagerly
 * with fetchPriority="high"; their CSS background images are preloaded for the
 * breakpoints they show at. Everything else loads lazily.
 */

const visibleOn = (n: EbNode) => {
  const c = n.cls ?? "";
  return { desktop: !/elementor-hidden-desktop/.test(c), tablet: !/elementor-hidden-tablet/.test(c), mobile: !/elementor-hidden-mobile/.test(c) };
};

/** The first top-level section shown on desktop and the first shown on phones. */
export function heroSections(doc: EbDoc): EbNode[] {
  const top = doc.children.filter((c) => c._type === "container");
  const out: EbNode[] = [];
  const d = top.find((c) => visibleOn(c).desktop);
  const m = top.find((c) => visibleOn(c).mobile);
  if (d) out.push(d);
  if (m && m !== d) out.push(m);
  return out;
}

/** Keys of image widgets (and posts lists, whose first image is then loaded first) inside the hero sections. */
export function heroKeys(sections: EbNode[]): Set<string> {
  const keys = new Set<string>();
  const walk = (n: EbNode) => {
    if (n._type === "image" || n._type === "imageBox" || n._type === "posts") keys.add(n._key);
    (n.children ?? []).forEach(walk);
  };
  sections.forEach(walk);
  // the sections themselves: their backgrounds are never lazy-loaded (class e-no-lazyload)
  sections.forEach((sec) => keys.add(sec._key));
  return keys;
}

const MEDIA: Record<string, string> = { "max-width:767px": "(max-width: 767px)", "max-width:1024px": "(min-width: 768px) and (max-width: 1024px)" };

/** Background images of the hero sections (and their direct children), with the media query each applies at. */
export function heroBackgrounds(doc: EbDoc, sections: EbNode[]): { href: string; media?: string }[] {
  const css = docCss(doc.id);
  if (!css) return [];
  const keys = new Set<string>();
  for (const s of sections) {
    keys.add(s._key);
    for (const c of s.children ?? []) if (c._type === "container") keys.add(c._key);
  }
  const out = new Map<string, { href: string; media?: string }>();
  for (const line of css.split("\n")) {
    const url = line.match(/background-image:url\("([^"]+)"\)/)?.[1];
    if (!url) continue;
    const key = line.match(/elementor-element-([0-9a-f]+)(?:[:\s,{])/)?.[1];
    if (!key || !keys.has(key)) continue;
    const mq = line.match(/^@media\s*\(([^)]+)\)/)?.[1]?.replace(/\s/g, "");
    const sec = sections.find((s) => s._key === key || (s.children ?? []).some((c) => c._key === key));
    if (sec && mq === "max-width:767px" && !visibleOn(sec).mobile) continue;
    if (sec && !mq && !visibleOn(sec).desktop && !visibleOn(sec).tablet && url.endsWith("-1920.webp")) continue;
    // Full-width backgrounds have tablet (-1200) and phone (-828) copies, so the -1920 file is desktop-only.
    let media = mq ? MEDIA[mq] : url.endsWith("-1920.webp") ? "(min-width: 1025px)" : undefined;
    if (!mq && sec) {
      const v = visibleOn(sec);
      if (!v.mobile) media = media ?? "(min-width: 768px)";
      else if (!v.desktop && !v.tablet) media = "(max-width: 767px)";
    }
    out.set(`${url}|${media ?? ""}`, { href: url, media });
  }
  return [...out.values()];
}
