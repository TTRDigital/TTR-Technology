import type { SiteSettings } from "@/lib/types";
import { absoluteUrl, siteUrl } from "@/lib/site";

const abs = (src: string) => (src.startsWith("http") ? src : absoluteUrl(src));
export const ORG_ID = `${siteUrl}/#organization`;

/** The one Organization / LocalBusiness entity for the whole site, from the site's own footer details. */
export function businessSchema(s: SiteSettings) {
  const digits = s.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": ORG_ID,
    name: s.name,
    legalName: s.legalName,
    description: s.description,
    url: absoluteUrl("/"),
    telephone: `+1-${digits.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3")}`,
    logo: abs(s.logo.src),
    image: abs(s.logo.src),
    address: { "@type": "PostalAddress", streetAddress: s.street, addressLocality: s.city, addressRegion: s.region, postalCode: s.postalCode, addressCountry: s.country },
    hasMap: s.mapsUrl,
    ...(s.social.length ? { sameAs: s.social.map((x) => x.href) } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** FAQPage with the questions and answers exactly as they appear on the page. */
export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.filter((f) => f.question && f.answer).map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

/** Blog post, the same kind of entity the live posts carried. */
export function articleSchema(p: { title: string; description?: string; date: string; modified?: string; image?: string; path: string; author?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: [abs(p.image)] } : {}),
    datePublished: p.date,
    dateModified: p.modified || p.date,
    ...(p.author ? { author: { "@type": "Person", name: p.author } } : {}),
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(p.path) },
  };
}
