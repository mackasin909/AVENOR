"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import styles from "./Catalog.module.scss";

function readBound(params, key) {
  const rawValue = params.get(key);

  if (rawValue === null || rawValue.trim() === "") return null;

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function matchesRange(value, min, max) {
  if (min === null && max === null) return true;

  return (
    Number.isFinite(value) &&
    (min === null || value >= min) &&
    (max === null || value <= max)
  );
}

export default function CatalogResults({ cars, query }) {
  const params = useSearchParams();

  const brand = params.get("brand");
  const model = params.get("model");
  const country = params.get("country");

  const minPrice = readBound(params, "minPrice");
  const maxPrice = readBound(params, "maxPrice");
  const minMileage = readBound(params, "minMileage");
  const maxMileage = readBound(params, "maxMileage");

  const result = cars.filter((car) => {
    return (
      (!brand || car.brand === brand) &&
      (!model || car.model === model) &&
      (!country || car.location.split(",").at(-1).trim() === country) &&
      matchesRange(car.price, minPrice, maxPrice) &&
      matchesRange(car.mileage, minMileage, maxMileage)
    );
  });

  return (
    <div className={styles.catalogResults}>
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
              name={`${car.brand} ${car.model}`}
              price={car.price}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>{query ? `No cars found for “${query}”` : "No cars found"}</p>

          {query && (
            <Link className={styles.emptyLink} href="/" scroll={false}>
              Reset search
            </Link>
          )}
        </div>
      )}
    </div>
  );
}