"use client";

import { useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import styles from "./HeaderField.module.scss";

export default function HeaderField({
  inputRef,
  onFocusChange,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("search") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);

  // Keep the input in sync when the URL changes (back/forward, reset links).
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setValue(urlQuery);
  }

  function goToCatalog(query) {
    if (pathname === "/") {
      // Keep the filters and sort; a new search starts from page 1.
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("search", query);
      else params.delete("search");
      params.delete("page");

      const next = params.toString();
      router.replace(next ? `/?${next}` : "/", { scroll: false });
      return;
    }

    // From any other page: open the home page right at the catalog. The
    // `search` param (even empty) tells the home page to skip the intro.
    router.push(`/?search=${encodeURIComponent(query)}#catalog`);
  }

  function handleSubmit(event) {
    event.preventDefault();

    inputRef.current?.blur();
    onFocusChange(false);

    goToCatalog(value.trim());
  }

  return (
    <form
      className={styles.headerField}
      onSubmit={handleSubmit}
      role="search"
    >
      <button type="submit" aria-label="Search">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="#17191B"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
        </svg>
      </button>

      <input
        ref={inputRef}
        type="search"
        placeholder="Search Cars"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        aria-label="Search cars"
      />
    </form>
  );
}