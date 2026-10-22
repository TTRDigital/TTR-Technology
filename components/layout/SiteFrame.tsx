import type { ReactNode } from "react";
import type { RenderCtx, Templates } from "@/lib/types";
import { Document } from "@/components/eb/Render";

/**
 * Header and footer around a page, with the same wrappers as the live theme
 * (Hello Elementor + ElementsKit header template + Elementor footer). The
 * page-level classes (the live <body> classes) sit on the wrapper.
 */
export function SiteFrame({ className, templates, ctx, children }: { className: string; templates: Templates; ctx: RenderCtx; children: ReactNode }) {
  return (
    <div className={`site-wrap ${className}`}>
      <a className="skip-link screen-reader-text" href="#content">
        Skip to content
      </a>
      <div className="ekit-template-content-markup ekit-template-content-header ekit-template-content-theme-support">
        <Document doc={templates.header} ctx={ctx} />
      </div>
      {children}
      <Document doc={templates.footer} ctx={ctx} tag="footer" />
    </div>
  );
}
