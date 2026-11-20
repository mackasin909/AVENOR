// Phone numbers, shared by the browser (PhoneInput) and the server.
// Stored as E.164 digits without "+", e.g. "77011234567".
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js";

export const DEFAULT_COUNTRY = "US";

// [{ code: "KZ", dial: "7", name: "Kazakhstan" }, …] sorted by name.
export function getCountryOptions(locale = "en") {
  let names = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    // Old browsers: show the ISO code instead of the name.
  }

  return getCountries()
    .map((code) => ({
      code,
      dial: getCountryCallingCode(code),
      name: names?.of(code) ?? code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

// Valid number → E.164 digits without "+", otherwise null.
// Accepts "+7 701 123 45 67", "77011234567", etc. (always with the country code).
export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;

  const number = parsePhoneNumberFromString(`+${digits}`);
  return number?.isValid() ? number.number.slice(1) : null;
}

// Country and national digits of a stored number, for editing.
export function splitPhone(stored, fallbackCountry = DEFAULT_COUNTRY) {
  const digits = String(stored ?? "").replace(/\D/g, "");
  const number = digits ? parsePhoneNumberFromString(`+${digits}`) : null;

  if (number?.country) {
    return { country: number.country, national: number.nationalNumber };
  }
  return { country: fallbackCountry, national: "" };
}

// "+7 701 123 4567" for display.
export function formatPhone(stored) {
  const digits = String(stored ?? "").replace(/\D/g, "");
  const number = digits ? parsePhoneNumberFromString(`+${digits}`) : null;
  return number ? number.formatInternational() : digits ? `+${digits}` : "";
}

// Formats national digits as they are typed ("7011234567" → "701 123 4567").
export function formatNational(digits, country) {
  return digits ? new AsYouType(country).input(digits) : "";
}

// Whether these national digits can still be (part of) a number of the
// country: no digit may follow once the number is already complete and
// valid ("701 123 4567" in Kazakhstan), and never more than the longest
// number the country has.
export function fitsCountry(digits, country) {
  for (let length = 1; length <= digits.length; length += 1) {
    const check = validatePhoneNumberLength(digits.slice(0, length), country);
    if (check === "TOO_LONG") return false;

    const previous = digits.slice(0, length - 1);
    if (
      check === "INVALID_LENGTH" &&
      previous &&
      isValidPhoneNumber(previous, country)
    ) {
      return false;
    }
  }
  return true;
}

// A pasted international number ("+7 701…") → { country, national } or null.
export function parseInternational(text) {
  const number = parsePhoneNumberFromString(text);
  return number?.country
    ? { country: number.country, national: number.nationalNumber }
    : null;
}
