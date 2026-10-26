import "../globals.css";
import { getSettings } from "@/lib/content";
import { businessSchema } from "@/lib/schema";
import { runtimeScript } from "@/lib/runtime-script";
import { JsonLd } from "@/components/eb/JsonLd";
import { GA_ID, GHL_WEBHOOK_URL, GTM_ID } from "@/lib/data/site";

/** Site-wide: styles, the one Organization entity and the small runtime (which also loads the Google tags). */
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const s = await getSettings();
  return (
    <>
      <JsonLd data={businessSchema(s)} />
      {children}
      {GTM_ID ? (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" />
        </noscript>
      ) : null}
      <script id="ttr-runtime" dangerouslySetInnerHTML={{ __html: runtimeScript({ gtm: GTM_ID, ga: GA_ID, ghl: GHL_WEBHOOK_URL }) }} />
    </>
  );
}
