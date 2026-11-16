"use client";

import { useEffect } from "react";
import { recentStore } from "@/lib/localIdList";

// Remembers that this car page was opened.
export default function RecordView({ carId }) {
  useEffect(() => {
    recentStore.push(carId);
  }, [carId]);

  return null;
}
