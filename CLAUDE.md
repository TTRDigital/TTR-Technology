@AGENTS.md
# TTR Technology website

Static Next.js 16 export + Sanity (`/cms`) rebuild of https://ttrtechnology.com (WordPress/Elementor). See README.md.

- Pages are Elementor element trees (`lib/data/pages.json`, `templates.json`) rendered by `components/eb/Render.tsx` with the live markup and classes; design rules come from the live site (`app/styles/elementor.css`, `lib/data/css/<doc id>.css`). Keep markup changes faithful to the live widget markup.
- Content: Sanity wins, `lib/data` is the fallback (`lib/content.ts`). Element types are `w_<type>` in Sanity, `<type>` in the site.
- Before every push: `npm run lint`, `npm run typecheck`, `npm run build`.
- Local builds: this container's environment may set `NEXT_PUBLIC_SANITY_PROJECT_ID` to a project that holds another website's content. Build with `NEXT_PUBLIC_SANITY_PROJECT_ID=` (empty) unless it is the TTR Technology project.
- Old URLs and headers: `public/.htaccess` (copied into `out/` by the build).
