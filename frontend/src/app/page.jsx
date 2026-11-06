import Banner from "@/components/Banner/Banner";
import Catalog from "@/components/Catalog/Catalog";
import Welcome from "@/components/Welcome/Welcome";

export default function Home({ searchParams }) {
  return (
    <div className="home">
      <Welcome />
      <Banner />
      <Catalog searchParams={searchParams} />
    </div>
  );
}