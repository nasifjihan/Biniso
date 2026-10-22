import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import FavoritesSync from "@/components/Account/FavoritesSync";
import Analytics from "@/components/Analytics";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/seo";

export default function ShopLayout({ children }) {
  return (
    <>
      {/* Who runs the store, once per storefront page rather than per admin one. */}
      <JsonLd data={organizationJsonLd()} />
      <Navbar />
      <FavoritesSync />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Storefront traffic only — the dashboard is left out of its own numbers. */}
      <Analytics />
    </>
  );
}
