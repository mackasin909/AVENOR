import FilterPanel from "@/components/CatalogFilter/FilterPanel";
import { CARS } from "@/data/cars";
import { searchCars } from "@/lib/searchCars";
import CatalogResults from "./CatalogResults";
import styles from "./Catalog.module.scss";

function getBounds(values) {
  const numbers = values.filter(Number.isFinite);

  if (numbers.length === 0) return null;

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
  };
}

export default async function Catalog({ searchParams }) {
  const params = (await searchParams) ?? {};
  const query = typeof params.search === "string" ? params.search : "";
  const result = searchCars(CARS, query);

  const filterCars = CARS.map(({ brand, model, location }) => ({
    brand,
    model,
    country: location.split(",").at(-1).trim(),
  }));

  const priceBounds = getBounds(CARS.map((car) => car.price));
  const mileageBounds = getBounds(CARS.map((car) => car.mileage));

  return (
    <div id="catalog" className={styles.catalog}>
      <div className="container">
        <div className={styles.catalogWrapper}>
          <FilterPanel
            cars={filterCars}
            priceBounds={priceBounds}
            mileageBounds={mileageBounds}
          />

          <CatalogResults cars={result} query={query} />
        </div>
      </div>
    </div>
  );
}