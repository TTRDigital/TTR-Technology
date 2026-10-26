/**
 * Loads the built-in content (lib/data, converted from the live site) and its
 * images into Sanity, so the CMS starts full instead of empty.
 *
 *   npm run seed                 # create documents that don't exist yet (add-missing)
 *   npm run seed -- --force      # overwrite with the built-in content
 *   npm run seed -- --dry-run    # build every document without uploading or writing
 *   npm run seed -- --only=page-home,post-  # only documents whose ID starts with these
 *
 * Writes to NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET
 * (environment or .env.local). Needs SANITY_WRITE_TOKEN (Editor token from
 * sanity.io/manage > API > Tokens). Without --force, anything an editor
 * already created is kept. Before writing it checks the dataset holds no
 * other website's content (documents of these types that this script did not create).
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";

const root = new URL("..", import.meta.url).pathname;

// Minimal .env.local reader so the script works without extra packages.
if (existsSync(join(root, ".env.local"))) {
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { dataset, projectId } = await import("../sanity/env.ts");
const token = process.env.SANITY_WRITE_TOKEN;
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");
const only = (process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

if (!dryRun && (!projectId || !token)) {
  console.error(!projectId ? "Set NEXT_PUBLIC_SANITY_PROJECT_ID (repository variable SANITY_PROJECT_ID, .env.local or the environment)." : "Set SANITY_WRITE_TOKEN (Editor token from sanity.io/manage > API > Tokens).");
  process.exit(1);
}

const client = createClient({ projectId: projectId || "dry-run", dataset, token, apiVersion: "2025-02-19", useCdn: false });
const read = (f: string) => JSON.parse(readFileSync(join(root, "lib/data", f), "utf8"));

type Loose = Record<string, unknown>;
const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

/* ---------- images ---------- */

const uploaded = new Map<string, string>();
const missing = new Set<string>();

async function asset(src: string): Promise<string | null> {
  if (!src) return null; // an image kept without a file (dead on the live site)
  if (uploaded.has(src)) return uploaded.get(src)!;
  const file = join(root, "public", src);
  if (!src.startsWith("/") || !existsSync(file)) {
    missing.add(src);
    return null;
  }
  if (dryRun) {
    // A reference shaped like Sanity's (image-<hash>-<w>x<h>-<ext>), so the dry run also checks lib/content.ts can read it.
    const { default: sharp } = await import("sharp");
    const ext = src.split(".").pop()!.toLowerCase();
    let w = 1;
    let h = 1;
    if (ext !== "svg") {
      const m = await sharp(file).metadata();
      w = m.width ?? 1;
      h = m.pageHeight ?? m.height ?? 1;
    }
    const ref = `image-${createHash("sha1").update(src).digest("hex")}-${w}x${h}-${ext}`;
    uploaded.set(src, ref);
    return ref;
  }
  const doc = await client.assets.upload("image", createReadStream(file), { filename: basename(file) });
  uploaded.set(src, doc._id);
  process.stdout.write(".");
  return doc._id;
}

/* ---------- built-in value -> Sanity value ---------- */

const NODE_TYPES = new Set([
  "container", "heading", "textEditor", "image", "button", "icon", "iconBox", "ekitIconBox", "iconList", "imageBox", "divider", "counter", "eaelFlipBox", "flipBox", "ekitTestimonial",
  "imageCarousel", "mediaCarousel", "nestedAccordion", "socialIcons", "rating", "html", "template", "siteLogo", "creativeButton", "spacer", "posts", "search", "fluentForm", "navMenu",
  "postTitle", "postImage", "postInfo", "postContent", "postNav",
]);

/** Object type of array members, by "<parent type>.<field>" (or any parent: "*.<field>"). */
const MEMBER: Record<string, string> = {
  "iconList.items": "iconListItem",
  "ekitTestimonial.items": "testimonial",
  "imageCarousel.slides": "slide",
  "mediaCarousel.slides": "mediaSlide",
  "nestedAccordion.items": "accordionItem",
  "socialIcons.items": "socialItem",
  "posts.pages": "postPage",
  "postInfo.items": "postInfoItem",
  "navMenu.items": "menuItem",
  "menuItem.children": "menuItem",
  "faqBlock.items": "faqItem",
  "tableBlock.rows": "tableRow",
  "container.bgSlides": "altImage",
  "siteSettings.social": "socialLink",
};
/** Object type of single object fields. */
const FIELD: Record<string, string> = {
  "*.link": "link",
  "*.seo": "seo",
  "eaelFlipBox.front": "flipSide",
  "eaelFlipBox.back": "flipSide",
  "flipBox.front": "elFlipSide",
  "flipBox.back": "elFlipSide",
};

