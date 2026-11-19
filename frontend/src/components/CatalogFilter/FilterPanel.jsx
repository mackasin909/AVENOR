"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterButton from "./FilterButton";
import FilterSelect from "./FilterSelect";
import PriceRange from "./PriceRange";
import styles from "./CatalogFilter.module.scss";
import { FILTER_KEYS } from "./filterKeys";

const formatYear = (value) => String(value);

export default function FilterPanel({
  cars = [],
  fuels = [],
  priceBounds,
  mileageBounds,
  yearBounds,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectState, setSelectState] = useState(null);
  const [draft, setDraft] = useState(null);
  // Tablets and phones: the panel is folded behind a "Filters" button
  // (CSS shows it open on wider screens regardless).
  const [isExpanded, setIsExpanded] = useState(false);
  const activeCount = FILTER_KEYS.filter((key) => searchParams.get(key)).length;

  const filterParams = draft ?? searchParams;
  const brand = filterParams.get("brand") ?? "";
  const model = filterParams.get("model") ?? "";
  const country = filterParams.get("country") ?? "";
  const fuel = filterParams.get("fuel") ?? "";

  const brands = [...new Set(cars.map((car) => car.brand))];
  const models = [
    ...new Set(
      cars.filter((car) => car.brand === brand).map((car) => car.model)
    ),
  ];
  const countries = [...new Set(cars.map((car) => car.country))].sort();

  function handleToggle(name) {
    setSelectState((current) => (current === name ? null : name));
  }

  function handleCloseSelect() {
    setSelectState(null);
  }

  function updateFilter(name, value) {
    setDraft((current) => {
      const params = new URLSearchParams((current ?? searchParams).toString());
      const nextValue = value === null ? "" : String(value);

      if (name === "brand" && nextValue !== (params.get("brand") ?? "")) {
        params.delete("model");
      }

      if (nextValue === "") {
        params.delete(name);
      } else {
        params.set(name, nextValue);
      }

      return params;
    });

    handleCloseSelect();
  }

  function handleClearAll() {
    setDraft((current) => {
      const params = new URLSearchParams((current ?? searchParams).toString());

      for (const key of FILTER_KEYS) {
        params.delete(key);
      }

      return params;
    });

    handleCloseSelect();
  }

  function handleApplyFilters() {
    if (!draft) return;

    const params = new URLSearchParams(searchParams.toString());

    for (const key of FILTER_KEYS) {
      const value = draft.get(key);

      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    // New filters start from the first page.
    params.delete("page");

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });

    setDraft(null);
    handleCloseSelect();
    setIsExpanded(false);
  }

  return (
    <aside className={styles.filter} aria-labelledby="catalog-filters-title">
      <button
        type="button"
        className={styles.filterToggle}
        aria-expanded={isExpanded}
        aria-controls="catalog-filters-body"
        onClick={() => setIsExpanded((open) => !open)}
      >
        <span>
          Filters{activeCount > 0 && ` (${activeCount})`}
        </span>
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
          />
        </svg>
      </button>

      <div
        id="catalog-filters-body"
        className={styles.filterBody}
        data-open={isExpanded}
      >
        <div className={styles.filterTop}>
          <FilterButton />

          <button type="button" onClick={handleClearAll}>
            Clear All
          </button>
        </div>

        <div className={styles.filterSelect}>
          <p>Make &amp; Model</p>

          <FilterSelect
            placeholder="All Makes"
            options={brands}
            value={brand}
            isOpen={selectState === "brand"}
            onToggle={() => handleToggle("brand")}
            onSelect={(value) => updateFilter("brand", value)}
            onClose={handleCloseSelect}
          />

          {brand && (
            <FilterSelect
              placeholder="All Models"
              options={models}
              value={model}
              isOpen={selectState === "model"}
              onToggle={() => handleToggle("model")}
              onSelect={(value) => updateFilter("model", value)}
              onClose={handleCloseSelect}
            />
          )}

          <p>Country</p>

          <FilterSelect
            placeholder="All Countries"
            options={countries}
            value={country}
            isOpen={selectState === "country"}
            onToggle={() => handleToggle("country")}
            onSelect={(value) => updateFilter("country", value)}
            onClose={handleCloseSelect}
          />

          <p>Fuel type</p>

          <FilterSelect
            placeholder="Any fuel"
            options={fuels}
            value={fuel}
            isOpen={selectState === "fuel"}
            onToggle={() => handleToggle("fuel")}
            onSelect={(value) => updateFilter("fuel", value)}
            onClose={handleCloseSelect}
          />
        </div>

        {priceBounds && (
          <PriceRange
            min={priceBounds.min}
            max={priceBounds.max}
            params={filterParams}
            onChange={updateFilter}
          />
        )}

        {yearBounds && (
          <PriceRange
            min={yearBounds.min}
            max={yearBounds.max}
            title="Year"
            label="year"
            prefix=""
            minName="minYear"
            maxName="maxYear"
            format={formatYear}
            params={filterParams}
            onChange={updateFilter}
          />
        )}

        {mileageBounds && (
          <PriceRange
            min={mileageBounds.min}
            max={mileageBounds.max}
            title="Mileage"
            label="mileage"
            prefix=""
            minName="minMileage"
            maxName="maxMileage"
            params={filterParams}
            onChange={updateFilter}
          />
        )}

        <button
          type="button"
          className={styles.applyButton}
          onClick={handleApplyFilters}
          disabled={!draft || isPending}
        >
          {isPending ? "Applying…" : "Apply filters"}
        </button>
      </div>
    </aside>
  );
}
