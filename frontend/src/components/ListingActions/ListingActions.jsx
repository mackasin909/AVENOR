"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { deleteCar, setCarStatus } from "@/app/actions/cars";
import styles from "@/styles/panel.module.scss";

const small = (className) => `${className} ${styles.buttonSmall}`;

export default function ListingActions({ car, editHref, isAdmin = false }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  function run(task, successMessage) {
    startTransition(async () => {
      let result;
      try {
        result = await task();
      } catch (error) {
        // Network or server failure: a message instead of an error page.
        console.error(error);
        result = { ok: false, error: "Something went wrong, please try again" };
      }
      if (result?.ok) {
        toast.success(successMessage);
        setRejecting(false);
      } else {
        toast.error(result?.error ?? "Something went wrong");
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete ${car.name}? This cannot be undone.`)) return;
    run(() => deleteCar(car.id), "Listing deleted");
  }

  return (
    <div className={styles.actions}>
      <Link href={`/car/${car.id}`} className={small(styles.buttonSecondary)}>
        View
      </Link>
      <Link href={editHref} className={small(styles.buttonSecondary)}>
        Edit
      </Link>

      {isAdmin && car.status !== "approved" && (
        <button
          type="button"
          className={small(styles.button)}
          disabled={pending}
          onClick={() => run(() => setCarStatus(car.id, "approved"), "Listing approved")}
        >
          Approve
        </button>
      )}

      {isAdmin && car.status !== "rejected" && !rejecting && (
        <button
          type="button"
          className={small(styles.buttonSecondary)}
          disabled={pending}
          onClick={() => setRejecting(true)}
        >
          Reject
        </button>
      )}

      {rejecting && (
        <form
          className={styles.inlineForm}
          onSubmit={(event) => {
            event.preventDefault();
            run(() => setCarStatus(car.id, "rejected", note), "Listing rejected");
          }}
        >
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason for the seller"
            aria-label="Reason for rejection"
            maxLength={500}
          />
          <button type="submit" className={small(styles.buttonDanger)} disabled={pending}>
            Reject
          </button>
          <button
            type="button"
            className={small(styles.buttonSecondary)}
            onClick={() => setRejecting(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <button
        type="button"
        className={small(styles.buttonDanger)}
        disabled={pending}
        onClick={handleDelete}
      >
        Delete
      </button>
    </div>
  );
}
