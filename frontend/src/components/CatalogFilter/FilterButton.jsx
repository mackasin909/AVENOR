"use client";

import { useSearchParams } from "next/navigation";
import styles from "./CatalogFilter.module.scss";

const FILTER_KEYS = [
  "brand", "model", "country",
  "minPrice", "maxPrice", "minMileage", "maxMileage",
  "minYear", "maxYear", "fuel", "sort",
];

export default function FilterButton() {
  const searchParams = useSearchParams();
  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  return (
    <h4 id="catalog-filters-title" className={styles.filterTitle}>
      Filters{activeCount > 0 && ` (${activeCount})`}
    </h4>
  );
}