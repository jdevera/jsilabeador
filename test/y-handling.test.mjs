// Port of pylabeador's test_y_handling.py.

import { test } from "node:test";
import assert from "node:assert/strict";

import { syllabifyWithDetails } from "../src/index.mjs";

/** @type {[string, string][]} */
const Y_BETWEEN_CONSONANTS = [
  ["bypass", "by-pass"],
  ["byte", "by-te"],
  ["byroniano", "by-ro-nia-no"],
  ["Tytonidae", "Ty-to-ni-da-e"],
];

/** @type {[string, string][]} */
const Y_AT_END_OF_WORD = [
  ["curry", "cu-rry"],
  ["muy", "muy"],
  ["estoy", "es-toy"],
];

/** @type {[string, string][]} */
const Y_COMPLEX_CASES = [
  ["coadyuvar", "co-ad-yu-var"],
  ["abyecto", "ab-yec-to"],
  ["adyacente", "ad-ya-cen-te"],
  ["ilyección", "il-yec-ción"],
  ["inyección", "in-yec-ción"],
  ["conyugal", "con-yu-gal"],
  ["enyugado", "en-yu-ga-do"],
  ["circunyacente", "cir-cun-ya-cen-te"],
  ["interyacente", "in-ter-ya-cen-te"],
  ["disyuntiva", "dis-yun-ti-va"],
  ["desyerbar", "des-yer-bar"],
];

/** @type {[string, number][]} */
const Y_STRESS = [
  ["caray", 1],
  ["estoy", 1],
  ["whisky", 0],
  ["curry", 0],
];

/**
 * @param {import("node:test").TestContext} t
 * @param {[string, string][]} cases
 */
async function assertHyphenations(t, cases) {
  for (const [word, expected] of cases) {
    await t.test(word, () => {
      assert.equal(syllabifyWithDetails(word).hyphenated, expected);
    });
  }
}

test("y between consonants acts as vowel", async (t) => {
  await assertHyphenations(t, Y_BETWEEN_CONSONANTS);
});

test("y at end of word acts as vowel", async (t) => {
  await assertHyphenations(t, Y_AT_END_OF_WORD);
});

test("y complex cases", async (t) => {
  await assertHyphenations(t, Y_COMPLEX_CASES);
});

test("y stress detection", async (t) => {
  for (const [word, expectedStressed] of Y_STRESS) {
    await t.test(word, () => {
      assert.equal(syllabifyWithDetails(word).stressed, expectedStressed);
    });
  }
});
