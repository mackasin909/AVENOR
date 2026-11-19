import FilterPanel from "@/components/CatalogFilter/FilterPanel";
import { getCatalogFacets, searchCatalog } from "@/lib/cars";
import { parseCatalogParams } from "@/lib/catalogParams";
import CatalogResults from "./CatalogResults";
import styles from "./Catalog.module.scss";

export default async function Catalog({ searchParams }) {
  const params = (await searchParams) ?? {};
  const filters = parseCatalogParams(params);

  const [result, facets] = await Promise.all([
    searchCatalog(filters),
    getCatalogFacets(),
  ]);

  return (
    <div id="catalog" className={styles.catalog}>
      <div className="container">
        <div className={styles.catalogWrapper}>
          <FilterPanel
            cars={facets.cars}
            fuels={facets.fuels}
            priceBounds={facets.priceBounds}
            mileageBounds={facets.mileageBounds}
            yearBounds={facets.yearBounds}
          />

          <CatalogResults
            cars={result.cars}
            total={result.total}
            page={result.page}
            pageCount={result.pageCount}
            query={filters.search}
            correctedQuery={result.correctedQuery}
            sort={filters.sort}
            params={params}
          />
        </div>
      </div>
    </div>
  );
}
