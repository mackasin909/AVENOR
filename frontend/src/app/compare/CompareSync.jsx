"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { compareStore } from "@/lib/localIdList";

// /compare without ?ids= → open the cars saved in this browser.
export default function CompareSync({ hasParam }) {
  const router = useRouter();
  const ids = compareStore.useIds();

  useEffect(() => {
    if (!hasParam && ids.length > 0) {
      router.replace(`/compare?ids=${ids.join(",")}`);
    }
  }, [hasParam, ids, router]);

  return null;
}
