"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";

import styles from "./Header.module.scss";
import HeaderField from "../HeaderField/HeaderField";
import useFavorites from "@/context/FavoritesContext";
import Sign from "../Sign/Sign";

export default function Header() {
  const { favoritesArray } = useFavorites();
  const pathname = usePathname();

  const searchRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [authState, setAuthState] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const favoriteLength = favoritesArray.length;
  const overlayVisible = authState || searchFocused;

  useEffect(() => {
    if (!overlayVisible) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevOverflow;
    };
  }, [overlayVisible]);

  const hidden =
    pathname === "/" &&
    welcomeVisible &&
    !overlayVisible;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function closeOverlay() {
    setAuthState(false);
    setSearchFocused(false);
    searchRef.current?.blur();
  }

  function toggleSign() {
    searchRef.current?.blur();
    setSearchFocused(false);
    setAuthState((previous) => !previous);
  }

  useEffect(() => {
    if (!overlayVisible) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAuthState(false);
        setSearchFocused(false);
        searchRef.current?.blur();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [overlayVisible]);

  return (
    <>
      <header
        className={`${styles.header} ${
          hidden ? styles.hidden : ""
        }`}
      >
        <div
          className={`${styles.overlay} ${
            overlayVisible ? styles.active : ""
          } ${authState ? styles.authOverlay : ""}`}
          onClick={closeOverlay}
          aria-hidden="true"
        />

        <div className="container">
          <div className={styles.headerWrapper}>
            <nav className={styles.headerNav}>
              <Link href="/">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className={styles.logo}
                />
              </Link>

              {/* <ul className={styles.headerList}>
                <li className={styles.headerItem}>
                  <Link
                    href="/catalog"
                    className={styles.headerLink}
                  >
                    catalog
                  </Link>
                </li>
              </ul> */}
            </nav>

            <Suspense fallback={null}>
              <HeaderField
                inputRef={searchRef}
                onFocusChange={setSearchFocused}
              />
            </Suspense>

            <div className={styles.headerIcons}>
              <Link
                href="/favorites"
                className={styles.headerIcon}
                aria-label="Favorites"
              >
                {favoriteLength > 0 && (
                  <p>{favoriteLength}</p>
                )}

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#17191B"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143q.09.083.176.171a3 3 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={toggleSign}
                className={styles.headerIcon}
                aria-label="Open sign up"
                aria-expanded={authState}
                aria-controls="sign-dialog"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#17191B"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                  <path
                    fillRule="evenodd"
                    d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mounted &&
        createPortal(
          <Sign
            authState={authState}
            setAuthState={setAuthState}
          />,
          document.body
        )}
    </>
  );
}