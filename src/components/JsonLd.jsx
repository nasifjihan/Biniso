/**
 * Renders JSON-LD for crawlers. The data is built on the server from database
 * rows, and the angle brackets are escaped so a product name containing `</`
 * cannot break out of the script tag.
 */
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
