"use client";

import styles from "./CatalogFilter.module.scss";
import { useEffect, useId, useRef } from "react";

export default function FilterSelect({
  placeholder,
  options = [],
  value,
  isOpen,
  onToggle,
  onSelect,
  onClose
}) {
  const optionsId = useId();

  const selectRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event) {
      if (!selectRef.current?.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={selectRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        className={styles.selectButton}
        style={{ width: "100%" }}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={optionsId}
      >
        {value || placeholder}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
          />
        </svg>
      </button>

      <div
        id={optionsId}
        className={
          isOpen
            ? `${styles.selectOptions} ${styles.selectOptionsActive}`
            : styles.selectOptions
        }
        style={{
          zIndex: 1,
          backgroundColor: "var(--background, #fff)",
        }}
      >
        {["", ...options].map((option, index) => (
          <div key={option}>
            {index > 0 && <hr />}

            <button
              type="button"
              className={styles.selectOption}
              style={{
                border: 0,
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
              }}
              aria-pressed={option === value}
              onClick={() => onSelect(option)}
            >
              {option || placeholder}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}