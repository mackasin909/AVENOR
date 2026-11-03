import Link from "next/link";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import styles from "./page.module.scss";
import { CARS } from "@/data/cars";
import { searchCars } from "@/lib/searchCars";

export default async function CatalogPage({ searchParams }) {
  const { search } = await searchParams;
  const query = typeof search === "string" ? search : "";

  const result = searchCars(CARS, query);

  return (
    <div className={styles.catalogPage}>
      <div className="container">
        <div className={styles.catalogTop}>
          <h2 className={styles.title}>Catalog</h2>
          <button className={styles.filter}>Filter</button>
        </div>

        {query && (
          <p className={styles.info}>
            {result.length} result{result.length === 1 ? "" : "s"} for “{query}”
          </p>
        )}

        {result.length > 0 ? (
          <div className="grid">
            {result.map((car) => (
              <CatalogCard
                key={car.id}
                id={car.id}
                year={car.year}
                location={car.location}
                images={car.images}
                name={car.name}
                price={car.price}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No cars found for “{query}”</p>
            <Link className={styles.emptyLink} href="/catalog">Reset search</Link>
          </div>
        )}
      </div>
    </div>
  );
}