// Shared loader for the spanish-hyphens.txt test corpus.
// Mirrors the parsing in pylabeador's test_hyphenation_and_stress.py.

import { readFileSync } from "node:fs";

/**
 * @typedef {{word: string, hyphenated: string, stressed: number, accentPos: number | null}} CorpusEntry
 */

/**
 * @returns {CorpusEntry[]}
 */
export function corpusEntries() {
  const path = new URL("./spanish-hyphens.txt", import.meta.url);
  const entries = [];
  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const [word, hyphenated, stressed, accent] = line.split(/\s+/);
    entries.push({
      word,
      hyphenated,
      stressed: Number(stressed),
      accentPos: accent === "-" ? null : Number(accent),
    });
  }
  return entries;
}
