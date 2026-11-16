import Link from "next/link";
import styles from "./Catalog.module.scss";

function hrefFor(params, page) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "page") continue;
    for (const item of [].concat(value)) {
      if (typeof item === "string") search.append(key, item);
    }
  }

  if (page > 1) search.set("page", String(page));

  const query = search.toString();
  return `/${query ? `?${query}` : ""}#catalog`;
}

// 1 … 4 5 [6] 7 8 … 20
function pageList(page, pageCount) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  const result = [];
  for (const value of sorted) {
    const previous = result.at(-1);
    if (typeof previous === "number" && value - previous > 1) result.push("gap");
    result.push(value);
  }
  return result;
}

export default function Pagination({ page, pageCount, params }) {
  if (pageCount <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Catalog pages">
      {page > 1 ? (
        <Link href={hrefFor(params, page - 1)} rel="prev">
          ← Prev
        </Link>
      ) : (
        <span aria-hidden="true" className={styles.pageDisabled}>← Prev</span>
      )}

      {pageList(page, pageCount).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className={styles.pageGap}>…</span>
        ) : (
          <Link
            key={item}
            href={hrefFor(params, item)}
            aria-current={item === page ? "page" : undefined}
            className={item === page ? styles.pageActive : undefined}
          >
            {item}
          </Link>
        )
      )}

      {page < pageCount ? (
        <Link href={hrefFor(params, page + 1)} rel="next">
          Next →
        </Link>
      ) : (
        <span aria-hidden="true" className={styles.pageDisabled}>Next →</span>
      )}
    </nav>
  );
}
