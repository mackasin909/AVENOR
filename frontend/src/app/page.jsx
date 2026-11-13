import Banner from "@/components/Banner/Banner";
import Catalog from "@/components/Catalog/Catalog";
import Welcome from "@/components/Welcome/Welcome";
import { getCars } from "@/lib/cars";

export default async function Home({ searchParams }) {
  const cars = await getCars();

  return (
    <div className="home">
      <Welcome />
      <Banner cars={cars} />
      <Catalog cars={cars} searchParams={searchParams} />
    </div>
  );
}
