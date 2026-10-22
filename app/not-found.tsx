import "./globals.css";
import { getTemplates, getPosts, icons } from "@/lib/content";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { runtimeScript } from "@/lib/runtime-script";
import { GA_ID, GTM_ID } from "@/lib/data/site";

export const metadata = { title: { absolute: "Page not found | TTR Technology" }, robots: { index: false } };

/* Served with a real 404 status (.htaccess ErrorDocument), with the site's header and footer. */
export default async function NotFound() {
  const [templates, posts] = await Promise.all([getTemplates(), getPosts()]);
  return (
    <>
      <SiteFrame className="error404 wp-custom-logo wp-embed-responsive wp-theme-hello-elementor jkit-color-scheme hello-elementor-default elementor-default elementor-kit-7" templates={templates} ctx={{ posts, icons, templates: templates.templates }}>
        <main id="content" className="site-main">
          <div className="page-header">
            <h1 className="entry-title">The page can’t be found.</h1>
          </div>
          <div className="page-content">
            <p>It looks like nothing was found at this location.</p>
          </div>
        </main>
      </SiteFrame>
      <script id="ttr-runtime" dangerouslySetInnerHTML={{ __html: runtimeScript({ gtm: GTM_ID, ga: GA_ID }) }} />
    </>
  );
}
