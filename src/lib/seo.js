/**
 * Absolute URLs and structured data for crawlers. Every page that renders
 * JSON-LD builds it here, so the shapes and the site name stay in one place.
 */

export const SITE_NAME = "Biniso";
export const SITE_DESCRIPTION =
  "Shop curated premium products online in Bangladesh with cash on delivery.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

/** The site-wide banner, used wherever a page has no image of its own. */
export const DEFAULT_OG_IMAGE =
  "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20online%20shopping%20ecommerce%20brand%20banner%20with%20gradient%20background&image_size=landscape_16_9";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** `"All Products"` -> `"All Products | Biniso"`. */
export function pageTitle(title) {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

/**
 * The canonical link and the Open Graph copy for a page. Metadata lives in
 * plain objects, but repeating these four lines on every page invites drift.
 */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  images,
  type = "website",
}) {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: pageTitle(title),
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      type,
      images: images?.length ? images : [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle(title),
      description,
      images: images?.length ? images : [DEFAULT_OG_IMAGE],
    },
  };
}

/** Who runs the store. Search engines use this to label the site. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

/** The site itself, with the box that jumps straight to the store search. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * The trail a search result shows instead of a bare URL.
 * `items` is `[{ name, path }]`, home first.
 */
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** The products shown on a listing page, in the order they appear. */
export function itemListJsonLd(products, path) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/products/${product.id}`),
      name: product.name,
    })),
  };
}

/**
 * A product page. `stock === null` means "not tracked", which counts as
 * available; the price is the shelf price in BDT and delivery is charged on
 * top, so it is the offer price rather than a total.
 */
export function productJsonLd(product) {
  const path = `/products/${product.id}`;
  const url = absoluteUrl(path);
  const tracked = product.stock !== null && product.stock !== undefined;
  const inStock = !tracked || product.stock > 0;

  const images = (product.product_images || [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((image) => image.url)
    .filter(Boolean);

  if (images.length === 0 && product.image) images.push(product.image);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description?.trim() || `Buy ${product.name} online at ${SITE_NAME}.`,
    image: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    url,
    ...(product.category?.name ? { category: product.category.name } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      price: Number(product.price),
      priceCurrency: "BDT",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}
