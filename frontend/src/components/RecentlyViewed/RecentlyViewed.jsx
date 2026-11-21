"use client";

import { useEffect, useState } from "react";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import { recentStore } from "@/lib/localIdList";
import styles from "./RecentlyViewed.module.scss";

// Cars this visitor opened recently (ids kept in localStorage).
export default function RecentlyViewed({ excludeId = null, limit = 4 }) {
  const ids = recentStore.useIds();
  const visibleIds = ids.filter((id) => id !== excludeId).slice(0, limit);
  const key = visibleIds.join(",");

  const [result, setResult] = useState({ key: "", cars: [] });

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();

    fetch(`/api/cars?ids=${key}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((cars) => setResult({ key, cars }))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, [key]);

  // Show only data that matches the current list.
  const cars = key && result.key === key ? result.cars : [];
  if (cars.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="recently-viewed-title">
      <div className="container">
        <h2 id="recently-viewed-title" className={styles.title}>
          Recently viewed
        </h2>

        <div className="grid">
          {cars.map((car) => (
            <CatalogCard
              key={car.id}
              id={car.id}
              name={car.name}
              year={car.year}
              price={car.price}
              priceOnRequest={car.priceOnRequest}
              isNew={car.isNew}
              location={car.location}
              images={car.images}
              className="col-3"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
