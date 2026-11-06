"use client";

import Link from "next/link";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import useFavorites from "@/context/FavoritesContext";
import styles from "./page.module.scss";

export default function FavoritesPage() {
  const { favoritesArray, clearFavorites, isLoaded } = useFavorites();

  if (!isLoaded) {
    return (
      <div className={styles.favoritesPage}>
        <div className="container" />
      </div>
    );
  }

  const hasFavorites = favoritesArray.length > 0;

  return (
    <div className={styles.favoritesPage}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>
            Saved Listings
            {hasFavorites && (
              <div className={styles.count}><p>{favoritesArray.length}</p></div>
            )}
          </h2>

          {hasFavorites && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFavorites}
            >
              Clear all
            </button>
          )}
        </div>

        {hasFavorites ? (
          <div className="grid">
            {favoritesArray.map((car) => (
              <CatalogCard key={car.id} {...car} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyMessage}>
            <p>You have no saved listings yet</p>
            <Link className={styles.emptyButton} href="/">
              Browse catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}