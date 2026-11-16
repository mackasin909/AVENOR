"use client";

import { useSyncExternalStore } from "react";
import { MAX_COMPARE } from "@/lib/compareLimits";

export { MAX_COMPARE };

const EMPTY = [];

// A list of car ids kept in this browser's localStorage, shared by every
// component that uses it and synced across tabs. Used for "compare" and
// "recently viewed" (per-visitor conveniences that need no account).
export function createIdListStore(key, maxLength) {
  const listeners = new Set();
  let cache = null;

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      return Array.isArray(saved)
        ? saved.filter((id) => Number.isInteger(id) && id > 0).slice(0, maxLength)
        : EMPTY;
    } catch {
      return EMPTY;
    }
  }

  function getSnapshot() {
    if (cache === null) cache = read();
    return cache;
  }

  function write(ids) {
    cache = ids;
    try {
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // Storage may be unavailable (private mode); keep the in-memory list.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);

    function handleStorage(event) {
      if (event.key === key) {
        cache = null;
        listener();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }

  return {
    useIds() {
      return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
    },
    getIds: getSnapshot,
    set(ids) {
      write([...new Set(ids)].slice(0, maxLength));
    },
    // Moves the id to the front (most recent first).
    push(id) {
      write([id, ...getSnapshot().filter((item) => item !== id)].slice(0, maxLength));
    },
    // Adds to the end; returns false when the list is full.
    add(id) {
      const ids = getSnapshot();
      if (ids.includes(id)) return true;
      if (ids.length >= maxLength) return false;
      write([...ids, id]);
      return true;
    },
    remove(id) {
      write(getSnapshot().filter((item) => item !== id));
    },
    clear() {
      write(EMPTY);
    },
  };
}


export const compareStore = createIdListStore("avenor-compare", MAX_COMPARE);
export const recentStore = createIdListStore("avenor-recent", 12);
