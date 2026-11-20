import Banner from "@/components/Banner/Banner";
import Catalog from "@/components/Catalog/Catalog";
import RecentlyViewed from "@/components/RecentlyViewed/RecentlyViewed";
import Welcome from "@/components/Welcome/Welcome";
import { getFeaturedCars } from "@/lib/cars";
import { FILTER_KEYS } from "@/components/CatalogFilter/filterKeys";

// Any of these in the URL means the visitor is heading for the catalog
// (a search, a shared filter link, page 2…), so the intro is skipped.
const CATALOG_KEYS = ["search", "sort", "page", ...FILTER_KEYS];

export default async function Home({ searchParams }) {
  const [bannerCars, params] = await Promise.all([
    getFeaturedCars(4),
    searchParams,
  ]);

  const toCatalog = CATALOG_KEYS.some((key) => params?.[key] !== undefined);

  return (
    <div className="home">
      <Welcome skip={toCatalog} />
      <Banner cars={bannerCars} />
      <Catalog searchParams={searchParams} />
      <RecentlyViewed />
    </div>
  );
}
