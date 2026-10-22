/*
 * The datasheet / whitepaper download form, with the same fields and markup as
 * the live Fluent Forms form. It is not sent anywhere yet (the destination is to
 * be decided): on submit the browser checks the required fields and the PDF
 * opens, as the live form did after submitting (see Runtime.tsx).
 */
export function FluentForm({ formHtml, pdf }: { formHtml: string; pdf?: string }) {
  const html = formHtml
    .replace(/<input[^>]*name="(?:__fluent_form_embded_post_id|_fluentform_4_fluentformnonce|_wp_http_referer)"[^>]*\/?>/g, "")
    .replace(/\bff-form-loading\b/g, "")
    .replace(/(<input[^>]*name="hidden"[^>]*value=")[^"]*(")/, `$1${pdf ?? ""}$2`)
    .replace(/<form /, `<form data-pdf="${pdf ?? ""}" novalidate `)
    .replace(/https?:\/\/(?:www\.)?ttrtechnology\.com(?=\/)/g, "");
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
