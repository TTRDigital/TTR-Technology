import type { ReactNode } from "react";

/*
 * Blog search box (Royal Addons search markup). WordPress search pages do not
 * exist on a static site: the runtime lists matching post titles under the box
 * as you type, like the live widget's instant results (index embedded below).
 */
export function SearchWidget({ placeholder, icon, posts }: { placeholder: string; icon: ReactNode; posts: { title: string; path: string }[] }) {
  return (
    <>
      <form className="wpr-search-form" role="search" action="/blog/" method="get">
        <div className="wpr-search-form-input-wrap elementor-clearfix">
          <input className="wpr-search-form-input" placeholder={placeholder} aria-label="Search" type="search" name="s" title="Search" autoComplete="off" />
          <button className="wpr-search-form-submit" aria-label="Search" type="submit">
            {icon}
          </button>
        </div>
      </form>
      <div className="wpr-data-fetch">
        <span className="wpr-close-search"></span>
        <ul></ul>
      </div>
      <script type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(posts).replace(/</g, "\\u003c") }} />
    </>
  );
}
