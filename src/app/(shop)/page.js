import TopBar from "@/components/Home/TopBar";
import CategorySearchBar from "@/components/Home/CategorySearchBar";
import HeroCarousel from "@/components/Home/HeroCarousel";
import PromoCard from "@/components/Home/PromoCard";
import FeatureStrip from "@/components/Home/FeatureStrip";

export const metadata = {
  title: "Home - Biniso",
  description: "Check out our featured products and shop easily online.",
  openGraph: {
    title: "Home - Biniso",
    description: "Check out our featured products and shop easily online.",
    url: "https://biniso.com",
  },
};

export default async function HomePage() {
  return (
    <div className="space-y-8 pb-16">
      <TopBar />
      <CategorySearchBar />
      <div className="container mx-auto grid md:grid-cols-[1fr_320px] gap-6">
        <HeroCarousel />
        <div className="space-y-6">
          <PromoCard
            title="Winter Sale 20% OFF"
            subtitle="Explore Now"
            image="/vercel.svg"
          />
          <PromoCard
            title="Airpods Pro 30% OFF"
            subtitle="Accessories"
            image="/window.svg"
          />
        </div>
      </div>
      <FeatureStrip />
    </div>
  );
}
