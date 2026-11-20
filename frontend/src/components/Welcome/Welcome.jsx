"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Welcome.module.scss";

// Full-screen intro above the catalog. It works like a page of its own: any
// scroll that starts on it (wheel, swipe, keys, "start") carries the visitor
// all the way down to the catalog, and scrolling up from the top of the
// catalog carries them all the way back to the intro.
//
// `skip`: the visitor came to the catalog from a search on another page,
// so the intro is not shown. Once skipped it stays hidden for this visit.
export default function Welcome({ skip = false }) {
  const [skipped, setSkipped] = useState(skip);

  if (skip && !skipped) {
    setSkipped(true);
  }

  const welcomeRef = useRef(null);
  const goNextRef = useRef(() => {});

  useEffect(() => {
    // Without the intro, keep the browser's own scrolling (e.g. to #catalog).
    if (skipped) return;

    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    function scrollToTop() {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }

    scrollToTop();
    window.addEventListener("pageshow", scrollToTop);

    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("pageshow", scrollToTop);
    };
  }, [skipped]);

  useEffect(() => {
    if (skipped) return;

    const welcome = welcomeRef.current;
    if (!welcome) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Small margin so "at the top of the catalog" survives rounding.
    const EDGE = 4;

    let animationId = null;
    let animating = false;
    // After a snap, trackpad momentum keeps sending wheel events for a
    // moment; they are ignored until the input goes quiet.
    let settleUntil = 0;
    let settleTimer = null;
    let snapTimer = null;
    let lastY = window.scrollY;
    let direction = 0;
    let touchY = null;
    let touchDone = false;

    // Where the catalog starts (the intro is 100lvh, which can differ from
    // innerHeight on phones).
    const catalogTop = () => welcome.offsetTop + welcome.offsetHeight;
    const atIntro = () => window.scrollY <= EDGE;
    const atCatalogTop = () => Math.abs(window.scrollY - catalogTop()) <= EDGE;
    // From the intro down to the top of the catalog: the part that snaps.
    const inZone = () => window.scrollY < catalogTop() + EDGE;

    function updateAppearance() {
      const progress = Math.max(
        0,
        Math.min(1, -welcome.getBoundingClientRect().top / window.innerHeight)
      );
      welcome.style.setProperty("--exit", String(progress));
    }

    // The page background is dark while the intro is shown (globals.scss,
    // `html:has(#welcome:not([data-leaving]))`).
    function setLeaving(leaving) {
      if (leaving) welcome.dataset.leaving = "true";
      else delete welcome.dataset.leaving;
    }

    function settle() {
      settleUntil = performance.now() + 1200;
    }

    function isSettling() {
      return performance.now() < settleUntil;
    }

    function scrollTo(target) {
      if (animationId !== null) cancelAnimationFrame(animationId);
      clearTimeout(snapTimer);
      setLeaving(target > 0);

      const start = window.scrollY;
      if (Math.abs(target - start) < 1) return;

      if (reducedMotion.matches) {
        window.scrollTo({ top: target, behavior: "instant" });
        lastY = window.scrollY;
        settle();
        return;
      }

      animating = true;
      const startedAt = performance.now();
      const duration = 1000;

      function animate(now) {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased =
          progress < 0.5
            ? 4 * progress ** 3
            : 1 - (-2 * progress + 2) ** 3 / 2;

        window.scrollTo({
          top: start + (target - start) * eased,
          behavior: "instant",
        });

        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          animationId = null;
          animating = false;
          lastY = window.scrollY;
          settle();
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    const goDown = () => scrollTo(catalogTop());
    const goUp = () => scrollTo(0);

    goNextRef.current = () => {
      settleUntil = 0;
      goDown();
    };

    // Whether a scroll in `delta` direction is taken over here (the page
    // snaps instead of scrolling by itself).
    function handleIntent(delta) {
      if (!inZone() || delta === 0) return false;
      // Scrolling down from the top of the catalog is ordinary scrolling.
      if (delta > 0 && atCatalogTop()) return false;

      if (animating || isSettling()) return true;

      if (delta > 0) goDown();
      else if (!atIntro()) goUp();
      return true;
    }

    function onWheel(event) {
      if (event.ctrlKey) return; // pinch / ctrl+wheel zoom

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? Math.sign(event.deltaY) : 0;
      if (delta === 0 || !inZone() || (delta > 0 && atCatalogTop())) return;

      event.preventDefault();

      // Momentum after a snap: keep the page still and extend the pause
      // while the trackpad keeps sending events.
      if (isSettling()) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => (settleUntil = 0), 200);
        return;
      }

      handleIntent(delta);
    }

    function onKeyDown(event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable], [role=dialog]")
      ) {
        return;
      }
      // Space on a button or link presses it.
      if (event.key === " " && target instanceof HTMLElement && target.closest("button, a")) {
        return;
      }

      let delta = 0;
      if (["ArrowDown", "PageDown"].includes(event.key)) delta = 1;
      if (["ArrowUp", "PageUp"].includes(event.key)) delta = -1;
      if (event.key === " ") delta = event.shiftKey ? -1 : 1;

      if (delta === 0) return;
      // A key held down repeats: one snap per press.
      if (event.repeat && inZone() && !(delta > 0 && atCatalogTop())) {
        event.preventDefault();
        return;
      }
      settleUntil = 0;
      if (handleIntent(delta)) event.preventDefault();
    }

    function onTouchStart(event) {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
      touchDone = false;
    }

    function onTouchMove(event) {
      if (touchY === null || event.touches.length > 1) return; // pinch-zoom

      const moved = touchY - event.touches[0].clientY; // > 0: page goes down
      if (Math.abs(moved) < 6) return;

      const delta = Math.sign(moved);
      if (!inZone() || (delta > 0 && atCatalogTop())) return;

      // A swipe on the intro, or down from the catalog top: no native
      // panning (and no pull-to-refresh), one snap per swipe.
      event.preventDefault();
      if (!touchDone && Math.abs(moved) > 30) {
        touchDone = true;
        settleUntil = 0;
        handleIntent(delta);
      }
    }

    function onTouchEnd() {
      touchY = null;
      scheduleSnap();
    }

    // Anything else that stops half way (scrollbar, middle-click
    // autoscroll, Tab to a link, find in page) finishes in the direction it
    // was going once the scrolling stops.
    function scheduleSnap() {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        if (animating || touchY !== null) return;

        const y = window.scrollY;
        if (y <= EDGE || y >= catalogTop() - EDGE) return;

        if (direction > 0) goDown();
        else if (direction < 0) goUp();
        else if (y > catalogTop() / 2) goDown();
        else goUp();
      }, 150);
    }

    function onScroll() {
      updateAppearance();
      if (animating) return;

      const y = window.scrollY;
      if (y !== lastY) direction = Math.sign(y - lastY);
      lastY = y;
      setLeaving(y > EDGE);
      scheduleSnap();
    }

    const html = document.documentElement;
    const previousOverscroll = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";

    updateAppearance();
    setLeaving(window.scrollY > EDGE);

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateAppearance);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      clearTimeout(snapTimer);
      clearTimeout(settleTimer);

      goNextRef.current = () => {};
      html.style.overscrollBehaviorY = previousOverscroll;

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateAppearance);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [skipped]);

  if (skipped) return null;

  return (
    <section id="welcome" ref={welcomeRef} className={styles.welcome}>
      <div className={styles.content}>
        <div className={styles.car}>
          <img src="/images/welcome3.png" alt="" draggable={false} />
        </div>

        <div className={styles.block} aria-label="AVENOR">
          <img src="/images/logo-white.png" alt="" />
        </div>

        <p className={styles.tagline}>the art of driving</p>

        <button
          className={styles.welcomeButton}
          type="button"
          onClick={() => goNextRef.current()}
        >
          start
        </button>
      </div>
    </section>
  );
}
