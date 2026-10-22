/*
 * Custom HTML blocks from the live pages (the contact form with its HoneyCRM
 * script, the Zoho CRM form on posts). Their <script> tags are run once by the
 * site runtime (components/layout/Runtime.tsx), in order, as the browser would.
 */
export function cleanHtml(code: string) {
  return (
    code
      // links to the live host become site-relative
      .replace(/https?:\/\/(?:www\.)?ttrtechnology\.com(?=\/|")/g, "")
      // a broken copy of the HoneyCRM snippet (escaped, pointing at example.com) only threw an error on the live site
      .replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*\\_honeySettings(?:(?!<\/script>)[\s\S])*<\/script>/g, "")
  );
}
