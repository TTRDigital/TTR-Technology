import { defineArrayMember, defineField, defineType } from "sanity";

/*
 * Building blocks of the page trees. Every element keeps the live page's
 * design (its classes and settings, under "Layout", read-only); text, images
 * and links are editable. Element types are named w_<type> because Sanity
 * reserves names such as "image".
 */

const layout = { name: "layout", title: "Layout (from the live design; normally left as is)", options: { collapsible: true, collapsed: true } };
const hidden = (name: string, title = name, type: "string" | "text" | "boolean" | "number" = "string") => defineField({ name, title, type, fieldset: "layout", readOnly: true });
const base = [hidden("cls", "Classes"), hidden("settings", "Settings (JSON)", "text")];

export const NODE_TYPES = [
  "w_container",
  "w_heading",
  "w_textEditor",
  "w_image",
  "w_button",
  "w_icon",
  "w_iconBox",
  "w_ekitIconBox",
  "w_iconList",
  "w_imageBox",
  "w_divider",
  "w_counter",
  "w_eaelFlipBox",
  "w_flipBox",
  "w_ekitTestimonial",
  "w_imageCarousel",
  "w_mediaCarousel",
  "w_nestedAccordion",
  "w_socialIcons",
  "w_rating",
  "w_html",
  "w_template",
  "w_siteLogo",
  "w_creativeButton",
  "w_spacer",
  "w_posts",
  "w_search",
  "w_fluentForm",
  "w_navMenu",
  "w_postTitle",
  "w_postImage",
  "w_postInfo",
  "w_postContent",
  "w_postNav",
];
export const nodeMembers = () => NODE_TYPES.map((type) => defineArrayMember({ type }));

const HTML_NOTE = "Simple HTML is allowed: <br>, <strong>, <em>, <a href=…>, <span style=\"color:…\">.";

const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "href", title: "URL", type: "string", description: "A page path like /contact/, or a full https:// address." }),
    defineField({ name: "blank", title: "Open in a new tab", type: "boolean" }),
    defineField({ name: "rel", title: "rel", type: "string", hidden: true }),
  ],
});

const altImage = defineType({
  name: "altImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({ name: "alt", title: "Alt text", type: "string", description: "Describe the image for people who cannot see it." }),
    defineField({ name: "dw", title: "Display width", type: "number", fieldset: "layout", readOnly: true }),
    defineField({ name: "dh", title: "Display height", type: "number", fieldset: "layout", readOnly: true }),
    defineField({ name: "sizes", title: "sizes", type: "string", fieldset: "layout", readOnly: true }),
    defineField({ name: "cls", title: "Classes", type: "string", fieldset: "layout", readOnly: true }),
    defineField({ name: "style", title: "Style", type: "string", fieldset: "layout", readOnly: true }),
  ],
  fieldsets: [layout],
});

/* ---------- rich text ---------- */

const richText = defineType({
  name: "richText",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Text without paragraph", value: "plain" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Heading 5", value: "h5" },
        { title: "Heading 6", value: "h6" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbers", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Underline", value: "underline" },
          { title: "Superscript", value: "sup" },
          { title: "Subscript", value: "sub" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          { name: "link", type: "link" },
          {
            name: "textStyle",
            title: "Color / style",
            type: "object",
            fields: [defineField({ name: "style", title: "CSS", type: "string", description: "For example: color: #21aae1" })],
          },
        ],
      },
    }),
    defineArrayMember({ type: "imageBlock" }),
    defineArrayMember({ type: "faqBlock" }),
    defineArrayMember({ type: "tableBlock" }),
    defineArrayMember({ type: "embedBlock" }),
    defineArrayMember({ type: "hrBlock" }),
    defineArrayMember({ type: "groupBlock" }),
  ],
});

const imageBlock = defineType({
  name: "imageBlock",
  title: "Image",
  type: "object",
  fields: [
    defineField({ name: "image", type: "altImage" }),
    defineField({ name: "caption", type: "string" }),
    defineField({ name: "href", title: "Link", type: "string" }),
    defineField({ name: "cls", title: "Classes", type: "string", readOnly: true, hidden: true }),
  ],
  preview: { select: { title: "caption", media: "image" }, prepare: ({ title, media }) => ({ title: title || "Image", media }) },
});

const faqBlock = defineType({
  name: "faqBlock",
  title: "FAQ",
  type: "object",
  fields: [
    defineField({
      name: "items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", type: "string" }),
            defineField({ name: "answer", type: "array", of: [defineArrayMember({ type: "block" })] }),
          ],
          preview: { select: { title: "question" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "FAQ" }) },
});

