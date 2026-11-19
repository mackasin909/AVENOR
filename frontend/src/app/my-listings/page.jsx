import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getManagedCars } from "@/lib/cars";
import AccountNav from "@/components/AccountNav/AccountNav";
import ListingsTable from "@/components/ListingsTable/ListingsTable";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";

export const metadata = {
  title: "My listings — AVENOR",
};

export default async function MyListingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginPrompt title="My listings" text="Log in to sell your car" />;
  }

  const cars = await getManagedCars({ ownerId: user.id });

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>My listings</h1>
          <Link href="/my-listings/new" className={styles.pillButton}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Sell a car
          </Link>
        </div>

        <AccountNav isAdmin={user.role === "admin"} />

        <p className={styles.muted}>
          New listings and edits are checked by our team before they appear in
          the catalog.
        </p>
        <br />

        {cars.length > 0 ? (
          <ListingsTable cars={cars} editBase="/my-listings" />
        ) : (
          <div className={styles.empty}>
            <p>You have no listings yet.</p>
            <br />
            <Link href="/my-listings/new" className={styles.ctaButton}>
              List your first car
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
