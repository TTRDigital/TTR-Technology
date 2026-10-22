import type { CSSProperties } from "react";

/** "color: red; --x: 1" -> React style object (custom properties kept as they are). */
export function cssToStyle(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const part of css.split(/;(?![^(]*\))/)) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const prop = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (!prop || !value) continue;
    const key = prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = value;
  }
  return out as CSSProperties;
}

/** Text that starts with [PLACEHOLDER is never shown on the site. */
export const isPlaceholder = (s: unknown) => typeof s === "string" && /^\s*\[PLACEHOLDER\b/.test(s);

/**
 * Inline HTML from the content (headings, short descriptions): only simple inline
 * tags are kept (and a heading pasted inside a heading, as on one live card), so
 * content can never inject scripts.
 */
export function safeInline(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(?!\/?(span|br|a|strong|b|em|i|font|u|sup|sub|h[1-6])\b)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'href="#"');
}

export const stripTags = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
