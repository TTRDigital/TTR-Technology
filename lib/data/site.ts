import type { SiteSettings } from "@/lib/types";

/**
 * Business details, from the live site only (footer, contact block, logo).
 * Used for the site-wide Organization / LocalBusiness schema; editable in /cms
 * (Site settings).
 */
export const fallbackSettings: SiteSettings = {
  name: "TTR Technology",
  legalName: "TTR Technology",
  description:
    "At TTR Technology, we are committed to delivering resilient, secure, and straightforward solutions that empower you to thrive in today’s digital landscape.",
  phone: "(866)-217-7225",
  street: "700 12th St",
  city: "Washington",
  region: "DC",
  postalCode: "20005",
  country: "US",
  mapsUrl: "https://maps.app.goo.gl/ZSEjEFsCGvKquq1a8",
  logo: { src: "/images/2025/05/TTR-Technology-logo.png", alt: "TTR Technology logo", width: 768, height: 66 },
  social: [
    { label: "Facebook", href: "https://www.facebook.com/ttrtechnologyinc" },
    { label: "Instagram", href: "https://www.instagram.com/ttrtechnology" },
    { label: "LinkedIn", href: "http://www.linkedin.com/company/ttrtechnology/" },
    { label: "X", href: "http://www.twitter.com/TTRTechnology01" },
    { label: "YouTube", href: "https://www.youtube.com/@TTRTECHNOLOGY" },
  ],
};

/** Google Tag Manager container and Google tag (Site Kit) the live site uses. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-NP26ZWXW";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "GT-PLWZ36P4";
