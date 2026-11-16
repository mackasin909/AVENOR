"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { compareStore } from "@/lib/localIdList";
import styles from "./Compare.module.scss";

// Floating shortcut to the compare page while cars are selected.
export default function CompareBar() {
  const ids = compareStore.useIds();
  const pathname = usePathname();

  if (ids.length === 0 || pathname === "/compare") return null;

  return (
    <div className={styles.bar}>
      <Link href={`/compare?ids=${ids.join(",")}`}>
        Compare ({ids.length}) →
      </Link>
      <button
        type="button"
        aria-label="Clear comparison"
        onClick={() => compareStore.clear()}
      >
        ×
      </button>
    </div>
  );
}
