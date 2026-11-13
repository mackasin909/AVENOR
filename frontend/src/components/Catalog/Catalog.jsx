import FilterPanel from "@/components/CatalogFilter/FilterPanel";
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

export default async function Catalog({ cars, searchParams }) {
  const params = (await searchParams) ?? {};
  const query = typeof params.search === "string" ? params.search : "";
  const result = searchCars(cars, query);

  const filterCars = cars.map(({ brand, model, country }) => ({
    brand,
    model,
    country,
  }));

  const priceBounds = getBounds(cars.map((car) => car.price));
  const mileageBounds = getBounds(cars.map((car) => car.mileage));

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