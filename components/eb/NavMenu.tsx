import type { EbNode, RenderCtx } from "@/lib/types";
import { Document } from "./Render";
import { Icon } from "./Icon";
import { Img } from "./Img";

/*
 * The header menu (ElementsKit nav menu markup, so its design rules apply).
 * Desktop dropdowns open on hover in CSS; the phone menu, submenus and the
 * "never wrap" switch are wired up by lib/runtime-script.ts. Like WordPress, the
 * item linking to the current page is marked current (and its parent an ancestor),
 * which the header's design rules color.
 */

export type MenuItem = { _key: string; label: string; href: string; liCls?: string; aCls?: string; width?: string; panel?: string; children?: MenuItem[] };

const INDICATOR = <i aria-hidden="true" className="icon icon-down-arrow1 elementskit-submenu-indicator"></i>;

const CURRENT = /\s*\b(current-menu-item|current_page_item|current-menu-ancestor|current-menu-parent|active)\b/g;
const isCurrent = (it: MenuItem, path?: string) => !!path && it.href === path;
const hasCurrent = (it: MenuItem, path?: string): boolean => (it.children ?? []).some((c) => isCurrent(c, path) || hasCurrent(c, path));

function Item({ it, ctx, top }: { it: MenuItem; ctx: RenderCtx; top: boolean }) {
  const hasSub = !!it.children?.length;
  const panelDoc = it.panel ? ctx.templates[it.panel] : undefined;
  const id = it._key;
  const mark = isCurrent(it, ctx.path)
    ? " current-menu-item current_page_item active"
    : hasCurrent(it, ctx.path)
      ? ` current-menu-ancestor${it.children?.some((c) => isCurrent(c, ctx.path)) ? " current-menu-parent" : ""}`
      : "";
  const liCls = `${(it.liCls ?? "").replace(CURRENT, "")}${mark}`.trim() || undefined;
  return (
    <li className={liCls} data-vertical-menu={it.width}>
      <a
        href={it.href || "#"}
        className={it.aCls || (top ? "ekit-menu-nav-link" : "dropdown-item")}
        {...(hasSub ? { "aria-haspopup": "true" as const, "aria-expanded": "false" as const, "aria-controls": `ekit-submenu-${id}` } : {})}
        {...(panelDoc ? { "aria-expanded": "false" as const, "aria-controls": `ekit-megamenu-panel-${id}` } : {})}
      >
        {it.label}
        {hasSub || panelDoc ? INDICATOR : null}
      </a>
      {hasSub ? (
        <ul className="elementskit-dropdown elementskit-submenu-panel" id={`ekit-submenu-${id}`}>
          {it.children!.map((c) => (
            <Item key={c._key} it={c} ctx={ctx} top={false} />
          ))}
        </ul>
      ) : null}
      {panelDoc ? (
        <div className="elementskit-megamenu-panel" id={`ekit-megamenu-panel-${id}`}>
          <Document doc={panelDoc} ctx={ctx} />
        </div>
      ) : null}
    </li>
  );
}

export function NavMenu({ node, ctx }: { node: EbNode; ctx: RenderCtx }) {
  const items = (node.items as MenuItem[]) ?? [];
  const logo = (node.identityLogo as { src: string; alt: string; width?: number; height?: number }) ?? {
    src: "/images/2024/08/TTR-Technology-AIV9-768x66-1.png",
    alt: "TTR Technology logo",
  };
  return (
    <nav aria-label="Header Menu New" className={(node.navCls as string) ?? "ekit-wid-con ekit_menu_responsive_tablet"} data-responsive-breakpoint={node.breakpoint as string}>
      <button className="elementskit-menu-hamburger elementskit-menu-toggler" type="button" aria-label="Menu" aria-controls="ekit-megamenu-header-menu-new" aria-expanded="false">
        <Icon value={(node.hamburger as string) ?? '<i class="ekit-menu-icon icon icon-menu-11" aria-hidden="true"></i>'} icons={ctx.icons} />
      </button>
      <div id="ekit-megamenu-header-menu-new" className={node.containerCls as string}>
        <ul id="menu-header-menu-new" className={node.ulCls as string}>
          {items.map((it) => (
            <Item key={it._key} it={it} ctx={ctx} top />
          ))}
        </ul>
        <div className="elementskit-nav-identity-panel">
          <a className="elementskit-nav-logo" href="/">
            <Img img={{ ...logo, width: logo.width ?? 768, height: logo.height ?? 66 }} />
          </a>
          <button className="elementskit-menu-close elementskit-menu-toggler" type="button" aria-label="Close menu">
            X
          </button>
        </div>
      </div>
      <div className="elementskit-menu-overlay elementskit-menu-offcanvas-elements elementskit-menu-toggler ekit-nav-menu--overlay"></div>
    </nav>
  );
}