const tableBlock = defineType({
  name: "tableBlock",
  title: "Table",
  type: "object",
  fields: [
    defineField({
      name: "rows",
      type: "array",
      of: [defineArrayMember({ type: "object", name: "tableRow", fields: [defineField({ name: "cells", type: "array", of: [{ type: "string" }] }), defineField({ name: "head", title: "Header row", type: "boolean" })] })],
    }),
  ],
});

const embedBlock = defineType({ name: "embedBlock", title: "Embed (HTML)", type: "object", fields: [defineField({ name: "html", type: "text" })] });
const groupBlock = defineType({
  name: "groupBlock",
  title: "Group",
  type: "object",
  fields: [defineField({ name: "body", title: "Content", type: "richText" }), defineField({ name: "cls", title: "CSS classes", type: "string", hidden: true })],
  preview: { prepare: () => ({ title: "Group" }) },
});
const hrBlock = defineType({ name: "hrBlock", title: "Line", type: "object", fields: [defineField({ name: "note", type: "string", hidden: true })], preview: { prepare: () => ({ title: "Line" }) } });

/* ---------- elements ---------- */

function el(name: string, title: string, fields: ReturnType<typeof defineField>[], preview?: { select: Record<string, string>; prepare?: (v: Record<string, unknown>) => { title?: string; subtitle?: string } }) {
  return defineType({
    name,
    title,
    type: "object",
    fieldsets: [layout],
    fields: [...fields, ...base],
    preview: preview ?? { prepare: () => ({ title }) },
  });
}

const strip = (s: unknown) => (typeof s === "string" ? s.replace(/<[^>]+>/g, "").slice(0, 80) : undefined);

const container = el(
  "w_container",
  "Section / box",
  [
    defineField({ name: "children", title: "Contents", type: "array", of: nodeMembers() }),
    defineField({ name: "link", type: "link", description: "Only for boxes that are links." }),
    hidden("tag", "Tag"),
    hidden("bgVideo", "Background video"),
    defineField({ name: "bgSlides", title: "Background slideshow", type: "array", of: [defineArrayMember({ type: "altImage" })], fieldset: "layout" }),
    hidden("overlay", "Overlay", "boolean"),
    hidden("shapes", "Shape dividers", "text"),
  ],
  { select: { c: "children" }, prepare: ({ c }) => ({ title: "Section / box", subtitle: `${Array.isArray(c) ? c.length : 0} items` }) },
);

const sizeTags = ["h1", "h2", "h3", "h4", "h5", "h6", "div", "p", "span"];

