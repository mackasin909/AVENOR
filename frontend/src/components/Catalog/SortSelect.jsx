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
      <span>Sort by</span>
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
    </label>
  );
}
