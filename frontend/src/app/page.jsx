import Banner from "@/components/Banner/Banner";
import Catalog from "@/components/Catalog/Catalog";
import RecentlyViewed from "@/components/RecentlyViewed/RecentlyViewed";
import Welcome from "@/components/Welcome/Welcome";
import { getFeaturedCars } from "@/lib/cars";

export default async function Home({ searchParams }) {
  const bannerCars = await getFeaturedCars(4);

  return (
    <div className="home">
      <Welcome />
      <Banner cars={bannerCars} />
      <Catalog searchParams={searchParams} />
      <RecentlyViewed />
    </div>
  );
}