const widgets = [
  el(
    "w_heading",
    "Heading",
    [
      defineField({ name: "text", type: "string", description: HTML_NOTE }),
      defineField({ name: "tag", title: "Level", type: "string", options: { list: sizeTags } }),
      defineField({ name: "link", type: "link" }),
      hidden("size", "Size class"),
    ],
    { select: { t: "text", tag: "tag" }, prepare: ({ t, tag }) => ({ title: strip(t) || "Heading", subtitle: `Heading ${tag ?? ""}` }) },
  ),
  el("w_textEditor", "Text", [defineField({ name: "body", type: "richText" })], { select: { b: "body" }, prepare: ({ b }) => ({ title: Array.isArray(b) ? (b[0] as { children?: { text: string }[] })?.children?.map((c) => c.text).join("").slice(0, 80) : "Text", subtitle: "Text" }) }),
  el("w_image", "Image", [defineField({ name: "image", type: "altImage" }), defineField({ name: "link", type: "link" }), defineField({ name: "caption", type: "string" })], { select: { media: "image", alt: "image.alt" }, prepare: ({ alt }) => ({ title: (alt as string) || "Image", subtitle: "Image" }) }),
  el("w_button", "Button", [defineField({ name: "text", type: "string" }), defineField({ name: "link", type: "link" }), hidden("size", "Size class"), hidden("icon", "Icon"), hidden("id", "Element id")], { select: { t: "text" }, prepare: ({ t }) => ({ title: (t as string) || "Button", subtitle: "Button" }) }),
  el("w_icon", "Icon", [defineField({ name: "link", type: "link" }), hidden("icon", "Icon")]),
  el(
    "w_iconBox",
    "Icon box",
    [
      defineField({ name: "title", type: "string", description: HTML_NOTE }),
      defineField({ name: "description", type: "text", rows: 3, description: HTML_NOTE }),
      defineField({ name: "link", type: "link" }),
      hidden("icon", "Icon"),
      hidden("titleTag", "Title tag"),
      hidden("descTag", "Description tag"),
      hidden("iconIsLink", "Icon is a link", "boolean"),
    ],
    { select: { t: "title" }, prepare: ({ t }) => ({ title: strip(t) || "Icon box", subtitle: "Icon box" }) },
  ),
  el(
    "w_ekitIconBox",
    "Info box",
    [
      defineField({ name: "title", type: "string", description: HTML_NOTE }),
      defineField({ name: "description", type: "text", rows: 3, description: HTML_NOTE }),
      defineField({ name: "link", type: "link" }),
      defineField({ name: "button", type: "object", fields: [defineField({ name: "text", type: "string" }), defineField({ name: "href", type: "string" }), defineField({ name: "blank", type: "boolean" })] }),
      hidden("boxCls", "Box classes"),
      hidden("icon", "Icon"),
      hidden("iconWrapCls", "Icon classes"),
      hidden("titleTag", "Title tag"),
    ],
    { select: { t: "title" }, prepare: ({ t }) => ({ title: strip(t) || "Info box", subtitle: "Info box" }) },
  ),
  el(
    "w_iconList",
    "List with icons",
    [
      defineField({
        name: "items",
        type: "array",
        of: [defineArrayMember({ type: "object", name: "iconListItem", fields: [defineField({ name: "text", type: "string", description: HTML_NOTE }), defineField({ name: "link", type: "link" }), defineField({ name: "icon", type: "string", readOnly: true, hidden: true }), defineField({ name: "dynamic", title: "Show instead", type: "string", options: { list: [{ title: "The page's title", value: "title" }] } })], preview: { select: { title: "text", dynamic: "dynamic" }, prepare: ({ title, dynamic }) => ({ title: dynamic === "title" ? "(page title)" : title }) } })],
      }),
      hidden("listCls", "List classes"),
    ],
    { select: { i: "items" }, prepare: ({ i }) => ({ title: Array.isArray(i) ? (i as { text?: string }[]).map((x) => strip(x.text)).join(" · ").slice(0, 80) : "List", subtitle: "List with icons" }) },
  ),
  el(
    "w_imageBox",
    "Image box",
    [defineField({ name: "image", type: "altImage" }), defineField({ name: "title", type: "string", description: HTML_NOTE }), defineField({ name: "description", type: "text", rows: 3, description: HTML_NOTE }), defineField({ name: "link", type: "link" }), hidden("titleTag", "Title tag")],
    { select: { t: "title", media: "image" }, prepare: ({ t }) => ({ title: strip(t) || "Image box", subtitle: "Image box" }) },
  ),
  el("w_divider", "Divider", [defineField({ name: "text", type: "string" }), hidden("textTag", "Text tag"), hidden("style", "Style"), hidden("inner", "Markup", "text")]),
  el(
    "w_counter",
    "Counter",
    [
      defineField({ name: "title", type: "string" }),
      defineField({ name: "end", title: "Number", type: "string" }),
      defineField({ name: "prefix", type: "string" }),
      defineField({ name: "suffix", type: "string" }),
      hidden("start", "Count from"),
      hidden("delimiter", "Thousands separator"),
      hidden("duration", "Duration (ms)"),
      hidden("titleFirst", "Title above number", "boolean"),
    ],
    { select: { t: "title", n: "end", s: "suffix" }, prepare: ({ t, n, s }) => ({ title: `${n ?? ""}${s ?? ""} ${t ?? ""}`, subtitle: "Counter" }) },
  ),
  el(
    "w_eaelFlipBox",
    "Flip box",
    [defineField({ name: "front", type: "flipSide" }), defineField({ name: "back", type: "flipSide" }), defineField({ name: "link", type: "link" }), hidden("boxCls", "Box classes")],
    { select: { t: "front.title" }, prepare: ({ t }) => ({ title: strip(t) || "Flip box", subtitle: "Flip box" }) },
  ),
  el(
    "w_flipBox",
    "Flip box (Elementor)",
    [defineField({ name: "front", type: "elFlipSide" }), defineField({ name: "back", type: "elFlipSide" }), defineField({ name: "link", type: "link" })],
    { select: { t: "front.title" }, prepare: ({ t }) => ({ title: strip(t) || "Flip box", subtitle: "Flip box" }) },
  ),
  el("w_ekitTestimonial", "Testimonials", [
    defineField({
      name: "items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "testimonial",
          fields: [
            defineField({ name: "quote", type: "text", rows: 4, description: "Text starting with [PLACEHOLDER is never shown." }),
            defineField({ name: "name", type: "string" }),
            defineField({ name: "designation", title: "Position / company", type: "string" }),
            defineField({ name: "image", type: "altImage" }),
            defineField({ name: "stars", type: "number" }),
            defineField({ name: "repeaterCls", type: "string", readOnly: true, hidden: true }),
          ],
          preview: { select: { title: "name", subtitle: "designation", media: "image" } },
        }),
      ],
    }),
    hidden("sliderCls", "Slider classes"),
    hidden("config", "Slider settings", "text"),
    hidden("quoteIcon", "Quote icon"),
    hidden("hasDots", "Dots", "boolean"),
  ]),
  el("w_imageCarousel", "Logo / image carousel", [
    defineField({ name: "slides", type: "array", of: [defineArrayMember({ type: "object", name: "slide", fields: [defineField({ name: "image", type: "altImage" }), defineField({ name: "link", type: "link" })], preview: { select: { media: "image", title: "image.alt" } } })] }),
    hidden("hasDots", "Dots", "boolean"),
    hidden("hasArrows", "Arrows", "boolean"),
  ]),
  el("w_mediaCarousel", "Media carousel", [
    defineField({ name: "slides", type: "array", of: [defineArrayMember({ type: "object", name: "mediaSlide", fields: [defineField({ name: "image", type: "altImage" }), defineField({ name: "link", type: "link" })] })] }),
  ]),
  el("w_nestedAccordion", "Accordion", [
    defineField({
      name: "items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "accordionItem",
          fields: [
            defineField({ name: "title", type: "string" }),
            defineField({ name: "open", title: "Open at first", type: "boolean" }),
            defineField({ name: "content", type: "array", of: nodeMembers() }),
            defineField({ name: "titleTag", type: "string", readOnly: true, hidden: true }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
    hidden("iconOpened", "Open icon"),
    hidden("iconClosed", "Closed icon"),
  ]),
  el("w_socialIcons", "Social icons", [
    defineField({
      name: "items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialItem",
          fields: [
            defineField({ name: "label", type: "string" }),
            defineField({ name: "link", type: "link" }),
            defineField({ name: "network", type: "string", readOnly: true }),
            defineField({ name: "icon", type: "string", readOnly: true, hidden: true }),
            defineField({ name: "repeaterCls", type: "string", readOnly: true, hidden: true }),
            defineField({ name: "anim", type: "string", readOnly: true, hidden: true }),
          ],
          preview: { select: { title: "label", subtitle: "link.href" } },
        }),
      ],
    }),
  ]),
  el("w_rating", "Star rating", [defineField({ name: "value", type: "string" }), defineField({ name: "scale", type: "string" }), hidden("icon", "Icon")]),
  el("w_html", "Custom HTML", [defineField({ name: "code", type: "text", rows: 12, description: "Embedded forms and their scripts (HoneyCRM, Zoho CRM)." })]),
  el("w_template", "Shared section", [defineField({ name: "templateId", title: "Shared section id", type: "string", description: "Edit it under Shared sections." })]),
  el("w_siteLogo", "Site logo", [defineField({ name: "image", type: "altImage" }), defineField({ name: "link", type: "link" })]),
  el("w_creativeButton", "Location button", [defineField({ name: "text", type: "string" }), defineField({ name: "link", type: "link" }), hidden("btnCls", "Button classes"), hidden("iconLeft", "Icon left"), hidden("iconRight", "Icon right"), hidden("dataText", "data-text")], {
    select: { t: "text" },
    prepare: ({ t }) => ({ title: (t as string) || "Button", subtitle: "Location button" }),
  }),
  el("w_spacer", "Spacer", []),
  el("w_posts", "Blog post list", [
    defineField({ name: "slugs", title: "Posts (slugs, in order)", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "pages", title: "Paginated lists (one per page: /blog/, /blog/2/, …)", type: "array", of: [defineArrayMember({ type: "object", name: "postPage", fields: [defineField({ name: "slugs", type: "array", of: [{ type: "string" }] })] })] }),
    defineField({ name: "recent", title: "Newest posts (number; used instead of a fixed list)", type: "number" }),
    defineField({ name: "readMore", title: "Read more text", type: "string" }),
    defineField({ name: "badge", title: "Show category badge", type: "boolean" }),
    defineField({ name: "meta", title: "Meta line", type: "array", of: [{ type: "string" }], options: { list: [{ title: "Author", value: "author" }, { title: "Date", value: "date" }] } }),
    defineField({ name: "thumbNewTab", title: "Image opens in a new tab", type: "boolean" }),
    defineField({ name: "showExcerpt", type: "boolean" }),
    defineField({ name: "excerptLength", title: "Excerpt length (words)", type: "number" }),
    defineField({ name: "thumbWidth", title: "Image width (px)", type: "number", hidden: true }),
    defineField({ name: "showThumb", title: "Show image", type: "boolean" }),
    defineField({ name: "pagination", type: "boolean" }),
    hidden("skin", "Skin"),
    hidden("titleTag", "Title tag"),
    hidden("meta", "Meta markup", "text"),
    hidden("badge", "Badge", "boolean"),
    hidden("avatar", "Avatar", "boolean"),
  ]),
  el("w_search", "Search box", [defineField({ name: "placeholder", type: "string" }), hidden("icon", "Icon")]),
  el("w_fluentForm", "Download form", [defineField({ name: "formHtml", title: "Form markup", type: "text", rows: 10 })]),
  el("w_navMenu", "Header menu", [
    defineField({ name: "items", type: "array", of: [defineArrayMember({ type: "menuItem" })] }),
    hidden("navCls", "Nav classes"),
    hidden("breakpoint", "Phone menu below (px)"),
    hidden("containerCls", "Container classes"),
    hidden("ulCls", "List classes"),
    hidden("identity", "Phone menu header", "text"),
    hidden("hamburger", "Menu icon"),
    hidden("close", "Close icon"),
  ]),
  el("w_postTitle", "Post title", [hidden("tag", "Tag")]),
  el("w_postImage", "Post image", []),
  el("w_postInfo", "Post author and date", [
    defineField({
      name: "items",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "postInfoItem",
          fields: [
            defineField({ name: "type", type: "string", readOnly: true }),
            defineField({ name: "repeaterCls", type: "string", readOnly: true }),
            defineField({ name: "itemprop", type: "string", readOnly: true }),
            defineField({ name: "icon", type: "string", readOnly: true }),
            defineField({ name: "linked", type: "boolean", readOnly: true }),
          ],
        }),
      ],
      readOnly: true,
    }),
  ]),
  el("w_postContent", "Post content", []),
  el("w_postNav", "Previous / next post", [defineField({ name: "prevLabel", type: "string" }), defineField({ name: "nextLabel", type: "string" })]),
];

