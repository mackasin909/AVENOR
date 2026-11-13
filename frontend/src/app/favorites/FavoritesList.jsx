"use client";

import Link from "next/link";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import useFavorites from "@/context/FavoritesContext";
import useSession from "@/context/SessionContext";
import styles from "./page.module.scss";

export default function FavoritesList({ cars }) {
  const { user, openSign } = useSession();
  const { favoriteIds, clearFavorites } = useFavorites();

  // Hide cards the user un-saves on this page without waiting for a reload.
  const visibleCars = cars.filter((car) => favoriteIds.includes(car.id));
  const hasFavorites = visibleCars.length > 0;

  return (
    <div className={styles.favoritesPage}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>
            Saved Listings
            {hasFavorites && (
              <div className={styles.count}><p>{visibleCars.length}</p></div>
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

        {!user ? (
          <div className={styles.emptyMessage}>
            <p>Log in to see your saved listings</p>
            <button
              type="button"
              className={styles.emptyButton}
              onClick={openSign}
            >
              Log in
            </button>
          </div>
        ) : hasFavorites ? (
          <div className="grid">
            {visibleCars.map((car) => (
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
