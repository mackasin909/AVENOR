"use client";

import { toast } from "react-toastify";
import { MAX_COMPARE, compareStore } from "@/lib/localIdList";

export default function CompareButton({ carId, className }) {
  const ids = compareStore.useIds();
  const selected = ids.includes(carId);

  function handleClick() {
    if (selected) {
      compareStore.remove(carId);
      return;
    }

    if (!compareStore.add(carId)) {
      toast.info(`You can compare up to ${MAX_COMPARE} cars`);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-pressed={selected}
    >
      {selected ? "Comparing" : "Compare"}
    </button>
  );
}
