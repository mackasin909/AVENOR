"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Header.module.scss";
import Link from "next/link";
import HeaderField from "../HeaderField/HeaderField";
import useFavorites from "@/context/FavoritesContext";

export default function Header() {
  const { favoritesArray } = useFavorites()

  const pathname = usePathname();
  const [welcomeVisible, setWelcomeVisible] = useState(true);

  const favoriteLength = favoritesArray.length

  useEffect(() => {
    const welcome = document.getElementById("welcome");

    if (!welcome) {
      setWelcomeVisible(false);
      return;
    }

    function update() {
      setWelcomeVisible(
        welcome.getBoundingClientRect().bottom > 1
      );
    }

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  const hidden = pathname === "/" && welcomeVisible;

  return (
    <header
      className={`${styles.header} ${hidden ? styles.hidden : ""}`}
    >
      <div className="container">
        <div className={styles.headerWrapper}>
          <nav className={styles.headerNav}>
            <Link href="/">
              <img src="/images/logo.png" alt="" className={styles.logo} />
            </Link>
            <ul className={styles.headerList}>
              <li className={styles.headerItem}>
                <Link href="/catalog" className={styles.headerLink}>catalog</Link>
              </li>
            </ul>
          </nav>
          <HeaderField />
          <div className={styles.headerIcons}>
            <Link href="/favorites" className={styles.headerIcon}>
              {favoriteLength == 0 ? null : (<p>{favoriteLength}</p>)}
              <svg xmlns="http://www.w3.org/2000/svg" fill="#17191B" className="bi bi-heart" viewBox="0 0 16 16">
                <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"/>
              </svg>
            </Link>
            <button className={styles.headerIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="#17191B" className="bi bi-person-circle" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}