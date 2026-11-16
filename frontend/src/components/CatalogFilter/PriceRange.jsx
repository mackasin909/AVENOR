"use client";

import { useState } from "react";
import styles from "./CatalogFilter.module.scss";

const numberFormat = new Intl.NumberFormat("en-US");
const formatNumber = (value) => numberFormat.format(value);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readBound(params, name, fallback, min, max) {
  const rawValue = params.get(name);

  if (rawValue === null || rawValue.trim() === "") return fallback;

  const value = Number(rawValue);
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function RangeField({ label, value, prefix, format, onChange, onReset }) {
  const [draft, setDraft] = useState(null);

  function handleChange(event) {
    const text = event.target.value.replace(/\D/g, "");
    setDraft(text);

    if (text === "") {
      onReset();
      return;
    }

    const amount = Number(text);

    if (Number.isFinite(amount)) {
      onChange(amount);
    }
  }

  return (
    <div className={styles.priceField}>
      {prefix && <span aria-hidden="true">{prefix}</span>}

      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={draft ?? format(value)}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />

      <button
        type="button"
        aria-label={`Reset ${label.toLowerCase()}`}
        onClick={() => {
          setDraft(null);
          onReset();
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function PriceRange({
  min,
  max,
  title = "Price range",
  label = "price",
  prefix = "$",
  minName = "minPrice",
  maxName = "maxPrice",
  format = formatNumber,
  params,
  onChange,
}) {
  const low = readBound(params, minName, min, min, max);
  const high = readBound(params, maxName, max, low, max);

  function updateLow(value) {
    const nextLow = clamp(value, min, high);
    onChange(minName, nextLow === min ? null : nextLow);
  }

  function updateHigh(value) {
    const nextHigh = clamp(value, low, max);
    onChange(maxName, nextHigh === max ? null : nextHigh);
  }

  return (
    <fieldset className={styles.priceRange}>
      <p>{title}</p>

      <div className={styles.priceSliders}>
        <input
          type="range"
          aria-label={`Minimum ${label} slider`}
          min={min}
          max={max}
          value={low}
          disabled={min === max}
          onChange={(event) => updateLow(event.target.valueAsNumber)}
        />

        <input
          type="range"
          aria-label={`Maximum ${label} slider`}
          min={min}
          max={max}
          value={high}
          disabled={min === max}
          onChange={(event) => updateHigh(event.target.valueAsNumber)}
        />
      </div>

      <div className={styles.priceFields}>
        <RangeField
          label={`Minimum ${label}`}
          prefix={prefix}
          format={format}
          value={low}
          onChange={updateLow}
          onReset={() => onChange(minName, null)}
        />

        <RangeField
          label={`Maximum ${label}`}
          prefix={prefix}
          format={format}
          value={high}
          onChange={updateHigh}
          onReset={() => onChange(maxName, null)}
        />
      </div>
    </fieldset>
  );
}