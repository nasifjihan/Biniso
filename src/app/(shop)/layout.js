import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";

export default function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

