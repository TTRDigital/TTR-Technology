import type { ReactNode } from "react";
import type { EbDoc, EbNode, Img as ImgT, Link, RenderCtx, Rich as RichT } from "@/lib/types";
import { cssToStyle, isPlaceholder, safeInline } from "@/lib/text";
import { Img, imgUrl } from "./Img";
import { Icon, type IconValue } from "./Icon";
import { Rich } from "./Rich";
import { NavMenu } from "./NavMenu";
import { PostsWidget } from "./Posts";
import { PostContent, PostImage, PostInfo, PostNav, PostTitle } from "./PostWidgets";
import { FluentForm } from "./FluentForm";
import { SearchWidget } from "./Search";
import { cleanHtml } from "./HtmlWidget";
import { docCss } from "@/lib/doc-css";

/*
 * Renders an Elementor-style element tree with the same markup (tags, classes,
 * data attributes) the live page had, so the live design rules in
 * app/styles/elementor.css and lib/data/css apply unchanged.
 */

type Props = { node: EbNode; ctx: RenderCtx; depth: number };

const s = (v: unknown) => (typeof v === "string" ? v : undefined);
const html = (v: unknown) => ({ __html: safeInline(s(v)) });

export function aProps(l?: Link | null) {
  if (!l?.href) return {};
  return { href: l.href, ...(l.blank ? { target: "_blank" } : {}), ...(l.rel ? { rel: l.rel } : l.blank ? { rel: "noopener" } : {}) };
}

/** Wraps a widget's inner markup in the Elementor widget element. */
function Widget({ node, type, children, container }: { node: EbNode; type: string; children: ReactNode; container?: boolean }) {
  return (
    <div
      className={`elementor-element elementor-element-${node._key} ${node.cls ?? ""} elementor-widget`}
      data-id={node._key}
      data-element_type="widget"
      data-settings={node.settings}
      data-widget_type={type}
    >
      {container ? <div className="elementor-widget-container">{children}</div> : children}
    </div>
  );
}

