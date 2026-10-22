import { notFound } from "next/navigation";
import { preload } from "react-dom";
import type { Metadata } from "next";
import { getPosts, getTemplates, icons } from "@/lib/content";
import { bodyClsOf, getRoute, getRoutes, routeName, seoOf, type Route } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";
import { heroBackgrounds, heroKeys, heroSections } from "@/lib/hero";
import { pageSchemas } from "@/lib/page-schema";
import type { EbDoc, RenderCtx } from "@/lib/types";
import { Document } from "@/components/eb/Render";
import { JsonLd } from "@/components/eb/JsonLd";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { Rich } from "@/components/eb/Rich";

const POST_FONTS = ["/fonts/poppins-400-normal.woff2", "/fonts/poppins-500-normal.woff2", "/fonts/montserrat-600-normal.woff2"];

// Static export: every live URL is generated at build time; anything else is the 404 page.
export const dynamicParams = false;

type Params = { slug?: string[] };

const toPath = (slug?: string[]) => (slug?.length ? `/${slug.join("/")}/` : "/");

export async function generateStaticParams(): Promise<Params[]> {
  return (await getRoutes()).map((r) => ({ slug: r.path.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const route = await getRoute(toPath((await params).slug));
  if (!route) return {};
  return pageMetadata(seoOf(route), route.path);
}

/** The Elementor document that makes up the page body, and the template-specific ids. */
function bodyDoc(route: Route, templates: Record<string, EbDoc>): EbDoc | undefined {
  if (route.kind === "page") return route.page.doc;
  if (route.kind === "post") return templates[route.post.template];
  if ("item" in route) return templates[route.item.template];
  return undefined;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const route = await getRoute(toPath((await params).slug));
  if (!route) notFound();
  const [templates, posts] = await Promise.all([getTemplates(), getPosts()]);
  const doc = bodyDoc(route, templates.templates);

  // First screen: eager images, preloaded backgrounds.
  const hero = doc ? heroSections(doc) : [];
  for (const bg of doc ? heroBackgrounds(doc, hero) : []) preload(bg.href, { as: "image", fetchPriority: "high", ...(bg.media ? { media: bg.media } : {}) });
  // Blog posts: the fonts of the text in the first screen load first, so the long text
  // doesn't reflow when they arrive (other pages paint sooner without these preloads).
  if (route.kind === "post") for (const href of POST_FONTS) preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  const ctx: RenderCtx = {
    posts,
    icons,
    templates: templates.templates,
    hero: heroKeys(hero),
    pageNum: route.kind === "page" ? route.pageNum : undefined,
    post: route.kind === "post" ? route.post : "item" in route ? route.item : undefined,
    postKind: route.kind === "post" ? "post" : "item" in route ? route.kind : undefined,
  };

  const bodyCls = bodyClsOf(route);
  const canvas = /elementor-template-canvas/.test(bodyCls);
  const pageCls = doc ? `${bodyCls} elementor-page-${doc.id}${route.kind === "page" ? " elementor-page" : ""}` : bodyCls;
  const schemas = pageSchemas(route, routeName);

  let main;
  if (route.kind === "page" && doc) {
    main = (
      <main id="content" className={`site-main post-${route.page.id ?? ""} page type-page status-publish hentry`}>
        <div className="page-content">
          <Document doc={doc} ctx={ctx} />
        </div>
      </main>
    );
  } else if (doc) {
    main = (
      <main id="content">
        <Document doc={doc} ctx={ctx} />
      </main>
    );
  } else if (route.kind === "theme") {
    main = (
      <main id="content" className={`site-main post-${route.page.id ?? ""} page type-page status-publish hentry`}>
        <div className="page-header">
          <h1 className="entry-title">{route.page.title}</h1>
        </div>
        <div className="page-content">
          <Rich value={route.page.body} />
        </div>
      </main>
    );
  }

  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      {canvas ? (
        <div className={`site-wrap ${pageCls}`}>{main}</div>
      ) : (
        <SiteFrame className={pageCls} templates={templates} ctx={ctx}>
          {main}
        </SiteFrame>
      )}
    </>
  );
}
