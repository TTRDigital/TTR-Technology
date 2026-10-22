import { Fragment, type ReactNode } from "react";
import type { FaqBlock, ImageBlock, MarkDef, Rich as RichT, RichBlock, Span, TextBlock } from "@/lib/types";
import { cssToStyle, isPlaceholder, safeInline } from "@/lib/text";
import { Img } from "./Img";

/*
 * Rich text (Portable Text) rendered with the same tags and classes the live
 * page had: plain <p>/<ul> in text widgets, WordPress block classes in posts.
 */

type Variant = "text" | "post";

function spanContent(text: string | undefined): ReactNode {
  if (!text) return null;
  if (!text.includes("\n")) return text;
  const parts = text.split("\n");
  return parts.map((p, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {p}
    </Fragment>
  ));
}

function renderSpans(block: TextBlock): ReactNode {
  const defs = new Map<string, MarkDef>((block.markDefs ?? []).map((d) => [d._key, d]));
  return (block.children ?? []).map((s: Span) => {
    let node: ReactNode = spanContent(s.text);
    // Innermost mark first, so the order of nesting matches the live markup.
    for (const m of [...(s.marks ?? [])].reverse()) {
      const d = defs.get(m);
      if (m === "strong") node = <strong>{node}</strong>;
      else if (m === "em") node = <em>{node}</em>;
      else if (m === "underline") node = <u>{node}</u>;
      else if (m === "sup") node = <sup>{node}</sup>;
      else if (m === "sub") node = <sub>{node}</sub>;
      else if (m === "code") node = <code>{node}</code>;
      else if (d?._type === "link")
        node = (
          <a href={d.href} {...(d.blank ? { target: "_blank" } : {})} {...(d.rel || d.blank ? { rel: d.rel || "noopener" } : {})}>
            {node}
          </a>
        );
      else if (d?._type === "textStyle") node = <span style={cssToStyle(d.style)}>{node}</span>;
    }
    return <Fragment key={s._key}>{node}</Fragment>;
  });
}

function textBlock(b: TextBlock, v: Variant): ReactNode {
  const content = renderSpans(b);
  const style = b.align ? { textAlign: b.align as "left" } : undefined;
  if (b.style === "plain") return <Fragment key={b._key}>{content}</Fragment>;
  if (/^h[1-6]$/.test(b.style)) {
    const H = b.style as "h2";
    return (
      <H key={b._key} id={b.anchor} className={v === "post" ? "wp-block-heading" : undefined} style={style}>
        {content}
      </H>
    );
  }
  if (b.style === "blockquote") return <blockquote key={b._key}>{content}</blockquote>;
  return (
    <p key={b._key} className={v === "post" ? "wp-block-paragraph" : undefined} style={style}>
      {content}
    </p>
  );
}

type ListNode = { type: "bullet" | "number"; items: { block: TextBlock; sub: ListNode[] }[] };

/** Flat list blocks (level 1, 2, …) -> nested lists. */
function buildLists(blocks: TextBlock[]): ListNode[] {
  const root: ListNode[] = [];
  const stack: ListNode[] = [];
  for (const b of blocks) {
    const level = b.level ?? 1;
    while (stack.length > level) stack.pop();
    while (stack.length < level) {
      const list: ListNode = { type: b.listItem ?? "bullet", items: [] };
      if (stack.length === 0) root.push(list);
      else {
        const parent = stack[stack.length - 1];
        const last = parent.items[parent.items.length - 1];
        if (last) last.sub.push(list);
        else parent.items.push({ block: { ...b, children: [] }, sub: [list] });
      }
      stack.push(list);
    }
    const cur = stack[stack.length - 1];
    if (cur.type !== (b.listItem ?? "bullet") && cur.items.length) {
      // A different list type at the same level starts a new list.
      stack.pop();
      const list: ListNode = { type: b.listItem ?? "bullet", items: [] };
      if (stack.length === 0) root.push(list);
      else stack[stack.length - 1].items[stack[stack.length - 1].items.length - 1].sub.push(list);
      stack.push(list);
    }
    stack[stack.length - 1].items.push({ block: b, sub: [] });
  }
  return root;
}

function renderList(l: ListNode, v: Variant, key: string): ReactNode {
  const T = l.type === "number" ? "ol" : "ul";
  return (
    <T key={key} className={v === "post" ? "wp-block-list" : undefined}>
      {l.items.map((it, i) => (
        <li key={it.block._key || i}>
          {renderSpans(it.block)}
          {it.sub.map((s, j) => renderList(s, v, `${key}-${i}-${j}`))}
        </li>
      ))}
    </T>
  );
}

function imageBlock(b: ImageBlock): ReactNode {
  if (!b.image) return null;
  const img = <Img img={b.image} />;
  const inner = b.href ? <a href={b.href}>{img}</a> : img;
  return (
    <figure key={b._key} className={b.cls || "wp-block-image"}>
      {inner}
      {b.caption ? <figcaption className="wp-element-caption">{spanContent(b.caption)}</figcaption> : null}
    </figure>
  );
}

/** Rank Math FAQ block, as the live posts printed it (questions keep their bold text). */
function faqBlock(b: FaqBlock): ReactNode {
  return (
    <div key={b._key} id="rank-math-faq" className="rank-math-block">
      <div className="rank-math-list">
        {(b.items ?? []).map((it) => (
          <div key={it._key} className="rank-math-list-item">
            <h3 className="rank-math-question" dangerouslySetInnerHTML={{ __html: safeInline(it.question) }} />
            <div className="rank-math-answer">
              <Rich value={it.answer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Rich({ value, variant = "text" }: { value?: RichT | null; variant?: Variant }) {
  if (!value?.length) return null;
  const out: ReactNode[] = [];
  let listRun: TextBlock[] = [];
  const flush = () => {
    if (!listRun.length) return;
    buildLists(listRun).forEach((l, i) => out.push(renderList(l, variant, `${listRun[0]._key}-${i}`)));
    listRun = [];
  };
  for (const b of value as RichBlock[]) {
    if (b._type === "block" && (b as TextBlock).listItem) {
      listRun.push(b as TextBlock);
      continue;
    }
    flush();
    if (b._type === "block") {
      const tb = b as TextBlock;
      if (isPlaceholder((tb.children ?? []).map((c) => c.text).join(""))) continue;
      out.push(textBlock(tb, variant));
    } else if (b._type === "imageBlock") out.push(imageBlock(b as ImageBlock));
    else if (b._type === "faqBlock") out.push(faqBlock(b as FaqBlock));
    else if (b._type === "tableBlock")
      out.push(
        <figure key={b._key} className="wp-block-table">
          <table>
            <tbody>
              {(b.rows ?? []).map((r) => (
                <tr key={r._key}>{(r.cells ?? []).map((c, i) => (r.head ? <th key={i}>{c}</th> : <td key={i}>{c}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </figure>,
      );
    else if (b._type === "hrBlock") out.push(<hr key={b._key} />);
    else if (b._type === "embedBlock") out.push(<div key={b._key} dangerouslySetInnerHTML={{ __html: b.html }} />);
    else if (b._type === "groupBlock")
      out.push(
        <div key={b._key} className={b.cls}>
          <Rich value={b.body} variant={variant} />
        </div>,
      );
  }
  flush();
  return <>{out}</>;
}

/** Plain text of rich text (FAQ schema, excerpts). */
export function richText(value?: RichT | null): string {
  return (value ?? [])
    .map((b) => (b._type === "block" ? (b.children ?? []).map((c) => c.text ?? "").join("") : b._type === "groupBlock" ? richText(b.body) : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}
