// Shared by the browser (HTML `pattern`) and the server, so both apply the
// same rule. Browsers compile `pattern` with the `v` RegExp flag, which
// requires `-` to be escaped inside character classes.
//
// Accepts: name@example.com, first.last+tag@mail.example.co
// Rejects: "abc", "a@b", "a@b.c", "a..b@x.com", ".a@x.com", "a@-x.com", "a b@x.com"
const LOCAL = String.raw`(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]{1,64}(?<!\.)`;
const LABEL = String.raw`[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?`;
const TLD = String.raw`[A-Za-z]{2,24}`;

export const EMAIL_PATTERN = `${LOCAL}@(?:${LABEL}\\.)+${TLD}`;
export const EMAIL_MAX_LENGTH = 254;

const EMAIL_RE = new RegExp(`^(?:${EMAIL_PATTERN})$`, "v");

export function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= EMAIL_MAX_LENGTH &&
    EMAIL_RE.test(value)
  );
}
