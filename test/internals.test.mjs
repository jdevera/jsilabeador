// Port of pylabeador's test_internals.py, test_bits.py, and test_wordprogress.py.

import { test } from "node:test";
import assert from "node:assert/strict";

import { onset, nucleus, parseWord } from "../src/engine.mjs";
import { WordProgress } from "../src/models.mjs";
import { isVowel } from "../src/util.mjs";

test("onset", () => {
  const w = new WordProgress("queso");
  assert.equal(onset(w), "qu");
  w.pos = 3;
  assert.equal(onset(w), "s");
});

test("nucleus", () => {
  let w = new WordProgress("tras");
  assert.equal(onset(w), "tr");
  assert.equal(nucleus(w), "a");

  w = new WordProgress("huesca");
  assert.equal(onset(w), "h");
  assert.equal(nucleus(w), "ue");
});

test("uncommon nucleus: paraguay", () => {
  const result = parseWord("paraguay");
  const hyphenated = result.syllables.map((s) => s.value).join("-");
  assert.equal(hyphenated, "pa-ra-guay");
  // Third syllable (1-based in the Python test), nucleus 'uay'
  assert.equal(result.syllables[2].nucleus, "uay");
});

test("is_vowel basics (test_bits)", () => {
  assert.equal(isVowel("a"), true);
  assert.equal(isVowel("ó"), true);
  assert.equal(isVowel("b"), false);
  assert.equal(isVowel(null), false);
});

/**
 * Mirrors do_test_is_y_vowel: find the y in the word and check its
 * vowel-ness given the following letter.
 * @param {string} word
 * @param {boolean} expected
 */
function assertIsYVowel(word, expected) {
  const yPos = word.indexOf("y");
  assert.notEqual(yPos, -1);
  const charAfter = yPos < word.length - 1 ? word[yPos + 1] : null;
  assert.equal(isVowel("y", charAfter), expected);
}

test("y vowel-ness by context", async (t) => {
  /** @type {[string, boolean][]} */
  const cases = [
    // y between consonants is a vowel
    ["bypass", true],
    ["byte", true],
    // y at word end is a vowel
    ["curry", true],
    ["muy", true],
    ["estoy", true],
    // y followed by a vowel is a consonant
    ["mayor", false],
    ["ayer", false],
    ["payaso", false],
    ["yeso", false],
    ["playa", false],
    ["cónyuge", false],
  ];
  for (const [word, expected] of cases) {
    await t.test(word, () => {
      assertIsYVowel(word, expected);
    });
  }
});

test("y without context is a consonant (backward compatibility)", () => {
  assert.equal(isVowel("y"), false);
});

test("regular vowels and consonants without context", () => {
  for (const c of "aeiou") {
    assert.equal(isVowel(c), true);
  }
  for (const c of "bc") {
    assert.equal(isVowel(c), false);
  }
});

test("WordProgress end behavior", () => {
  const w = new WordProgress("radio");
  w.pos = 3;
  assert.equal(w.char, "i");
  assert.equal(w.next(), "o");
  assert.equal(w.char, "o");
  assert.equal(w.ended, false);
  assert.equal(w.oneAhead, null);
});

test("WordProgress lookahead", () => {
  const w = new WordProgress("que");
  assert.equal(w.char, "q");
  assert.equal(w.oneAhead, "u");
  w.next();
  assert.equal(w.char, "u");
  assert.equal(w.oneAhead, "e");
});
