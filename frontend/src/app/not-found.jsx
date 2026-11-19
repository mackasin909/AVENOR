import Link from "next/link";
import styles from "@/styles/panel.module.scss";

export const metadata = {
  title: "Page not found — AVENOR",
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.notFound}>
          <p className={styles.notFoundCode}>404</p>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.muted}>
            The page or car you are looking for does not exist or is no
            longer listed.
          </p>
          <div className={styles.actions}>
            <Link href="/?search=#catalog" className={styles.ctaButton}>
              Browse catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
