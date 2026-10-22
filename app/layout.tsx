import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site";

/*
 * Root layout is intentionally bare: the website's styles and chrome live in
 * app/(site)/layout.tsx so the embedded Sanity Studio at /cms loads without them.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "TTR Technology",
  formatDetection: { telephone: false, address: false, email: false },
  other: { "msapplication-TileImage": "/brand/favicon-270x270.png" },
  icons: {
    icon: [
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/favicon-180x180.png",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
