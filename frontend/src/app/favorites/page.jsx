"use client";

import CatalogCard from "@/components/CatalogCard/CatalogCard";
import styles from "./page.module.scss";
import useFavorites from "@/context/FavoritesContext";
import Link from "next/link";

export default function FavoritesPage() {
  const { favoritesArray } = useFavorites();

  return (
    <div className={styles.favoritesPage}>
      <div className="container">
        <h2 className={styles.title}>Saved Listings</h2>

        {favoritesArray.length === 0 ? (
          <div className={styles.emptyMessage}>
            <p>You have no saved listings yet</p>
            <Link className={styles.emptyButton} href="/catalog">Catalog</Link>
          </div>
        ) : (
          <div className="grid">
            {favoritesArray.map((car) => (
              <CatalogCard key={car.id} {...car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}