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
  sort,
  params,
}) {
  return (
    <div className={styles.catalogResults}>
      <div className={styles.resultsTop}>
        <p className={styles.info}>
          {total} car{total === 1 ? "" : "s"}
          {query ? ` for “${query}”` : ""}
        </p>

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