const isImg = (v: unknown): boolean => isObj(v) && typeof v.src === "string" && "alt" in v && !("_type" in v);
let keyN = 0;
const key = () => `s${(keyN++).toString(36)}`;

async function img(v: Loose) {
  const ref = await asset(v.src as string);
  const out: Loose = { _type: "altImage", alt: v.alt ?? "" };
  for (const k of ["dw", "dh", "sizes", "cls", "style"]) if (v[k] !== undefined) out[k] = v[k];
  if (ref) out.asset = { _type: "reference", _ref: ref };
  return out;
}

async function value(v: unknown, parentType: string, field: string): Promise<unknown> {
  if (Array.isArray(v)) {
    const member = MEMBER[`${parentType}.${field}`];
    const out = [];
    for (const x of v) {
      if (isObj(x)) {
        const conv = (await value(x, parentType, field)) as Loose;
        if (member && !conv._type) conv._type = member;
        if (!conv._key) conv._key = typeof x._key === "string" ? x._key : key();
        out.push(conv);
      } else out.push(x);
    }
    return out;
  }
  if (!isObj(v)) return v;
  if (isImg(v)) return img(v as Loose);
  const t = typeof v._type === "string" ? v._type : MEMBER[`${parentType}.${field}`] ?? FIELD[`${parentType}.${field}`] ?? FIELD[`*.${field}`];
  const out: Loose = {};
  for (const [k, x] of Object.entries(v)) {
    if (k === "_type") continue;
    if (x === null || x === undefined || x === "") continue;
    out[k] = await value(x, t ?? parentType, k);
  }
  if (t) out._type = NODE_TYPES.has(t) ? `w_${t}` : t;
  return out;
}

const tree = async (children: unknown[]) => (await value(children, "doc", "sections")) as Loose[];

/* ---------- documents ---------- */

const pathId = (path: string) => path.replace(/^\/|\/$/g, "").replace(/\//g, "--") || "home";
const TEMPLATE_NAMES: Record<string, string> = {
  "3141": "Header",
  "61": "Footer",
  "3719": "Mega menu: Cyber Security",
  "3146": "Mega menu: Locations",
  "4679": "Stats band (counters)",
  "4055": "Why Our Managed IT Services are Essential",
  "1937": "Blog post layout",
  "5726": "Datasheet layout",
  "5751": "Whitepaper layout",
};

async function build() {
  const docs: Loose[] = [];
  const settings = (await import("../lib/data/site.ts")).fallbackSettings;
  docs.push({ _id: "siteSettings", _type: "siteSettings", ...((await value(settings, "siteSettings", "")) as Loose) });

  const templates = read("templates.json");
  const tpl = [templates.header, templates.footer, ...Object.values(templates.templates)] as { id: string; children: unknown[] }[];
  for (const t of tpl) docs.push({ _id: `template-${t.id}`, _type: "template", name: TEMPLATE_NAMES[t.id] ?? `Section ${t.id}`, templateId: t.id, sections: await tree(t.children) });

  for (const p of read("pages.json") as { path: string; seo: Loose; doc: { children: unknown[] } }[]) {
    const title = String(p.seo.title ?? p.path).replace(/\s*[|-]\s*TTR Technology\s*$/i, "");
    docs.push({ _id: `page-${pathId(p.path)}`, _type: "page", title, path: p.path, seo: await value(p.seo, "page", "seo"), sections: await tree(p.doc.children) });
  }
  for (const p of read("posts.json") as Loose[]) {
    docs.push({
      _id: `post-${p.slug}`,
      _type: "post",
      title: p.title,
      slug: { _type: "slug", current: p.slug },
      date: p.date,
      modified: p.modified,
      author: p.author,
      dateText: p.dateText,
      categories: p.categories,
      image: p.image ? await img(p.image as Loose) : undefined,
      excerpt: p.excerpt,
      body: await value(p.body, "post", "body"),
      seo: await value(p.seo, "post", "seo"),
    });
  }
  const res = read("resources.json");
  for (const kind of ["datasheet", "whitepaper"] as const) {
    for (const r of res[`${kind}s`] as Loose[]) {
      docs.push({ _id: `${kind}-${r.slug}`, _type: kind, title: r.title, slug: { _type: "slug", current: r.slug }, pdf: r.pdf, body: await value(r.body, kind, "body"), seo: await value(r.seo, kind, "seo") });
    }
  }
  return docs;
}

const clean = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(clean)
    : isObj(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, x]) => x !== undefined && x !== "")
            .map(([k, x]) => [k, clean(x)]),
        )
      : v;

