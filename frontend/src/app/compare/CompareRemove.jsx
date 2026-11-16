"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { compareStore } from "@/lib/localIdList";
import panel from "@/styles/panel.module.scss";

export default function CompareRemove({ carId }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick() {
    compareStore.remove(carId);

    const remaining = String(searchParams.get("ids") ?? "")
      .split(",")
      .map(Number)
      .filter((id) => id !== carId && Number.isInteger(id) && id > 0);

    router.replace(`/compare?ids=${remaining.join(",")}`, { scroll: false });
  }

  return (
    <button
      type="button"
      className={`${panel.buttonSecondary} ${panel.buttonSmall}`}
      onClick={handleClick}
    >
      Remove
    </button>
  );
}
