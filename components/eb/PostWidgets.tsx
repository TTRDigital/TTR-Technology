import type { EbNode, Post, RenderCtx } from "@/lib/types";
import { Img } from "./Img";
import { Icon, type IconValue } from "./Icon";
import { Rich } from "./Rich";

/* Dynamic widgets of the post / datasheet / whitepaper templates: they show the current item. */

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : "";

export function PostTitle({ node, ctx }: { node: EbNode; ctx: RenderCtx }) {
  const H = ((node.tag as string) ?? "h1") as "h1";
  return <H className="elementor-heading-title elementor-size-default">{ctx.post?.title}</H>;
}

export function PostImage({ ctx }: { ctx: RenderCtx }) {
  const p = ctx.post as Post | undefined;
  if (!p?.image) return null;
  // the post's banner, at the top of the layout: loaded first
  return <Img img={{ ...p.image, dw: p.image.width, dh: p.image.height, sizes: `(max-width: ${p.image.width ?? 1920}px) 100vw, ${p.image.width ?? 1920}px` }} priority />;
}

type InfoItem = { _key: string; type: string; repeaterCls?: string; itemprop?: string; icon?: IconValue; linked?: boolean };

export function PostInfo({ node, ctx }: { node: EbNode; ctx: RenderCtx }) {
  const p = ctx.post as Post | undefined;
  if (!p) return null;
  return (
    <ul className="elementor-inline-items elementor-icon-list-items elementor-post-info">
      {((node.items as InfoItem[]) ?? []).map((it) => {
        const text = it.type === "author" ? p.author : it.type === "date" ? <time>{p.dateText || formatDate(p.date)}</time> : null;
        if (!text) return null;
        const inner = (
          <>
            <span className="elementor-icon-list-icon">
              <Icon value={it.icon} icons={ctx.icons} />
            </span>
            <span className={`elementor-icon-list-text elementor-post-info__item elementor-post-info__item--type-${it.type}`}>{text}</span>
          </>
        );
        return (
          <li key={it._key} className={`elementor-icon-list-item ${it.repeaterCls ?? ""} elementor-inline-item`} itemProp={it.itemprop}>
            {/* Author and date archives are not kept (they were noindex); the blog lists every post. */}
            {it.linked ? <a href="/blog/">{inner}</a> : inner}
          </li>
        );
      })}
    </ul>
  );
}

export function PostContent({ ctx }: { ctx: RenderCtx }) {
  return <Rich value={ctx.post?.body} variant="post" />;
}

/** Previous = the next older post, Next = the next newer one (as WordPress links them). */
export function PostNav({ ctx }: { ctx: RenderCtx }) {
  const p = ctx.post as Post | undefined;
  if (!p || ctx.postKind !== "post") return null;
  const sorted = [...ctx.posts].sort((a, b) => a.date.localeCompare(b.date));
  const i = sorted.findIndex((x) => x.slug === p.slug);
  const prev = i > 0 ? sorted[i - 1] : undefined;
  const next = i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : undefined;
  return (
    <div className="elementor-post-navigation">
      <div className="elementor-post-navigation__prev elementor-post-navigation__link">
        {prev ? (
          <a href={prev.path} rel="prev">
            <span className="post-navigation__arrow-wrapper post-navigation__arrow-prev">
              <i className="fa fa-long-arrow-left" aria-hidden="true"></i>
              <span className="elementor-screen-only">Prev</span>
            </span>
            <span className="elementor-post-navigation__link__prev">
              <span className="post-navigation__prev--label">Previous</span>
              <span className="post-navigation__prev--title">{prev.title}</span>
            </span>
          </a>
        ) : null}
      </div>
      <div className="elementor-post-navigation__separator-wrapper">
        <div className="elementor-post-navigation__separator"></div>
      </div>
      <div className="elementor-post-navigation__next elementor-post-navigation__link">
        {next ? (
          <a href={next.path} rel="next">
            <span className="elementor-post-navigation__link__next">
              <span className="post-navigation__next--label">Next</span>
              <span className="post-navigation__next--title">{next.title}</span>
            </span>
            <span className="post-navigation__arrow-wrapper post-navigation__arrow-next">
              <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
              <span className="elementor-screen-only">Next</span>
            </span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
