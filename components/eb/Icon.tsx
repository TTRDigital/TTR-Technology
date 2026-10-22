import { createElement, type ReactNode } from "react";
import type { Img as ImgT } from "@/lib/types";
import { Img } from "./Img";

/*
 * Icons are stored as "icon:<name>" (an SVG from lib/data/icons.json), as raw
 * SVG/<i> markup, or as an image. They are rendered as real elements (not in a
 * wrapper) because the design rules target ".elementor-icon svg" directly.
 */

const ATTR = /([:\w-]+)(?:\s*=\s*"([^"]*)")?/g;
const REACT_ATTR: Record<string, string> = {
  class: "className",
  viewbox: "viewBox",
  "xmlns:xlink": "xmlnsXlink",
  "xlink:href": "xlinkHref",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "aria-hidden": "aria-hidden",
  "fill-opacity": "fillOpacity",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
};

function attrs(s: string) {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(ATTR)) {
    const k = m[1].toLowerCase();
    if (k === "style") continue;
    const name = REACT_ATTR[k] ?? (k.includes("-") && !k.startsWith("aria-") && !k.startsWith("data-") ? k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) : k);
    out[name] = m[2] ?? "";
  }
  return out;
}

/** Minimal markup -> React for simple icon SVGs (svg, g, path, circle, rect, …) and <i class> icons. */
export function markupToReact(markup: string, keyPrefix = "i"): ReactNode {
  const tokens = markup.replace(/<!--[\s\S]*?-->/g, "").match(/<\/?[a-zA-Z][^>]*>|[^<]+/g) ?? [];
  type Frame = { tag: string; props: Record<string, string>; children: ReactNode[] };
  const root: Frame = { tag: "root", props: {}, children: [] };
  const stack: Frame[] = [root];
  let n = 0;
  for (const t of tokens) {
    if (t.startsWith("</")) {
      const f = stack.pop()!;
      const parent = stack[stack.length - 1];
      parent.children.push(createElement(f.tag, { key: `${keyPrefix}${n++}`, ...f.props }, ...f.children));
    } else if (t.startsWith("<")) {
      const m = t.match(/^<([a-zA-Z][\w:-]*)([\s\S]*?)(\/?)>$/);
      if (!m) continue;
      const tag = m[1].toLowerCase() === "lineargradient" ? "linearGradient" : m[1].toLowerCase() === "radialgradient" ? "radialGradient" : m[1].toLowerCase() === "clippath" ? "clipPath" : m[1];
      const f: Frame = { tag, props: attrs(m[2]), children: [] };
      if (m[3] === "/") stack[stack.length - 1].children.push(createElement(tag, { key: `${keyPrefix}${n++}`, ...f.props }));
      else stack.push(f);
    } else if (t.trim()) {
      stack[stack.length - 1].children.push(t);
    }
  }
  return root.children.length === 1 ? root.children[0] : root.children;
}

export type IconValue = string | { img: ImgT } | null | undefined;

export function Icon({ value, icons }: { value: IconValue; icons: Record<string, string> }) {
  if (!value) return null;
  if (typeof value === "object") return <Img img={value.img} />;
  const markup = value.startsWith("icon:") ? icons[value.slice(5)] : value;
  if (!markup) return null;
  return <>{markupToReact(markup)}</>;
}
