"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import FilterButton from "./FilterButton";
import FilterSelect from "./FilterSelect";
import PriceRange from "./PriceRange";
import styles from "./CatalogFilter.module.scss";
import { FILTER_KEYS } from "./filterKeys";

export default function FilterPanel({ cars = [], priceBounds, mileageBounds }) {
  const searchParams = useSearchParams();
  const [selectState, setSelectState] = useState(null);
  const [draft, setDraft] = useState(null);

  const filterParams = draft ?? searchParams;
  const brand = filterParams.get("brand") ?? "";
  const model = filterParams.get("model") ?? "";
  const country = filterParams.get("country") ?? "";

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

    const url = new URL(window.location.href);

    for (const key of FILTER_KEYS) {
      const value = draft.get(key);

      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    }

    if (url.href !== window.location.href) {
      window.history.replaceState(null, "", url.href);
    }

    setDraft(null);
    handleCloseSelect();
  }

  return (
    <aside className={styles.filter} aria-labelledby="catalog-filters-title">
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
      </div>

      {priceBounds && (
        <PriceRange
          min={priceBounds.min}
          max={priceBounds.max}
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
        disabled={!draft}
      >
        Apply filters
      </button>
    </aside>
  );
}