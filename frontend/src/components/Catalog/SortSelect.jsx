"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterSelect from "@/components/CatalogFilter/FilterSelect";
import { DEFAULT_SORT, SORT_OPTIONS } from "@/lib/catalogParams";
import styles from "./Catalog.module.scss";

// Same dropdown as the filter panel selects.
export default function SortSelect({ value }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  function handleSelect(next) {
    setIsOpen(false);
    if (next === value) return;

    const params = new URLSearchParams(searchParams.toString());

    if (next === DEFAULT_SORT) {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    params.delete("page");

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className={styles.sort} aria-busy={isPending}>
      <span className={styles.sortLabel}>Sort by</span>

      <div className={styles.sortSelect}>
        <FilterSelect
          placeholder="Sort"
          options={SORT_OPTIONS}
          value={value}
          includeEmpty={false}
          isOpen={isOpen}
          onToggle={() => setIsOpen((open) => !open)}
          onSelect={handleSelect}
          onClose={close}
        />
      </div>
    </div>
  );
}
