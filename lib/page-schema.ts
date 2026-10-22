import type { Route } from "@/lib/routes";
import type { EbNode, Rich } from "@/lib/types";
import { articleSchema, breadcrumbSchema, faqPageSchema } from "@/lib/schema";
import { stripTags } from "@/lib/text";

const text = (r?: Rich) =>
  (r ?? [])
    .map((b) => (b._type === "block" ? (b.children ?? []).map((c) => c.text).join("") : ""))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/** Question-and-answer pairs exactly as they appear on the page: accordions whose titles are questions, and FAQ blocks in posts. */
function faqs(route: Route): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  const walkNodes = (list: EbNode[]) => {
    for (const n of list) {
      if (n._type === "nestedAccordion")
        for (const it of (n.items as { title: string; content: EbNode[] }[]) ?? []) {
          if (!/\?\s*$/.test(it.title)) continue;
          const answer: string[] = [];
          const collect = (l: EbNode[]) => {
            for (const x of l) {
              if (x._type === "textEditor") answer.push(text(x.body as Rich));
              else if (x._type === "heading" && typeof x.text === "string") answer.push(stripTags(x.text));
              if (x.children) collect(x.children);
            }
          };
          collect(it.content ?? []);
          out.push({ question: it.title.trim(), answer: answer.join(" ").trim() });
        }
      if (n.children) walkNodes(n.children);
    }
  };
  if (route.kind === "page") walkNodes(route.page.doc.children);
  const body = route.kind === "post" ? route.post.body : "item" in route ? route.item.body : undefined;
  for (const b of body ?? []) if (b._type === "faqBlock") for (const it of b.items ?? []) out.push({ question: it.question, answer: text(it.answer) });
  return out.filter((f) => f.question && f.answer);
}

/** BreadcrumbList on inner pages, FAQPage where the page has FAQs, BlogPosting on posts. */
export function pageSchemas(route: Route, name: (r: Route) => string) {
  const out: Record<string, unknown>[] = [];
  if (route.path !== "/") {
    const crumbs = [{ name: "Home", path: "/" }];
    if (route.kind === "post") crumbs.push({ name: "Blog", path: "/blog/" });
    else if ("item" in route) {
      crumbs.push({ name: "Resources", path: "/resources/" });
      crumbs.push(route.kind === "datasheet" ? { name: "Datasheets", path: "/resources/datasheets/" } : { name: "Whitepapers", path: "/resources/whitepapers/" });
    } else {
      const parts = route.path.split("/").filter(Boolean);
      const parents: Record<string, string> = { "managed-it-services": "Managed IT Services", "cloud-backup-services": "Cloud Backup Services", resources: "Resources", blog: "Blog" };
      for (let i = 1; i < parts.length; i++) {
        const p = `/${parts.slice(0, i).join("/")}/`;
        crumbs.push({ name: parents[parts[i - 1]] ?? parts[i - 1], path: p });
      }
    }
    crumbs.push({ name: name(route), path: route.path });
    out.push(breadcrumbSchema(crumbs));
  }
  const f = faqs(route);
  if (f.length) out.push(faqPageSchema(f));
  if (route.kind === "post") {
    const p = route.post;
    out.push(articleSchema({ title: p.title, description: p.seo.description, date: p.date, modified: p.modified, image: p.image?.src, path: p.path, author: p.author }));
  }

  return out;
}
