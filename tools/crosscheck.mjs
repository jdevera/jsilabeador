// Cross-validation harness: run pylabeador (Python, the oracle) and
// jsilabeador over every word in the test corpus and diff the FULL
// structure - every syllable's onset/nucleus/coda/accented/stressed plus
// the word-level stressed/accented. The bar is 100% agreement.
//
// Usage: node tools/crosscheck.mjs
// Env:   CROSSCHECK_PYTHON  python command to use (default: python3)

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { syllabifyWithDetails } from "../src/index.mjs";
import { HyphenatorError } from "../src/errors.mjs";
import { corpusEntries } from "../test/corpus.mjs";

/**
 * @typedef {{onset: string, nucleus: string, coda: string, accented: boolean, stressed: boolean}} SyllableShape
 * @typedef {{word: string, ok: true, syllables: SyllableShape[], stressed: number | null, accented: number | null} |
 *           {word: string, ok: false, error: string}} Description
 */

/**
 * @param {string} word
 * @returns {Description}
 */
function describeJs(word) {
  try {
    const res = syllabifyWithDetails(word);
    return {
      word,
      ok: true,
      syllables: res.syllables.map((s) => ({
        onset: s.onset,
        nucleus: s.nucleus,
        coda: s.coda,
        accented: s.accented,
        stressed: s.stressed,
      })),
      stressed: res.stressed,
      accented: res.accented,
    };
  } catch (err) {
    if (err instanceof HyphenatorError) {
      return { word, ok: false, error: String(err.message) };
    }
    throw err;
  }
}

const words = corpusEntries().map((e) => e.word);

const python = process.env.CROSSCHECK_PYTHON ?? "python3";
const helper = fileURLToPath(new URL("./crosscheck.py", import.meta.url));
const proc = spawnSync(python, [helper], {
  input: words.join("\n"),
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (proc.status !== 0) {
  console.error(proc.stderr);
  console.error(`crosscheck: python oracle failed (exit ${proc.status})`);
  process.exit(2);
}

/** @type {Description[]} */
const pyResults = proc.stdout
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));

if (pyResults.length !== words.length) {
  console.error(`crosscheck: expected ${words.length} oracle results, got ${pyResults.length}`);
  process.exit(2);
}

let mismatches = 0;
const MAX_REPORTED = 20;

for (let i = 0; i < words.length; i++) {
  const py = pyResults[i];
  const js = describeJs(words[i]);
  // Compare success/failure and, on success, the full structure. Error
  // messages are not compared: only that both sides reject the word.
  const pyCmp = py.ok ? py : { word: py.word, ok: false };
  const jsCmp = js.ok ? js : { word: js.word, ok: false };
  if (JSON.stringify(pyCmp) !== JSON.stringify(jsCmp)) {
    mismatches++;
    if (mismatches <= MAX_REPORTED) {
      console.error(`MISMATCH ${words[i]}`);
      console.error(`  py: ${JSON.stringify(py)}`);
      console.error(`  js: ${JSON.stringify(js)}`);
    }
  }
}

if (mismatches > 0) {
  console.error(`crosscheck: ${mismatches}/${words.length} words disagree`);
  process.exit(1);
}
console.log(`crosscheck: ${words.length} words, full structural agreement with pylabeador`);
