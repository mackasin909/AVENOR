"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_COUNTRY,
  formatNational,
  getCountryOptions,
  fitsCountry,
  normalizePhone,
  parseInternational,
  splitPhone,
} from "@/lib/phone";
import styles from "./PhoneInput.module.scss";

const subscribeNoop = () => () => {};

// Country from the browser language ("ru-KZ" → "KZ"), if we know its code.
function guessCountry(options) {
  if (typeof navigator === "undefined") return DEFAULT_COUNTRY;

  for (const language of navigator.languages ?? [navigator.language]) {
    try {
      const region = new Intl.Locale(language).maximize().region;
      if (region && options.some((option) => option.code === region)) return region;
    } catch {
      // Unknown locale string: try the next one.
    }
  }
  return DEFAULT_COUNTRY;
}

// Country code picker + number field. Only digits can be typed, and no more
// than the chosen country's numbers have. The form receives `name` as
// "+<country code><number>" (e.g. "+77011234567").
//
// `defaultValue`: a stored number (E.164 digits) to edit.
// `guessDefault`: pick the country from the browser language (client-only
// forms such as the sign-in dialog; server-rendered ones keep the default).
export default function PhoneInput({
  id,
  name = "phone",
  defaultValue = "",
  guessDefault = false,
  required = true,
  className = "",
}) {
  const options = useMemo(() => getCountryOptions(), []);
  // Country names come from the runtime's own language data, which differs
  // between the server and the browser ("Falkland Islands" vs "Falkland
  // Islands (Islas Malvinas)"). The server HTML and the first browser render
  // show ISO codes; the names follow right after.
  const showNames = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const listed = useMemo(
    () =>
      showNames
        ? options
        : [...options].sort((a, b) => (a.code < b.code ? -1 : 1)),
    [options, showNames]
  );

  const [phone, setPhone] = useState(() => {
    if (defaultValue) return splitPhone(defaultValue);
    return {
      country: guessDefault ? guessCountry(options) : DEFAULT_COUNTRY,
      national: "",
    };
  });
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  const { country, national } = phone;
  const selected = options.find((option) => option.code === country) ?? options[0];
  const full = national ? `+${selected.dial}${national}` : "";
  const isValid = national === "" || normalizePhone(full) !== null;
  const error = isValid ? "" : `Enter a valid ${selected.name} phone number`;

  // Lets the browser block the submit with our message.
  useEffect(() => {
    inputRef.current?.setCustomValidity(error);
  }, [error]);

  function handleInput(event) {
    const text = event.target.value;

    // A pasted international number picks its country by itself.
    if (text.trim().startsWith("+")) {
      const parsed = parseInternational(text);
      if (parsed) {
        setPhone(parsed);
        return;
      }
    }

    // Extra digits are dropped: a typed one is ignored, a pasted number is
    // cut to the length the country allows.
    let digits = text.replace(/\D/g, "");
    while (digits && !fitsCountry(digits, country)) digits = digits.slice(0, -1);
    setPhone({ country, national: digits });
  }

  function handleCountry(event) {
    const next = event.target.value;
    // Keep the digits if they still fit the new country.
    setPhone({ country: next, national: fitsCountry(national, next) ? national : "" });
  }

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div className={styles.phone} data-invalid={touched && !isValid ? true : undefined}>
        <label className={styles.country}>
          <span aria-hidden="true">
            {selected.code} +{selected.dial}
          </span>
          <select
            value={country}
            onChange={handleCountry}
            aria-label="Country code"
          >
            {listed.map((option) => (
              <option key={option.code} value={option.code}>
                {showNames ? option.name : option.code} (+{option.dial})
              </option>
            ))}
          </select>
        </label>

        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Phone number"
          value={formatNational(national, country)}
          onChange={handleInput}
          onBlur={() => setTouched(true)}
          required={required}
          aria-invalid={touched && !isValid ? true : undefined}
        />
      </div>

      <input type="hidden" name={name} value={full} />
      {/* The digits as typed, to find accounts saved before country codes. */}
      <input type="hidden" name={`${name}National`} value={national} />

      {touched && error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
