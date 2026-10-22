import type { EbNode, Post, RenderCtx } from "@/lib/types";
import { Img } from "./Img";
import { formatDate } from "./PostWidgets";
import { richText } from "./Rich";

/*
 * Elementor "Posts" widget (classic and cards skins). Each widget shows the
 * posts chosen for it (the live widgets used category filters); the main blog
 * list is paginated: /blog/, /blog/2/, /blog/3/.
 */

type PageList = { _key: string; slugs: string[] };

/** WordPress-style excerpt: the first words of the post's excerpt, else of its text. */
export function excerpt(p: Post, words = 55) {
  // split like WordPress (wp_trim_words): on HTML whitespace, not on non-breaking spaces
  const all = (p.excerpt || richText(p.body)).split(/[ \t\n\r\f]+/).filter(Boolean);
  return all.slice(0, words).join(" ");
}

function Article({ p, node }: { p: Post; node: EbNode }) {
  const T = ((node.titleTag as string) ?? "h3") as "h3";
  const cards = node.skin === "cards";
  // the image size the widget used (e.g. WordPress "medium", 300px wide), else the full image
  const tw = typeof node.thumbWidth === "number" && p.image?.width ? Math.min(node.thumbWidth, p.image.width) : p.image?.width;
  const th = tw && p.image?.width && p.image.height ? Math.round((tw * p.image.height) / p.image.width) : p.image?.height;
  const thumb = node.showThumb && p.image ? (
    <a className="elementor-post__thumbnail__link" href={p.path} tabIndex={-1} target={node.thumbNewTab ? "_blank" : undefined}>
      <div className="elementor-post__thumbnail">
        <Img img={{ ...p.image, dw: tw, dh: th, sizes: `(max-width: ${tw ?? 1280}px) 100vw, ${tw ?? 1280}px` }} />
      </div>
    </a>
  ) : null;
  const readMore = node.readMore ? (
    <a className="elementor-post__read-more" href={p.path} aria-label={`Read more about ${p.title}`} tabIndex={-1}>
      {node.readMore as string}
    </a>
  ) : null;
  const text = (
    <div className="elementor-post__text">
      <T className="elementor-post__title">
        <a href={p.path}>{p.title}</a>
      </T>
      {node.showExcerpt ? (
        <div className="elementor-post__excerpt">
          <p>{excerpt(p, typeof node.excerptLength === "number" ? node.excerptLength : undefined)}</p>
        </div>
      ) : null}
      {readMore ? cards ? <div className="elementor-post__read-more-wrapper">{readMore}</div> : readMore : null}
    </div>
  );
  const meta = Array.isArray(node.meta) ? (node.meta as string[]) : [];
  const metaLine = meta.length ? (
    <div className="elementor-post__meta-data">
      {meta.includes("author") && p.author ? <span className="elementor-post-author">{p.author}</span> : null}
      {meta.includes("date") && p.date ? <span className="elementor-post-date">{p.dateText || formatDate(p.date)}</span> : null}
    </div>
  ) : null;
  const badge = cards && node.badge && p.categories?.[0] ? <div className="elementor-post__badge">{p.categories[0]}</div> : null;
  const cls = `elementor-post elementor-grid-item post-${p.id ?? ""} post type-post status-publish format-standard${p.image ? " has-post-thumbnail" : ""} hentry`;
  return (
    <article className={cls}>
      {cards ? (
        <div className="elementor-post__card">
          {thumb}
          {badge}
          {text}
          {metaLine}
        </div>
      ) : (
        <>
          {thumb}
          {text}
          {metaLine}
        </>
      )}
    </article>
  );
}

const pageHref = (n: number) => (n <= 1 ? "/blog/" : `/blog/${n}/`);

export function PostsWidget({ node, ctx }: { node: EbNode; ctx: RenderCtx }) {
  const bySlug = new Map(ctx.posts.map((p) => [p.slug, p]));
  const pages = node.pages as PageList[] | undefined;
  const cur = Math.max(1, ctx.pageNum ?? 1);
  const recent = typeof node.recent === "number" ? node.recent : 0;
  const slugs = pages ? (pages[cur - 1]?.slugs ?? []) : ((node.slugs as string[]) ?? []);
  const list = recent
    ? // newest posts except the one being read (the post layout's sidebar)
      [...ctx.posts].sort((a, b) => b.date.localeCompare(a.date)).filter((p) => p.slug !== ctx.post?.slug).slice(0, recent)
    : slugs.map((s) => bySlug.get(s)).filter((p): p is Post => !!p);
  const total = pages?.length ?? 1;
  return (
    <>
      <div className={`elementor-posts-container elementor-posts elementor-posts--skin-${node.skin === "cards" ? "cards" : "classic"} elementor-grid`}>
        {list.map((p) => (
          <Article key={p.slug} p={p} node={node} />
        ))}
      </div>
      {node.pagination && total > 1 ? (
        <nav className="elementor-pagination" aria-label="Pagination">
          {cur > 1 ? (
            <a className="page-numbers prev" href={pageHref(cur - 1)}>
              « Previous
            </a>
          ) : (
            <span className="page-numbers prev">« Previous</span>
          )}
          {Array.from({ length: total }, (_, i) => i + 1).map((n) =>
            n === cur ? (
              <span key={n} aria-current="page" className="page-numbers current">
                <span className="elementor-screen-only">Page</span>
                {n}
              </span>
            ) : (
              <a key={n} className="page-numbers" href={pageHref(n)}>
                <span className="elementor-screen-only">Page</span>
                {n}
              </a>
            ),
          )}
          {cur < total ? (
            <a className="page-numbers next" href={pageHref(cur + 1)}>
              Next »
            </a>
          ) : (
            <span className="page-numbers next">Next »</span>
          )}
        </nav>
      ) : null}
    </>
  );
}
