"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./Welcome.module.scss";

// `skip`: the visitor came to the catalog from a search on another page,
// so the intro is not shown. Once skipped it stays hidden for this visit.
export default function Welcome({ skip = false }) {
  const [finished, setFinished] = useState(false);
  const [skipped, setSkipped] = useState(skip);

  if (skip && !skipped) {
    setSkipped(true);
  }

  const done = finished || skipped;

  const welcomeRef = useRef(null);
  const goNextRef = useRef(() => {});

  useLayoutEffect(() => {
    if (finished) {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [finished]);

  useEffect(() => {
    // Without the intro, keep the browser's own scrolling (e.g. to #catalog).
    if (skipped) return;

    const previousRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    function scrollToTop() {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }

    scrollToTop();
    window.addEventListener("pageshow", scrollToTop);

    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("pageshow", scrollToTop);
    };
  }, [skipped]);

  useEffect(() => {
    if (done) return;

    const welcome = welcomeRef.current;
    if (!welcome) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let scrolling = false;
    let animationId = null;

    function updateAppearance() {
      const progress = Math.max(
        0,
        Math.min(
          1,
          -welcome.getBoundingClientRect().top / window.innerHeight
        )
      );

      welcome.style.setProperty("--exit", String(progress));
    }

    function goNext() {
      if (scrolling || window.scrollY > 5) return;

      const start = window.scrollY;
      const target = window.innerHeight;

      if (reducedMotion.matches) {
        setFinished(true)
        return;
      }

      scrolling = true;

      const startedAt = performance.now();
      const duration = 1000;

      function animate(now) {
        const progress = Math.min(
          1,
          (now - startedAt) / duration
        );

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
          scrolling = false;
          animationId = null;
          setFinished(true)
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    function onWheel(event) {
        if (event.ctrlKey) return;

        if (window.scrollY <= 5 || scrolling) {
            event.preventDefault();
        }
    }

    function onKeyDown(event) {
        const target = event.target;

        // Не мешаем вводу в полях.
        if (
            target instanceof HTMLElement &&
            target.closest("input, textarea, select, [contenteditable]")
        ) {
            return;
        }

        const scrollKeys = [
            "ArrowDown",
            "ArrowUp",
            "PageDown",
            "PageUp",
            "Home",
            "End",
            " ",
        ];

        if (
            event.key === " " &&
            target instanceof HTMLElement &&
            target.closest("button")
        ) {
            return;
        }

        if (
            scrollKeys.includes(event.key) &&
            (window.scrollY <= 5 || scrolling)
        ) {
            event.preventDefault();
        }
    }

    // Phones: no swiping past the intro (or pull-to-refresh / bounce);
    // the visitor continues with the "start" button.
    function onTouchMove(event) {
      if (event.touches.length > 1) return; // keep pinch-zoom

      if (window.scrollY <= 5 || scrolling) {
        event.preventDefault();
      }
    }

    const html = document.documentElement;
    const previousOverscroll = html.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";

    goNextRef.current = goNext;

    updateAppearance();

    window.addEventListener("wheel", onWheel, {
      passive: false,
    });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
    });
    window.addEventListener("scroll", updateAppearance, {
      passive: true,
    });
    window.addEventListener("resize", updateAppearance);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }

      goNextRef.current = () => {};
      html.style.overscrollBehaviorY = previousOverscroll;

      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", updateAppearance);
      window.removeEventListener("resize", updateAppearance);
    };
  }, [done]);

  if (done) return null;

  return (
    <section id="welcome" ref={welcomeRef} className={styles.welcome}>
      <div className={styles.content}>
        <div className={styles.car}>
          <img
            src="/images/welcome3.png"
            alt=""
            draggable={false}
          />
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