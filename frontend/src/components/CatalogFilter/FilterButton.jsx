"use client";

import { useSearchParams } from "next/navigation";
import styles from "./CatalogFilter.module.scss";
import { FILTER_KEYS } from "./filterKeys";

export default function FilterButton() {
  const searchParams = useSearchParams();
  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  return (
    <h4 id="catalog-filters-title" className={styles.filterTitle}>
      Filters{activeCount > 0 && ` (${activeCount})`}
    </h4>
  );
}