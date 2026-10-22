# TTR Technology website

Next.js 16 (App Router, static export) + Sanity Studio embedded at `/cms`, Tailwind CSS v4, hosted on **SiteGround** as plain files. Rebuild of https://ttrtechnology.com (WordPress + Elementor) by TTR Digital, on the same architecture as Diamond-Dental-Group and Beverly-Hills-Top-Dentist.

- **Design:** the live site's look, page for page. Every page was converted from the live Elementor markup into an element tree (sections > boxes > widgets) and is rendered with the same tags and classes, so the live site's own design rules apply unchanged: `app/styles/elementor.css` (shared rules, limited to the selectors the pages use) and `lib/data/css/<document id>.css` (each page's own rules, inlined by that page). Element sizes were compared with the live pages at 1440px and 390px.
- **Content:** the live site's text, word for word, with the same page titles and meta descriptions, images (alt text written for every one) and PDFs. Everything is editable in `/cms`. Until Sanity has content (or a field is left empty), the site shows the built-in copy from `lib/data`, so it never breaks.
- **Fonts:** the same Google fonts the live site used (Poppins, Montserrat, Work Sans, Nunito Sans, …), self-hosted as Latin subsets in `public/fonts`; the icon fonts are cut down to the dozen icons in use.

## Pages (trailing slash, same URLs as before)

| URL | What |
|---|---|
| `/`, `/about-us/`, `/our-partners/`, `/contact/`, `/privacy-policy/`, `/thank-you/` | pages |
| `/managed-it-services/`, `/it-helpdesk/`, `/cyber-security-24x7/`, … (20 service pages), `/cloud-backup-services/…` (5) | service pages |
| `/managed-it-services/<city>/`, `/schaumburg-il-2/` (17 locations), `/schaumburg-il/` | location pages |
| `/blog/`, `/blog/2/`, `/blog/3/` and `/<post-slug>/` (37 posts) | blog |
| `/resources/`, `/resources/datasheets/`, `/resources/whitepapers/` | resources |
| `/datasheet/<slug>/` (15), `/whitepaper/<slug>/` (38) with their PDFs at the old `/wp-content/uploads/…pdf` addresses | downloads |
| `/cms` | Sanity Studio |

One route (`app/(site)/[[...slug]]`) renders every URL from `lib/routes.ts`; anything else is the 404 page **with a 404 status**.

## Old URLs (`public/.htaccess`)

- **One address:** `www.`, the SiteGround temporary address and any other host go to `https://ttrtechnology.com` (301, path kept); http goes to https; pages without the trailing slash get it (301).
- **Redirects the live site had** (e.g. `/24-7-helpdesk/`, `/cloud-backup/`, `/it-consulting/`, the DDoS and XDR whitepapers) are kept, each in one hop.
- **WordPress:** `?p=` / `?page_id=` short links (all 149 IDs) 301 to their page; uploaded images (any WordPress size, e.g. `-300x191`) 301 to the same file under `/images/`; PDFs keep their exact old addresses; the old sitemaps 301 to `/sitemap.xml`; category, author, date and search pages (noindex before) 301 to `/blog/`; the indexed page-builder fragments (`/elementskit-content/…`) 301 to `/`; `wp-admin`, `wp-json`, `wp-login.php`, `xmlrpc.php`, feeds and plugin files answer **410 Gone**.
- To add a redirect, add a line in the "Old WordPress URLs" block (above the trailing-slash rule).

## Forms

| Form | Where it goes |
|---|---|
| Contact page | HoneyCRM, through the same script as before (works on the static site) |
| Blog post sidebar | Zoho CRM web-to-lead, unchanged |
| Datasheet / whitepaper download | **not sent anywhere yet** (it went to WordPress before). The fields and required checks are the same; after submitting, the PDF opens. To be connected once the destination is chosen. |
| Blog search | searches the post titles in the page |

## Setup

1. **Sanity project:** set the project ID as the repository variable `SANITY_PROJECT_ID` (Settings > Secrets and variables > Actions > Variables); dataset `production`. Use a project/dataset that holds only this site (the seed refuses to write into a dataset with another site's content).
2. **CORS:** sanity.io/manage > project > API > CORS origins: add `https://ttrtechnology.com`, `https://www.ttrtechnology.com` and `http://localhost:3000`, each with "Allow credentials". Without it, /cms shows "Add CORS origin".
3. **Local env:** copy `.env.example` to `.env.local`.
4. **Load the content into Sanity (once), all in the browser:**
   1. sanity.io/manage > project > API > Tokens > Add API token, permission **Editor**.
   2. GitHub: Settings > Secrets and variables > Actions > New repository secret, name `SANITY_WRITE_TOKEN`.
   3. Actions > "Load content into Sanity" > Run workflow, mode **add-missing**. It uploads about 300 images and writes 151 documents. **overwrite** replaces the CMS with the built-in content; **dry-run** checks without writing. The **only** box limits a run to documents whose ID starts with the given text, e.g. `page-home,post-,template-61`.
   4. Delete or rotate the token afterwards.

   On a computer instead: put the token in `.env.local`, then `npm install && npm run seed` (`-- --force` to overwrite, `-- --dry-run` to check).
5. **Run:** `npm run dev`, then http://localhost:3000 and http://localhost:3000/cms.

Document IDs: `siteSettings`, `page-<path>` (e.g. `page-home`, `page-managed-it-services--atlanta-ga`), `template-<id>` (header 3141, footer 61, mega menus 3719 / 3146, shared sections), `post-<slug>`, `datasheet-<slug>`, `whitepaper-<slug>`.

## Hosting on SiteGround

`npm run build` writes the whole site to `out/`: HTML pages, `_next/` scripts, `_img/` WebP images, the PDFs, fonts and `.htaccess` (canonical host, redirects, trailing slashes, security headers + CSP, caching, gzip incl. `text/javascript`, 404 page, /cms deep links). Upload the **contents** of `out/` into the site's `public_html`.

Automatic deploys (`.github/workflows/deploy-siteground.yml`) build and upload over FTPS on every push to this branch or `main`, when Sanity publishes, and from Actions > "Deploy to SiteGround" > Run workflow. Until the FTP secrets exist the workflow only builds (the site is kept as a run artifact for 14 days).

| Secret | Value |
|---|---|
| `SG_FTP_SERVER` | FTP host (Site Tools > Site > FTP Accounts > Manage > FTP credentials) |
| `SG_FTP_USERNAME` / `SG_FTP_PASSWORD` | an FTP account whose folder is the site's `public_html` |

Repository **variables** (not secrets): `SANITY_PROJECT_ID`, `SG_FTP_DIR` (default `./public_html/`), `GTM_ID` / `GA_ID` (default to the live site's `GTM-NP26ZWXW` and `GT-PLWZ36P4`).

**Publish → live:** sanity.io/manage > API > Webhooks: URL `https://api.github.com/repos/TTRDigital/TTR-Technologu/dispatches`, method POST, triggers create/update/delete, projection `{"event_type": "sanity-publish"}`, headers `Authorization: Bearer <GitHub fine-grained token with Contents: read and write on this repo>` and `Accept: application/vnd.github+json`.

**Go-live:** the domain's DNS is at SiteGround (ns1/ns2.siteground.net) and stays there. Upload into the site's `public_html` (replacing WordPress there, or a new SiteGround site), check it on the temporary address first (note: `.htaccess` sends every other host to the main domain, so check before or right after the switch), then point the domain at it. Keep the existing MX/TXT records. Turn on Site Tools > Security > SSL Manager (Let's Encrypt) and HTTPS Enforce.

## Editing in /cms

- **Site settings:** business name, phone, address, map link, logo, social profiles (used for search engines; the visible footer is a shared section).
- **Pages:** each page's sections in order. Open a section to edit headings, text, images (with alt text), buttons and links; the "Layout" fields keep the live design and are normally left alone.
- **Shared sections:** header (menu), footer, the two mega menus, the stats band and the "Why Our Managed IT Services…" band used on several pages, and the blog post / datasheet / whitepaper layouts.
- **Blog posts, Datasheets, Whitepapers:** title, slug, text, image, PDF, SEO.
- Text starting with `[PLACEHOLDER` is never shown on the site.

## Development

```bash
npm run dev        # local site
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # WebP copies + static export to out/
```

- `lib/data/*`: built-in content (fallbacks and seed source), converted from the live site: `pages.json`, `posts.json`, `resources.json`, `templates.json` (header, footer, menus, shared sections, post layouts), `icons.json`, `css/` (each page's design rules), `site.ts` (business details).
- `lib/content.ts`: GROQ queries and the merge over the built-in content. Sanity images are read straight from their asset reference.
- `components/eb/`: the element renderer (`Render.tsx`) and widgets; `lib/runtime-script.ts`: menus, carousels, counters, animations, accordions, embedded form scripts, download form.
- `SANITY_API_URL` (build time, normally unset) points the queries at another host, e.g. a local mock of the seeded dataset.
