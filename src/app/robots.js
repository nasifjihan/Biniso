import { SITE_URL } from "@/lib/seo";

const baseUrl = SITE_URL;

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Basket, checkout and account pages are per-shopper; search and track
        // are transient and already send a noindex of their own.
        disallow: [
          "/admin",
          "/api",
          "/account",
          "/cart",
          "/checkout",
          "/order-success",
          "/search",
          "/track",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
