import Link from "next/link";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import SortSelect from "./SortSelect";
import Pagination from "./Pagination";
import styles from "./Catalog.module.scss";

export default function CatalogResults({
  cars,
  total,
  page,
  pageCount,
  query,
  correctedQuery = null,
  sort,
  params,
}) {
  // Typos were fixed: show what was actually searched for.
  const shownQuery = correctedQuery ?? query;

  return (
    <div className={styles.catalogResults}>
      <div className={styles.resultsTop}>
        <div>
          <p className={styles.info}>
            {total} car{total === 1 ? "" : "s"}
            {shownQuery ? ` for “${shownQuery}”` : ""}
          </p>
          {correctedQuery && (
            <p className={styles.correction}>
              Showing results for <strong>{correctedQuery}</strong> instead of “{query}”
            </p>
          )}
        </div>

        <SortSelect value={sort} />
      </div>

      {cars.length > 0 ? (
        <>
          <div className="grid">
            {cars.map((car) => (
              <CatalogCard
                key={car.id}
                id={car.id}
                year={car.year}
                location={car.location}
                images={car.images}
                name={car.name}
                price={car.price}
                priceOnRequest={car.priceOnRequest}
                isNew={car.isNew}
              />
            ))}
          </div>

          <Pagination page={page} pageCount={pageCount} params={params} />
        </>
      ) : (
        <div className={styles.empty}>
          <p>{query ? `No cars found for “${query}”` : "No cars found"}</p>

          <Link className={styles.emptyLink} href="/#catalog" scroll={false}>
            Reset search and filters
          </Link>
        </div>
      )}
    </div>
  );
}
