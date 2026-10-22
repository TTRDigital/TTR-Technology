"use client";

/**
 * Sanity Studio, embedded at /cms: site settings, pages, shared sections
 * (header, footer, menus), blog posts, datasheets and whitepapers.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schemaTypes, singletonTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

export default defineConfig({
  name: "ttr-technology",
  title: "TTR Technology",
  basePath: "/cms",
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: {
    types: schemaTypes,
    // Singletons do not appear in the "Create new" menu.
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    // Singletons can be edited and published, but not duplicated or deleted.
    actions: (input, context) =>
      singletonTypes.has(context.schemaType) ? input.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action)) : input,
  },
});
