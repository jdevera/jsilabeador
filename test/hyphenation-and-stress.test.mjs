// Port of pylabeador's test_hyphenation_and_stress.py: the data-driven corpus
// plus its inline special-words list.

import { test } from "node:test";
import assert from "node:assert/strict";

import { syllabifyWithDetails } from "../src/index.mjs";
import { corpusEntries } from "./corpus.mjs";

/**
 * @param {string} word
 * @param {string} hyphenated
 * @param {number} stressed
 * @param {number | null} accentPos
 */
function assertWord(word, hyphenated, stressed, accentPos) {
  const res = syllabifyWithDetails(word);
  assert.equal(res.hyphenated, hyphenated);
  assert.equal(res.stressed, stressed);
  assert.equal(res.accented, accentPos);
}

test("hyphenation of common words", async (t) => {
  for (const { word, hyphenated, stressed, accentPos } of corpusEntries()) {
    await t.test(word, () => {
      assertWord(word, hyphenated, stressed, accentPos);
    });
  }
});

/** @type {[string, string, number, number | null][]} */
const SPECIAL_WORDS = [
  ["Actuáis", "Ac-tuáis", 1, 4],
  ["Construcción", "Cons-truc-ción", 2, 10],
  ["Melón", "Me-lón", 1, 3],
  ["Desagüe", "De-sa-güe", 1, null],
  ["fugu", "fu-gu", 0, null],
  ["paraguay", "pa-ra-guay", 2, null],
  ["paraguayo", "pa-ra-gua-yo", 2, null],
];

test("special words", async (t) => {
  for (const [word, hyphenated, stressed, accentPos] of SPECIAL_WORDS) {
    await t.test(word, () => {
      assertWord(word, hyphenated, stressed, accentPos);
    });
  }
});
