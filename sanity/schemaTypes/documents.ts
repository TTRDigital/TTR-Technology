import { defineField, defineType } from "sanity";
import { nodeMembers } from "./objects";

/*
 * Documents. Page content is the element tree converted from the live site
 * (sections > boxes > widgets). Document IDs: siteSettings, page-<path>,
 * template-<id>, post-<slug>, datasheet-<slug>, whitepaper-<slug>.
 */

const sections = defineField({ name: "sections", title: "Page content", type: "array", of: nodeMembers(), description: "Sections in page order. Open a section to edit its text, images and links." });

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string" }),
    defineField({ name: "legalName", title: "Legal name", type: "string" }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "street", type: "string" }),
    defineField({ name: "city", type: "string" }),
    defineField({ name: "region", title: "State", type: "string" }),
    defineField({ name: "postalCode", title: "ZIP code", type: "string" }),
    defineField({ name: "country", type: "string" }),
    defineField({ name: "mapsUrl", title: "Google Maps link", type: "url" }),
    defineField({ name: "logo", type: "altImage" }),
    defineField({ name: "social", title: "Social profiles", type: "array", of: [{ type: "socialLink" }] }),
  ],
  description: "Business details for search engines (the footer itself is edited under Shared sections > Footer).",
  preview: { prepare: () => ({ title: "Site settings" }) },
});

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Name", type: "string", description: "Shown in this list only." }),
    defineField({ name: "path", title: "URL path", type: "string", readOnly: true, description: "The page's address, kept from the old site." }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
    sections,
  ],
  preview: { select: { title: "title", subtitle: "path" } },
});

export const template = defineType({
  name: "template",
  title: "Shared section",
  type: "document",
  fields: [defineField({ name: "name", type: "string" }), defineField({ name: "templateId", title: "Id", type: "string", readOnly: true }), sections],
  preview: { select: { title: "name", subtitle: "templateId" } },
});

const slug = defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() });
const seo = defineField({ name: "seo", title: "SEO", type: "seo" });
const body = defineField({ name: "body", title: "Content", type: "richText" });

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    slug,
    defineField({ name: "date", title: "Published", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "modified", title: "Updated", type: "datetime" }),
    defineField({ name: "author", type: "string" }),
    defineField({ name: "categories", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "image", title: "Featured image", type: "altImage" }),
    defineField({ name: "excerpt", type: "text", rows: 3, description: "Shown in blog lists. Empty = the first words of the post." }),
    body,
    seo,
    defineField({ name: "dateText", type: "string", hidden: true }),
  ],
  orderings: [{ title: "Newest", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "date", media: "image" } },
});

const resource = (name: "datasheet" | "whitepaper", title: string) =>
  defineType({
    name,
    title,
    type: "document",
    fields: [
      defineField({ name: "title", type: "string", validation: (r) => r.required() }),
      slug,
      defineField({ name: "pdf", title: "PDF path", type: "string", description: "e.g. /wp-content/uploads/2025/05/file.pdf (the files keep their old addresses)." }),
      body,
      seo,
    ],
    preview: { select: { title: "title", subtitle: "slug.current" } },
  });

export const datasheet = resource("datasheet", "Datasheet");
export const whitepaper = resource("whitepaper", "Whitepaper");

export const documentTypes = [siteSettings, page, template, post, datasheet, whitepaper];