const button = defineField({ name: "button", type: "object", fields: [defineField({ name: "text", type: "string" }), defineField({ name: "href", type: "string" }), defineField({ name: "blank", type: "boolean" }), defineField({ name: "cls", type: "string", readOnly: true, hidden: true })] });

const flipSide = defineType({
  name: "flipSide",
  title: "Side",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", description: HTML_NOTE }),
    defineField({ name: "body", type: "richText" }),
    defineField({ name: "image", type: "altImage" }),
    button,
    defineField({ name: "titleTag", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "icon", type: "string", readOnly: true, hidden: true }),
  ],
});

const elFlipSide = defineType({
  name: "elFlipSide",
  title: "Side",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", description: HTML_NOTE }),
    defineField({ name: "description", type: "text", rows: 3, description: HTML_NOTE }),
    defineField({ name: "image", type: "altImage" }),
    button,
    defineField({ name: "titleTag", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "icon", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "iconWrapCls", type: "string", readOnly: true, hidden: true }),
  ],
});

const menuItem = defineType({
  name: "menuItem",
  title: "Menu item",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string" }),
    defineField({ name: "href", title: "Link", type: "string", description: "Use # for an item that only opens its submenu." }),
    defineField({ name: "children", title: "Submenu", type: "array", of: [defineArrayMember({ type: "menuItem" })] }),
    defineField({ name: "panel", title: "Mega menu (shared section id)", type: "string" }),
    defineField({ name: "liCls", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "aCls", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "width", type: "string", readOnly: true, hidden: true }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Page title", type: "string" }),
    defineField({ name: "description", title: "Meta description", type: "text", rows: 3 }),
    defineField({ name: "robots", type: "string", description: "e.g. follow, index (default) or follow, noindex" }),
    defineField({ name: "ogImage", title: "Share image (path)", type: "string" }),
    defineField({ name: "ogType", type: "string", hidden: true }),
    defineField({ name: "published", type: "string", hidden: true }),
    defineField({ name: "modified", type: "string", hidden: true }),
  ],
});

const socialLink = defineType({ name: "socialLink", title: "Social link", type: "object", fields: [defineField({ name: "label", type: "string" }), defineField({ name: "href", type: "url", validation: (r) => r.uri({ scheme: ["http", "https"] }) })] });

export const objectTypes = [link, altImage, richText, imageBlock, faqBlock, tableBlock, embedBlock, hrBlock, groupBlock, container, ...widgets, flipSide, elFlipSide, menuItem, seo, socialLink];
