"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const element = document.querySelector("[data-page-content]");
    if (!element) return;

    const animation = element.animate(
        [{ opacity: 0.25 }, { opacity: 1 }],
        {
        duration: 900,
        easing: "cubic-bezier(0.25, 1, 0.25, 1)",
        fill: "both",
        }
    );

    return () => animation.cancel();
}, [pathname]);

  return children;
}