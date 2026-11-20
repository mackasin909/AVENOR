"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import styles from "./RouteLoader.module.scss";

// Shortest time the screen stays up, so a fast page does not just flash.
const MIN_VISIBLE_MS = 450;
// If a page never arrives (offline, error), stop covering the site.
const MAX_VISIBLE_MS = 8000;

// Whether a click on this link opens another page of the site in this tab.
function isPageLink(event, link) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (!link.href || link.hasAttribute("download")) return false;
  if (link.target && link.target !== "_self") return false;

  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page with other filters / a #section: no page change.
  return url.pathname !== window.location.pathname;
}

// Dark screen with the white AVENOR logo, shown while a page loads: on the
// first visit until the site is ready, and on every move to another page
// until that page has rendered.
export default function RouteLoader() {
  const pathname = usePathname();
  // Visible in the server HTML, so it covers the first load from the start.
  const [visible, setVisible] = useState(true);
  const shownAt = useRef(0);
  const hideTimer = useRef(null);
  const maxTimer = useRef(null);
  // The page on screen (the URL changes before it on Back / Forward).
  const shownPath = useRef(pathname);

  function show() {
    clearTimeout(hideTimer.current);
    clearTimeout(maxTimer.current);
    shownAt.current = performance.now();
    setVisible(true);
    maxTimer.current = setTimeout(() => setVisible(false), MAX_VISIBLE_MS);
  }

  function hide() {
    clearTimeout(hideTimer.current);
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt.current));
    hideTimer.current = setTimeout(() => {
      clearTimeout(maxTimer.current);
      setVisible(false);
    }, wait);
  }

  // First load: lift the screen once the page and its images are in.
  useEffect(() => {
    const ready = () => hide();
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });

    maxTimer.current = setTimeout(() => setVisible(false), MAX_VISIBLE_MS);
    return () => window.removeEventListener("load", ready);
  }, []);

  // A link to another page was clicked, or Back / Forward was pressed.
  useEffect(() => {
    function onClick(event) {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link && isPageLink(event, link)) show();
    }

    // The URL has already changed here; the page shown is still the old one.
    function onPopState() {
      if (window.location.pathname !== shownPath.current) show();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // The new page has rendered.
  useEffect(() => {
    if (pathname === shownPath.current) return;
    shownPath.current = pathname;
    hide();
  }, [pathname]);

  useEffect(
    () => () => {
      clearTimeout(hideTimer.current);
      clearTimeout(maxTimer.current);
    },
    []
  );

  return (
    <div
      className={styles.loader}
      data-visible={visible ? true : undefined}
      aria-hidden="true"
    >
      <Image
        src="/images/mini-logo-white.png"
        alt=""
        width={120}
        height={120}
        priority
        className={styles.logo}
      />
    </div>
  );
}