function Container({ node, ctx, depth }: Props) {
  const cls = node.cls ?? "";
  const boxed = /\be-con-boxed\b/.test(cls);
  const Tag = (s(node.tag) ?? "div") as "div";
  const link = node.link as Link | undefined;
  let playOnMobile = false;
  try {
    playOnMobile = !!node.settings && JSON.parse(node.settings).background_play_on_mobile === "yes";
  } catch {}
  const kids = (node.children ?? []).map((c) => <Node key={c._key} node={c} ctx={ctx} depth={depth + 1} />);
  return (
    <Tag
      className={`elementor-element elementor-element-${node._key} ${cls} e-con ${depth === 0 ? "e-parent" : "e-child"}${depth === 0 && ctx.hero?.has(node._key) ? " e-no-lazyload" : ""}`}
      data-id={node._key}
      data-element_type="container"
      data-settings={node.settings}
      {...(Tag === ("a" as string) ? aProps(link) : {})}
    >
      {node.bgVideo ? (
        <div className={`elementor-background-video-container${playOnMobile ? "" : " elementor-hidden-mobile"}`}>
          <video className="elementor-background-video-hosted" data-src={s(node.bgVideo)} autoPlay muted playsInline loop preload="none" role="presentation" />
        </div>
      ) : null}
      {Array.isArray(node.bgSlides) && node.bgSlides.length ? (
        <div className="elementor-background-slideshow swiper">
          <div className="swiper-wrapper">
            {(node.bgSlides as ImgT[]).map((im) => (
              <div className="elementor-background-slideshow__slide swiper-slide" key={im.src}>
                <div className="elementor-background-slideshow__slide__image" style={{ backgroundImage: `url("${imgUrl(im.src, 1920)}")` }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {node.overlay ? <div className="elementor-background-overlay" /> : null}
      {node.shapes ? <div dangerouslySetInnerHTML={{ __html: s(node.shapes) ?? "" }} style={{ display: "contents" }} /> : null}
      {boxed ? <div className="e-con-inner">{kids}</div> : kids}
    </Tag>
  );
}

/* ---------- widgets ---------- */

function Heading({ node }: Props) {
  const H = (s(node.tag) ?? "h2") as "h2";
  const link = node.link as Link | undefined;
  if (isPlaceholder(node.text)) return null;
  return (
    <Widget node={node} type="heading.default">
      {link?.href ? (
        <H className={`elementor-heading-title ${s(node.size) ?? "elementor-size-default"}`}>
          <a {...aProps(link)} dangerouslySetInnerHTML={html(node.text)} />
        </H>
      ) : (
        <H className={`elementor-heading-title ${s(node.size) ?? "elementor-size-default"}`} dangerouslySetInnerHTML={html(node.text)} />
      )}
    </Widget>
  );
}

function TextEditor({ node }: Props) {
  return (
    <Widget node={node} type="text-editor.default">
      <Rich value={node.body as RichT} />
    </Widget>
  );
}

function ImageW({ node, ctx }: Props) {
  const img = node.image as ImgT | undefined;
  const link = node.link as Link | undefined;
  const pic = <Img img={img} priority={!!img && ctx.hero?.has(node._key)} />;
  const body = link?.href ? <a {...aProps(link)}>{pic}</a> : pic;
  return (
    <Widget node={node} type="image.default">
      {node.caption ? (
        <figure className="wp-caption">
          {body}
          <figcaption className="widget-image-caption wp-caption-text">{s(node.caption)}</figcaption>
        </figure>
      ) : (
        body
      )}
    </Widget>
  );
}

function Button({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const inner = (
    <span className="elementor-button-content-wrapper">
      {node.icon ? (
        <span className="elementor-button-icon">
          <Icon value={node.icon as IconValue} icons={ctx.icons} />
        </span>
      ) : null}
      <span className="elementor-button-text">{s(node.text)}</span>
    </span>
  );
  const cls = `elementor-button${link?.href ? " elementor-button-link" : ""} ${s(node.size) ?? "elementor-size-sm"}`;
  return (
    <Widget node={node} type="button.default">
      {link?.href ? (
        <a className={cls} {...aProps(link)} id={s(node.id)}>
          {inner}
        </a>
      ) : (
        <a className={cls} role="button" id={s(node.id)}>
          {inner}
        </a>
      )}
    </Widget>
  );
}

function IconW({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const icon = <Icon value={node.icon as IconValue} icons={ctx.icons} />;
  return (
    <Widget node={node} type="icon.default">
      <div className="elementor-icon-wrapper">
        {link?.href ? (
          <a className="elementor-icon" {...aProps(link)}>
            {icon}
          </a>
        ) : (
          <div className="elementor-icon">{icon}</div>
        )}
      </div>
    </Widget>
  );
}

function IconBox({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const T = (s(node.titleTag) ?? "h3") as "h3";
  const D = (s(node.descTag) ?? "p") as "p";
  const icon = <Icon value={node.icon as IconValue} icons={ctx.icons} />;
  return (
    <Widget node={node} type="icon-box.default">
      <div className="elementor-icon-box-wrapper">
        {node.icon ? (
          <div className="elementor-icon-box-icon">
            {link?.href && node.iconIsLink ? (
              <a className="elementor-icon" {...aProps(link)} tabIndex={-1}>
                {icon}
              </a>
            ) : (
              <span className="elementor-icon">{icon}</span>
            )}
          </div>
        ) : null}
        <div className="elementor-icon-box-content">
          {node.title ? (
            <T className="elementor-icon-box-title">
              {link?.href ? <a {...aProps(link)} dangerouslySetInnerHTML={html(node.title)} /> : <span dangerouslySetInnerHTML={html(node.title)} />}
            </T>
          ) : null}
          {node.description ? <D className="elementor-icon-box-description" dangerouslySetInnerHTML={html(node.description)} /> : null}
        </div>
      </div>
    </Widget>
  );
}

function EkitIconBox({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const T = (s(node.titleTag) ?? "h3") as "h3";
  const btn = node.button as (Link & { text: string }) | undefined;
  const box = (
    <div className={s(node.boxCls) ?? "elementskit-infobox"}>
      {node.icon ? (
        <div className="elementskit-box-header elementor-animation-">
          <div className={s(node.iconWrapCls) ?? "elementskit-info-box-icon"}>
            <Icon value={node.icon as IconValue} icons={ctx.icons} />
          </div>
        </div>
      ) : null}
      <div className="box-body">
        {node.title ? <T className="elementskit-info-box-title" dangerouslySetInnerHTML={html(node.title)} /> : null}
        {node.description ? <p dangerouslySetInnerHTML={html(node.description)} /> : null}
        {btn?.text ? (
          <div className="box-footer">
            <div className="btn-wrapper">
              <a className="elementskit-btn whitespace--normal" {...aProps(btn)}>
                {btn.text}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
  return (
    <Widget node={node} type="elementskit-icon-box.default">
      <div className="ekit-wid-con">
        {link?.href ? (
          <a className="ekit_global_links" {...aProps(link)}>
            {box}
          </a>
        ) : (
          box
        )}
      </div>
    </Widget>
  );
}

type ListItem = { _key: string; text: string; link?: Link; icon?: IconValue; dynamic?: "title" };

function IconList({ node, ctx }: Props) {
  const inline = /layout-inline/.test(node.cls ?? "");
  return (
    <Widget node={node} type="icon-list.default">
      <ul className={s(node.listCls) ?? "elementor-icon-list-items"}>
        {((node.items as ListItem[]) ?? []).map((it) => {
          const inner = (
            <>
              {it.icon ? (
                <span className="elementor-icon-list-icon">
                  <Icon value={it.icon} icons={ctx.icons} />
                </span>
              ) : null}
              {it.dynamic === "title" ? (
                <span className="elementor-icon-list-text">{ctx.post?.title}</span>
              ) : (
                <span className="elementor-icon-list-text" dangerouslySetInnerHTML={html(it.text)} />
              )}
            </>
          );
          return (
            <li key={it._key} className={`elementor-icon-list-item${inline ? " elementor-inline-item" : ""}`}>
              {it.link?.href ? <a {...aProps(it.link)}>{inner}</a> : inner}
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}

function ImageBox({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const T = (s(node.titleTag) ?? "h3") as "h3";
  const img = <Img img={node.image as ImgT} priority={ctx.hero?.has(node._key)} />;
  return (
    <Widget node={node} type="image-box.default">
      <div className="elementor-image-box-wrapper">
        {node.image ? (
          <figure className="elementor-image-box-img">
            {link?.href ? (
              <a {...aProps(link)} tabIndex={-1}>
                {img}
              </a>
            ) : (
              img
            )}
          </figure>
        ) : null}
        <div className="elementor-image-box-content">
          {node.title ? (
            link?.href ? (
              <T className="elementor-image-box-title">
                <a {...aProps(link)} dangerouslySetInnerHTML={html(node.title)} />
              </T>
            ) : (
              <T className="elementor-image-box-title" dangerouslySetInnerHTML={html(node.title)} />
            )
          ) : null}
          {node.description ? <p className="elementor-image-box-description" dangerouslySetInnerHTML={html(node.description)} /> : null}
        </div>
      </div>
    </Widget>
  );
}

function Divider({ node }: Props) {
  return (
    <Widget node={node} type="divider.default">
      <div className="elementor-divider" style={node.style ? cssToStyle(s(node.style)!) : undefined}>
        {node.inner ? <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: s(node.inner)! }} /> : <span className="elementor-divider-separator"></span>}
      </div>
    </Widget>
  );
}

function Counter({ node }: Props) {
  const title = node.title ? <div className="elementor-counter-title">{s(node.title)}</div> : null;
  const end = s(node.end) ?? "0";
  const delim = s(node.delimiter);
  const shown = delim ? Number(end).toLocaleString("en-US").replace(/,/g, delim) : end;
  return (
    <Widget node={node} type="counter.default">
      <div className="elementor-counter">
        {node.titleFirst ? title : null}
        <div className="elementor-counter-number-wrapper">
          <span className="elementor-counter-number-prefix">{s(node.prefix)}</span>
          <span className="elementor-counter-number" data-duration={s(node.duration)} data-to-value={end} data-from-value={s(node.start)} data-delimiter={delim}>
            {shown}
          </span>
          <span className="elementor-counter-number-suffix">{s(node.suffix)}</span>
        </div>
        {node.titleFirst ? null : title}
      </div>
    </Widget>
  );
}

type FlipSide = { image?: ImgT; icon?: IconValue; title?: string; titleTag?: string; body?: RichT; button?: Link & { text: string } };

function EaelSide({ side, cls, ctx }: { side?: FlipSide; cls: string; ctx: RenderCtx }) {
  const T = (side?.titleTag ?? "h3") as "h3";
  return (
    <div className={cls}>
      <div className="eael-elements-slider-display-table">
        <div className="eael-elements-flip-box-vertical-align">
          <div className="eael-elements-flip-box-padding">
            <div className="eael-elements-flip-box-icon-image">{side?.image ? <Img img={side.image} className="eael-flipbox-image-as-icon" /> : side?.icon ? <Icon value={side.icon} icons={ctx.icons} /> : null}</div>
            {side?.title ? <T className="eael-elements-flip-box-heading" dangerouslySetInnerHTML={html(side.title)} /> : null}
            <div className="eael-elements-flip-box-content">
              <Rich value={side?.body} />
            </div>
            {side?.button?.text ? (
              <a className="flipbox-button" {...aProps(side.button)}>
                {side.button.text}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EaelFlipBox({ node, ctx }: Props) {
  const link = node.link as Link | undefined;
  const inner = (
    <div className="eael-elements-flip-box-flip-card">
      <EaelSide side={node.front as FlipSide} cls="eael-elements-flip-box-front-container" ctx={ctx} />
      <EaelSide side={node.back as FlipSide} cls="eael-elements-flip-box-rear-container" ctx={ctx} />
    </div>
  );
  const cls = s(node.boxCls) ?? "eael-elements-flip-box-container";
  return (
    <Widget node={node} type="eael-flip-box.default">
      {link?.href ? (
        <a className={cls} {...aProps(link)}>
          {inner}
        </a>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </Widget>
  );
}

type ElFlipSide = { icon?: IconValue; iconWrapCls?: string; image?: ImgT; title?: string; titleTag?: string; description?: string; button?: Link & { text: string; cls?: string } };

function ElFlipLayer({ side, front, ctx }: { side?: ElFlipSide; front: boolean; ctx: RenderCtx }) {
  const T = (side?.titleTag ?? "h3") as "h3";
  return (
    <div className={`elementor-flip-box__layer elementor-flip-box__${front ? "front" : "back"}`}>
      <div className="elementor-flip-box__layer__overlay">
        <div className="elementor-flip-box__layer__inner">
          {side?.icon ? (
            <div className={side.iconWrapCls ?? "elementor-icon-wrapper elementor-view-default"}>
              <div className="elementor-icon">
                <Icon value={side.icon} icons={ctx.icons} />
              </div>
            </div>
          ) : null}
          {side?.image ? (
            <div className="elementor-flip-box__image">
              <Img img={side.image} />
            </div>
          ) : null}
          {side?.title ? <T className="elementor-flip-box__layer__title" dangerouslySetInnerHTML={html(side.title)} /> : null}
          {side?.description ? <div className="elementor-flip-box__layer__description" dangerouslySetInnerHTML={html(side.description)} /> : null}
          {side?.button?.text ? (
            <a className={side.button.cls ?? "elementor-flip-box__button elementor-button elementor-size-sm"} {...aProps(side.button)}>
              {side.button.text}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FlipBox({ node, ctx }: Props) {
  return (
    <Widget node={node} type="flip-box.default">
      <div className="elementor-flip-box" tabIndex={0}>
        <ElFlipLayer side={node.front as ElFlipSide} front ctx={ctx} />
        <ElFlipLayer side={node.back as ElFlipSide} front={false} ctx={ctx} />
      </div>
    </Widget>
  );
}

type Testimonial = { _key: string; repeaterCls?: string; image?: ImgT; name: string; designation: string; quote: string; stars: number };
const STAR =
  "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z";

function EkitTestimonial({ node, ctx }: Props) {
  const items = ((node.items as Testimonial[]) ?? []).filter((t) => !isPlaceholder(t.quote));
  return (
    <Widget node={node} type="elementskit-testimonial.default">
      <div className="ekit-wid-con">
        <div className={s(node.sliderCls) ?? "elementskit-testimonial-slider"} data-config={s(node.config)}>
          <div className="ekit-main-swiper swiper">
            <div className="swiper-wrapper">
              {items.map((t) => (
                <div className="swiper-slide" key={t._key}>
                  <div className="swiper-slide-inner">
                    <div className={`elementskit-single-testimonial-slider elementskit-testimonial-slider-block-style ${t.repeaterCls ?? ""}`}>
                      <div className="elementskit-commentor-bio">
                        <div className="elementskit-commentor-image ekit-testimonial--avatar">
                          <Img img={t.image} />
                        </div>
                        <span className="elementskit-profile-info">
                          <strong className="elementskit-author-name">{t.name}</strong>
                          <span className="elementskit-author-des">{t.designation}</span>
                        </span>
                      </div>
                      <div className="elementskit-commentor-content">
                        <span className="elementskit-watermark-icon ekit_watermark_icon_custom_position">
                          <Icon value={node.quoteIcon as IconValue} icons={ctx.icons} />
                        </span>
                        <p>{t.quote}</p>
                        {t.stars ? (
                          <ul className="elementskit-stars">
                            {Array.from({ length: t.stars }, (_, i) => (
                              <li key={i}>
                                <a>
                                  <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d={STAR} />
                                  </svg>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {node.hasDots ? <div className="swiper-pagination"></div> : null}
          </div>
        </div>
      </div>
    </Widget>
  );
}

type Slide = { _key: string; image: ImgT; link?: Link };

function ImageCarousel({ node }: Props) {
  const slides = (node.slides as Slide[]) ?? [];
  return (
    <Widget node={node} type="image-carousel.default">
      <div className="elementor-image-carousel-wrapper swiper" role="region" aria-roledescription="carousel" aria-label="Image Carousel" dir="ltr">
        <div className="elementor-image-carousel swiper-wrapper" aria-live="off">
          {slides.map((sl, i) => {
            const img = <Img img={sl.image} className="swiper-slide-image" />;
            return (
              <div className="swiper-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`} key={sl._key}>
                <figure className="swiper-slide-inner">{sl.link?.href ? <a {...aProps(sl.link)}>{img}</a> : img}</figure>
              </div>
            );
          })}
        </div>
        {node.hasDots ? <div className="swiper-pagination"></div> : null}
      </div>
    </Widget>
  );
}

function MediaCarousel({ node }: Props) {
  const slides = (node.slides as Slide[]) ?? [];
  return (
    <Widget node={node} type="media-carousel.default">
      <div className="elementor-main-swiper swiper" role="region" aria-roledescription="carousel" aria-label="Slides">
        <div className="swiper-wrapper">
          {slides.map((sl) => (
            <div className="swiper-slide" role="group" aria-roledescription="slide" key={sl._key}>
              {/* The live slides pointed at files that no longer exist; an empty slide keeps the same layout. */}
              {sl.link?.href && !/\/images\/2024\/05\/Data-Recovery/.test(sl.image?.src ?? "") ? (
                <a {...aProps(sl.link)}>
                  <div className="elementor-carousel-image" role="img" aria-label={sl.image?.alt ?? ""} />
                </a>
              ) : (
                <div className="elementor-carousel-image" role="img" aria-label={sl.image?.alt ?? ""} />
              )}
            </div>
          ))}
        </div>
        <div className="swiper-pagination"></div>
      </div>
    </Widget>
  );
}

type AccItem = { _key: string; title: string; titleTag?: string; open?: boolean; content: EbNode[] };

function NestedAccordion({ node, ctx, depth }: Props) {
  const items = (node.items as AccItem[]) ?? [];
  return (
    <Widget node={node} type="nested-accordion.default">
      <div className="e-n-accordion" aria-label="Accordion. Open links with Enter or Space, close with Escape, and navigate with Arrow Keys">
        {items.map((it, i) => {
          const id = `e-n-accordion-item-${node._key}${i}`;
          const T = (it.titleTag ?? "div") as "div";
          return (
            <details className="e-n-accordion-item" id={id} key={it._key} open={it.open || undefined}>
              <summary className="e-n-accordion-item-title" data-accordion-index={i + 1} tabIndex={0} aria-expanded={it.open ? "true" : "false"} aria-controls={id}>
                <span className="e-n-accordion-item-title-header">
                  <T className="e-n-accordion-item-title-text"> {it.title} </T>
                </span>
                <span className="e-n-accordion-item-title-icon">
                  <span className="e-opened">
                    <Icon value={node.iconOpened as IconValue} icons={ctx.icons} />
                  </span>
                  <span className="e-closed">
                    <Icon value={node.iconClosed as IconValue} icons={ctx.icons} />
                  </span>
                </span>
              </summary>
              {(it.content ?? []).map((c) => (
                <Node key={c._key} node={{ ...c, cls: c.cls }} ctx={ctx} depth={depth + 1} />
              ))}
            </details>
          );
        })}
      </div>
    </Widget>
  );
}

type Social = { _key: string; network: string; repeaterCls?: string; label: string; link?: Link; icon?: IconValue; anim?: string };

function SocialIcons({ node, ctx }: Props) {
  return (
    <Widget node={node} type="social-icons.default">
      <div className="elementor-social-icons-wrapper elementor-grid" role="list">
        {((node.items as Social[]) ?? []).map((it) => (
          <span className="elementor-grid-item" role="listitem" key={it._key}>
            <a className={`elementor-icon elementor-social-icon elementor-social-icon-${it.network} ${it.anim ?? ""} ${it.repeaterCls ?? ""}`} {...aProps(it.link)}>
              <span className="elementor-screen-only">{it.label}</span>
              <Icon value={it.icon} icons={ctx.icons} />
            </a>
          </span>
        ))}
      </div>
    </Widget>
  );
}

function Rating({ node, ctx }: Props) {
  const scale = Number(s(node.scale) ?? 5);
  const value = s(node.value) ?? String(scale);
  return (
    <Widget node={node} type="rating.default">
      <div className="e-rating">
        <div className="e-rating-wrapper" role="img" aria-label={`Rated ${value} out of ${scale}`}>
          {Array.from({ length: scale }, (_, i) => (
            <div className="e-icon" key={i}>
              <div className="e-icon-wrapper e-icon-marked">
                <Icon value={node.icon as IconValue} icons={ctx.icons} />
              </div>
              <div className="e-icon-wrapper e-icon-unmarked">
                <Icon value={node.icon as IconValue} icons={ctx.icons} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}

function Template({ node, ctx }: Props) {
  const doc = ctx.templates[s(node.templateId) ?? ""];
  return (
    <Widget node={node} type="wpr-elementor-template.default">
      {doc ? <Document doc={doc} ctx={ctx} /> : null}
    </Widget>
  );
}

function SiteLogo({ node }: Props) {
  const link = node.link as Link | undefined;
  return (
    <Widget node={node} type="theme-site-logo.default">
      <a href={link?.href === "https://ttrtechnology.com" ? "/" : (link?.href ?? "/")}>
        <Img img={node.image as ImgT} eager />
      </a>
    </Widget>
  );
}

function CreativeButton({ node, ctx }: Props) {
  return (
    <Widget node={node} type="eael-creative-button.default">
      <div className="eael-creative-button-wrapper">
        <a className={s(node.btnCls) ?? "eael-creative-button"} data-text={s(node.dataText) ?? ""} {...aProps(node.link as Link)}>
          <div className="creative-button-inner">
            {node.iconLeft ? (
              <span className="eael-creative-button-icon-left">
                <Icon value={node.iconLeft as IconValue} icons={ctx.icons} />
              </span>
            ) : null}
            <span className="cretive-button-text">{s(node.text)}</span>
            {node.iconRight ? (
              <span className="eael-creative-button-icon-right">
                <Icon value={node.iconRight as IconValue} icons={ctx.icons} />
              </span>
            ) : null}
          </div>
        </a>
      </div>
    </Widget>
  );
}

function Spacer({ node }: Props) {
  return (
    <Widget node={node} type="spacer.default" container>
      <div className="elementor-spacer">
        <div className="elementor-spacer-inner"></div>
      </div>
    </Widget>
  );
}

const WIDGETS: Record<string, (p: Props) => ReactNode> = {
  heading: Heading,
  textEditor: TextEditor,
  image: ImageW,
  button: Button,
  icon: IconW,
  iconBox: IconBox,
  ekitIconBox: EkitIconBox,
  iconList: IconList,
  imageBox: ImageBox,
  divider: Divider,
  counter: Counter,
  eaelFlipBox: EaelFlipBox,
  flipBox: FlipBox,
  ekitTestimonial: EkitTestimonial,
  imageCarousel: ImageCarousel,
  mediaCarousel: MediaCarousel,
  nestedAccordion: NestedAccordion,
  socialIcons: SocialIcons,
  rating: Rating,
  template: Template,
  siteLogo: SiteLogo,
  creativeButton: CreativeButton,
  spacer: Spacer,
  html: ({ node }) => (
    <div
      className={`elementor-element elementor-element-${node._key} ${node.cls ?? ""} elementor-widget`}
      data-id={node._key}
      data-element_type="widget"
      data-widget_type="html.default"
      dangerouslySetInnerHTML={{ __html: cleanHtml(s(node.code) ?? "") }}
    />
  ),
  navMenu: ({ node, ctx }) => (
    <Widget node={node} type="ekit-nav-menu.default" container>
      <NavMenu node={node} ctx={ctx} />
    </Widget>
  ),
  posts: ({ node, ctx }) => (
    <Widget node={node} type={`posts.${s(node.skin) ?? "classic"}`} container>
      <PostsWidget node={node} ctx={ctx} />
    </Widget>
  ),
  search: ({ node, ctx }) => (
    <Widget node={node} type="wpr-search.default">
      <SearchWidget placeholder={s(node.placeholder) ?? "Search..."} icon={<Icon value={node.icon as IconValue} icons={ctx.icons} />} posts={ctx.posts.map((p) => ({ title: p.title, path: p.path }))} />
    </Widget>
  ),
  fluentForm: ({ node, ctx }) => (
    <Widget node={node} type="fluent-form-widget.default" container>
      <FluentForm formHtml={s(node.formHtml) ?? ""} pdf={ctx.post && "pdf" in ctx.post ? ctx.post.pdf : undefined} />
    </Widget>
  ),
  postTitle: ({ node, ctx }) => (
    <Widget node={node} type="theme-post-title.default">
      <PostTitle node={node} ctx={ctx} />
    </Widget>
  ),
  postImage: ({ node, ctx }) => (
    <Widget node={node} type="theme-post-featured-image.default">
      <PostImage ctx={ctx} />
    </Widget>
  ),
  postInfo: ({ node, ctx }) => (
    <Widget node={node} type="post-info.default">
      <PostInfo node={node} ctx={ctx} />
    </Widget>
  ),
  postContent: ({ node, ctx }) => (
    <Widget node={node} type="theme-post-content.default">
      <PostContent ctx={ctx} />
    </Widget>
  ),
  postNav: ({ node, ctx }) => (
    <Widget node={node} type="post-navigation.default">
      <PostNav ctx={ctx} />
    </Widget>
  ),
};

export function Node({ node, ctx, depth }: Props) {
  if (node._type === "container") return <Container node={node} ctx={ctx} depth={depth} />;
  const W = WIDGETS[node._type];
  if (!W) return null;
  return <W node={node} ctx={ctx} depth={depth} />;
}

/** An Elementor document (page, template, header, footer) with its own design rules. */
export function Document({ doc, ctx, tag = "div", extraCls }: { doc: EbDoc; ctx: RenderCtx; tag?: "div" | "header" | "footer"; extraCls?: string }) {
  const T = tag;
  const css = docCss(doc.id);
  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <T className={`${doc.cls || `elementor elementor-${doc.id}`}${extraCls ? ` ${extraCls}` : ""}`} data-elementor-type={doc.type} data-elementor-id={doc.id} data-elementor-post-type={doc.postType}>
        {doc.children.map((c) => (
          <Node key={c._key} node={c} ctx={ctx} depth={0} />
        ))}
      </T>
    </>
  );
}
