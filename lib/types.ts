/*
 * Content types. Pages are Elementor-style element trees (containers and
 * widgets) converted from the live site, so the same design rules apply; text,
 * images and links in them are editable in /cms.
 */

export type Img = {
  src: string;
  alt: string;
  /** Intrinsic size of the file. */
  width?: number;
  height?: number;
  /** Size attributes the live page used for this image (layout depends on them). */
  dw?: number;
  dh?: number;
  sizes?: string;
  cls?: string;
  style?: string;
};

export type Link = { href: string; blank?: boolean; rel?: string };

export type Seo = {
  title: string;
  description?: string;
  robots?: string;
  ogImage?: string;
  ogType?: string;
  published?: string;
  modified?: string;
};

/* ---------- Portable Text (rich text) ---------- */

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };
export type MarkDef = { _key: string; _type: "link"; href: string; blank?: boolean; rel?: string } | { _key: string; _type: "textStyle"; style: string };
export type TextBlock = {
  _type: "block";
  _key: string;
  style: string;
  children: Span[];
  markDefs: MarkDef[];
  listItem?: "bullet" | "number";
  level?: number;
  anchor?: string;
  align?: string;
};
export type ImageBlock = { _type: "imageBlock"; _key: string; image: Img; caption?: string; cls?: string; href?: string };
export type FaqBlock = { _type: "faqBlock"; _key: string; items: { _key: string; question: string; answer: Rich }[] };
export type TableBlock = { _type: "tableBlock"; _key: string; rows: { _key: string; cells: string[]; head?: boolean }[] };
export type EmbedBlock = { _type: "embedBlock"; _key: string; html: string };
export type HrBlock = { _type: "hrBlock"; _key: string };
/** WordPress "group" block: its blocks inside a wrapper with its own spacing rules. */
export type GroupBlock = { _type: "groupBlock"; _key: string; cls?: string; body?: RichBlock[] };
export type RichBlock = TextBlock | ImageBlock | FaqBlock | TableBlock | EmbedBlock | HrBlock | GroupBlock;
export type Rich = RichBlock[];

/* ---------- Element tree ---------- */

/** Every node: _type is "container" or a widget type, _key is the Elementor element id. */
export type EbNode = {
  _type: string;
  _key: string;
  cls?: string;
  /** The element's data-settings JSON (animations, carousels, backgrounds). */
  settings?: string;
  children?: EbNode[];
  [field: string]: unknown;
};

export type EbDoc = { id: string; type: string; postType?: string; cls?: string; children: EbNode[] };

export type Page = {
  path: string;
  id?: number;
  seo: Seo;
  bodyCls: string;
  doc: EbDoc;
};

export type Post = {
  slug: string;
  path: string;
  id?: number;
  title: string;
  seo: Seo;
  bodyCls: string;
  template: string;
  date: string;
  /** The date as the live site printed it, e.g. "October 1, 2024". */
  dateText?: string;
  modified?: string;
  author?: string;
  categories?: string[];
  image?: Img;
  /** The excerpt the live listings showed (else the first words of the post). */
  excerpt?: string;
  body: Rich;
};

export type Resource = {
  slug: string;
  path: string;
  id?: number;
  title: string;
  seo: Seo;
  bodyCls: string;
  template: string;
  pdf?: string;
  body: Rich;
  date?: string;
  modified?: string;
};

export type ThemePage = { path: string; id?: number; title: string; seo: Seo; bodyCls: string; body: Rich };

export type Templates = { header: EbDoc; footer: EbDoc; templates: Record<string, EbDoc> };

export type SiteSettings = {
  name: string;
  legalName: string;
  description: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  mapsUrl: string;
  logo: Img;
  social: { label: string; href: string }[];
};

/** What a page renders with: the current post/resource for dynamic widgets, and every post for listings. */
export type RenderCtx = {
  posts: Post[];
  post?: Post | Resource;
  postKind?: "post" | "datasheet" | "whitepaper";
  /** Page number for paginated post listings (/blog/2/). */
  pageNum?: number;
  icons: Record<string, string>;
  templates: Record<string, EbDoc>;
  /** Images the page shows first (eager + high fetch priority). */
  hero?: Set<string>;
};
