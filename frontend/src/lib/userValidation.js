// Account field rules shared by sign up and the account page.

export const USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const USERNAME_ERROR = "Username must be 3–32 characters: letters, digits, _ . -";
export const PHONE_ERROR = "Enter a valid phone number";
export const PASSWORD_ERROR = `Password must be at least ${PASSWORD_MIN} characters`;

// Digits only, 7–15 long (E.164 without "+"), or null.
export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export function isValidUsername(value) {
  return USERNAME_RE.test(String(value ?? ""));
}

export function isValidPassword(value) {
  const password = String(value ?? "");
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX;
}
