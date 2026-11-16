"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/panel.module.scss";

const USER_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/my-listings", label: "My listings" },
  { href: "/my-listings/inquiries", label: "Inquiries" },
  { href: "/favorites", label: "Saved" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/cars", label: "All cars" },
  { href: "/admin/inquiries", label: "All inquiries" },
];

export default function AccountNav({ isAdmin = false }) {
  const pathname = usePathname();
  const links = isAdmin ? [...USER_LINKS, ...ADMIN_LINKS] : USER_LINKS;

  return (
    <nav className={styles.nav} aria-label="Account sections">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
