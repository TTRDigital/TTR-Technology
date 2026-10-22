import type { StructureResolver } from "sanity/structure";

/** Sidebar: Site settings, Pages, Shared sections (header, footer, menus), Blog posts, Datasheets, Whitepapers. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("TTR Technology")
    .items([
      S.listItem().title("Site settings").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
      S.divider(),
      S.listItem().title("Pages").child(S.documentTypeList("page").title("Pages").defaultOrdering([{ field: "path", direction: "asc" }])),
      S.listItem().title("Shared sections").child(S.documentTypeList("template").title("Shared sections (header, footer, menus, …)")),
      S.divider(),
      S.listItem().title("Blog posts").child(S.documentTypeList("post").title("Blog posts").defaultOrdering([{ field: "date", direction: "desc" }])),
      S.listItem().title("Datasheets").child(S.documentTypeList("datasheet").title("Datasheets")),
      S.listItem().title("Whitepapers").child(S.documentTypeList("whitepaper").title("Whitepapers")),
    ]);
