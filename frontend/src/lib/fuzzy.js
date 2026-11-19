// Typo-tolerant search helpers (no dependencies).
//
// A query word that does not appear in any car is replaced by the closest
// word from the catalog's own vocabulary, e.g. "porhe" → "porsche",
// "lamborgini" → "lamborghini", "mersedes" → "mercedes".

// Words of the catalog (brand, model, location, …) in lower case.
export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2);
}

// How many typos a word of this length may contain.
function allowedEdits(length) {
  if (length <= 2) return 0;
  if (length <= 4) return 1;
  return 2;
}

// Damerau–Levenshtein distance (insert, delete, replace, swap two
// neighbours). Stops early once the distance is above `max`.
export function editDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous2 = null;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        previous[j] + 1, // delete
        current[j - 1] + 1, // insert
        previous[j - 1] + cost // replace
      );

      if (
        previous2 &&
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        value = Math.min(value, previous2[j - 2] + 1); // swap
      }

      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > max) return max + 1;
    previous2 = previous;
    previous = current;
  }

  return previous[b.length];
}

// Distance between a typed word and a catalog word; a typed word may also
// be the start of a longer word ("lambo" for "lamborghini"). Prefix matches
// cost half a point more, so a whole-word match wins a tie
// ("astom" → "aston", not "automatic").
function distanceTo(word, term, max) {
  const full = editDistance(word, term, max);
  if (term.length <= word.length) return full;

  const prefix = editDistance(word, term.slice(0, word.length), max) + 0.5;
  return Math.min(full, prefix);
}

// Returns the catalog words to search for instead of `word`:
// - [word] when it already appears in the vocabulary (no correction),
// - the closest catalog words when it is a typo,
// - [word] again when nothing is close (the search finds nothing).
export function correctWord(word, vocabulary) {
  if (/^\d+$/.test(word)) return { terms: [word], corrected: false };

  const alreadyPresent = vocabulary.some((term) => term.includes(word));
  if (alreadyPresent) return { terms: [word], corrected: false };

  const max = allowedEdits(word.length);
  if (max === 0) return { terms: [word], corrected: false };

  let best = max + 1;
  let matches = [];

  for (const term of vocabulary) {
    const distance = distanceTo(word, term, max);
    if (distance > max) continue;

    if (distance < best) {
      best = distance;
      matches = [term];
    } else if (distance === best) {
      matches.push(term);
    }
  }

  return matches.length > 0
    ? { terms: matches.slice(0, 5), corrected: true }
    : { terms: [word], corrected: false };
}
