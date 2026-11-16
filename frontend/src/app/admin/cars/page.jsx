import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getManagedCars } from "@/lib/cars";
import ListingsTable from "@/components/ListingsTable/ListingsTable";
import styles from "@/styles/panel.module.scss";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminCarsPage({ searchParams }) {
  if (!(await requireAdmin())) notFound();

  const { status: rawStatus } = (await searchParams) ?? {};
  const status = FILTERS.some((filter) => filter.value === rawStatus) ? rawStatus : "";
  const cars = await getManagedCars({ status: status || undefined });

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>All cars</h1>
        <Link href="/admin/cars/new" className={styles.button}>
          Add a car
        </Link>
      </div>

      <nav className={styles.nav} aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/admin/cars?status=${filter.value}` : "/admin/cars"}
            aria-current={status === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {cars.length > 0 ? (
        <ListingsTable cars={cars} isAdmin editBase="/admin/cars" />
      ) : (
        <p className={styles.empty}>No cars here.</p>
      )}
    </>
  );
}