console.log(`Seeding ${projectId || "(no project)"}/${dataset}${force ? " (overwriting)" : " (keeping existing documents)"}${dryRun ? " [dry run]" : ""}${only.length ? ` only: ${only.join(", ")}` : ""}. Images: `);
const docs = (await build()).map((d) => clean(d) as { _id: string; _type: string }).filter((d) => !only.length || only.some((p) => d._id.startsWith(p)));
console.log(`\n${uploaded.size} images ${dryRun ? "checked" : "uploaded"}${missing.size ? ` (${missing.size} referenced files do not exist, as on the live site: ${[...missing].join(", ")})` : ""}. ${dryRun ? "Built" : "Writing"} ${docs.length} documents…`);

// Every array member that is an object needs _key and _type, or Sanity refuses the write / the studio cannot show it.
const problems: string[] = [];
const walk = (v: unknown, path: string) => {
  if (Array.isArray(v))
    v.forEach((x, i) => {
      if (isObj(x)) {
        if (!("_key" in x)) problems.push(`${path}[${i}] has no _key`);
        if (!("_type" in x)) problems.push(`${path}[${i}] has no _type`);
      }
      walk(x, `${path}[${i}]`);
    });
  else if (isObj(v)) for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
};
docs.forEach((d) => walk(d, d._id));
// _key values must be unique within each array.
const dupes: string[] = [];
const walkKeys = (v: unknown, path: string) => {
  if (Array.isArray(v)) {
    const seen = new Set<string>();
    v.forEach((x, i) => {
      if (isObj(x) && typeof x._key === "string") {
        if (seen.has(x._key)) dupes.push(`${path}[${i}] ${x._key}`);
        seen.add(x._key);
      }
      walkKeys(x, `${path}[${i}]`);
    });
  } else if (isObj(v)) for (const [k, x] of Object.entries(v)) walkKeys(x, `${path}.${k}`);
};
docs.forEach((d) => walkKeys(d, d._id));
if (problems.length || dupes.length) {
  console.error("Invalid documents:", [...problems, ...dupes.map((d) => `duplicate _key ${d}`)].slice(0, 20));
  process.exit(1);
}

if (dryRun) {
  const counts = docs.reduce<Record<string, number>>((acc, d) => ((acc[d._type] = (acc[d._type] ?? 0) + 1), acc), {});
  const biggest = docs.map((d) => [d._id, JSON.stringify(d).length] as const).sort((a, b) => b[1] - a[1])[0];
  console.log("Dry run, nothing written:", counts, `${Math.round(JSON.stringify(docs).length / 1024)} KB of content; largest document ${biggest?.[0]} (${Math.round((biggest?.[1] ?? 0) / 1024)} KB)`);
  if (process.env.SEED_DUMP) {
    writeFileSync(process.env.SEED_DUMP, JSON.stringify(docs, null, 1));
    console.log(`Documents written to ${process.env.SEED_DUMP}`);
  }
  process.exit(0);
}

// Safety: never write into a dataset that holds another website's content.
const foreign = await client.fetch<number>(
  `count(*[_type in ["page","post","siteSettings","template","datasheet","whitepaper"] && !(_id in path("drafts.**")) && !(_id == "siteSettings" || string::startsWith(_id, "page-") || string::startsWith(_id, "post-") || string::startsWith(_id, "template-") || string::startsWith(_id, "datasheet-") || string::startsWith(_id, "whitepaper-"))])`,
);
const otherSettings = await client.fetch<string | null>(`*[_id == "siteSettings"][0].name`);
if (foreign > 0 || (otherSettings && otherSettings !== "TTR Technology")) {
  console.error(`Stopped: ${projectId}/${dataset} already holds content that is not this site's (${foreign} other documents${otherSettings ? `, site settings for "${otherSettings}"` : ""}). Use an empty dataset for TTR Technology.`);
  process.exit(1);
}

const existing = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: docs.map((d) => d._id) }));
if (!force && existing.size) console.log(`Keeping ${existing.size} documents that already exist (use overwrite to replace them).`);

// Transactions of at most ~1.5 MB keep each request under Sanity's size limit.
let batch: { _id: string }[] = [];
let size = 0;
let written = 0;
const flush = async () => {
  if (!batch.length) return;
  const tx = client.transaction();
  for (const d of batch) {
    if (force) tx.createOrReplace(d as never);
    else tx.createIfNotExists(d as never);
  }
  await tx.commit({ visibility: "async" });
  written += batch.length;
  process.stdout.write(`${written}/${docs.length} `);
  batch = [];
  size = 0;
};
for (const d of docs) {
  const s = JSON.stringify(d).length;
  if (size + s > 1_500_000) await flush();
  batch.push(d);
  size += s;
}
await flush();
console.log(`\nDone: ${force ? docs.length : docs.length - [...existing].length} documents written. Open /cms to see the content.`);
