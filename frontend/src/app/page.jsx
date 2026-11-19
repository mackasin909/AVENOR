import Banner from "@/components/Banner/Banner";
import Catalog from "@/components/Catalog/Catalog";
import RecentlyViewed from "@/components/RecentlyViewed/RecentlyViewed";
import Welcome from "@/components/Welcome/Welcome";
import { getFeaturedCars } from "@/lib/cars";

export default async function Home({ searchParams }) {
  const [bannerCars, params] = await Promise.all([
    getFeaturedCars(4),
    searchParams,
  ]);

  // A search from the header lands straight on the catalog, without the intro.
  const fromSearch = typeof params?.search === "string";

  return (
    <div className="home">
      <Welcome skip={fromSearch} />
      <Banner cars={bannerCars} />
      <Catalog searchParams={searchParams} />
      <RecentlyViewed />
    </div>
  );
}
