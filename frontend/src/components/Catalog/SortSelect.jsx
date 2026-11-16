"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_SORT, SORT_OPTIONS } from "@/lib/catalogParams";
import styles from "./Catalog.module.scss";

export default function SortSelect({ value }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const params = new URLSearchParams(searchParams.toString());
    const next = event.target.value;

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
    <label className={styles.sort}>
      <span className={styles.sortLabel}>Sort by</span>
      <span className={styles.sortSelect}>
        <select
          value={value}
          onChange={handleChange}
          disabled={isPending}
          aria-busy={isPending}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
          />
        </svg>
      </span>
    </label>
  );
}
