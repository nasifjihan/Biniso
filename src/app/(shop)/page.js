import TopBar from "@/components/Home/TopBar";
import CategorySearchBar from "@/components/Home/CategorySearchBar";
import HeroCarousel from "@/components/Home/HeroCarousel";
import PromoCard from "@/components/Home/PromoCard";
import FeatureStrip from "@/components/Home/FeatureStrip";
import JsonLd from "@/components/JsonLd";
import { SITE_DESCRIPTION, pageMetadata, websiteJsonLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Online shopping in Bangladesh",
  description: SITE_DESCRIPTION,
  path: "/",
  images: [
    {
      url: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium%20online%20shopping%20ecommerce%20storefront%20hero%20banner%20with%20gradient%20background&image_size=landscape_16_9",
    },
  ],
});

export default async function HomePage() {
  return (
    <div className="space-y-8 pb-16">
      <JsonLd data={websiteJsonLd()} />
      <TopBar />
      <CategorySearchBar />
      <div className="container mx-auto grid md:grid-cols-[1fr_320px] gap-6">
        <HeroCarousel />
        <div className="space-y-6">
          <PromoCard
            title="Winter Sale 20% OFF"
            subtitle="Explore Now"
            image="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=winter%20fashion%20sale%20promotional%20still%20life%20on%20clean%20background&image_size=landscape_4_3"
          />
          <PromoCard
            title="Airpods Pro 30% OFF"
            subtitle="Accessories"
            image="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=wireless%20earbuds%20charging%20case%20product%20photo%20on%20clean%20white%20background&image_size=landscape_4_3"
          />
        </div>
      </div>
      <FeatureStrip />
    </div>
  );
}
