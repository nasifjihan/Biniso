import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import FavoritesSync from "@/components/Account/FavoritesSync";

export default function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <FavoritesSync />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

