// Port of pylabeador's test_spanish_validation.py.

import { test } from "node:test";
import assert from "node:assert/strict";

import { checkWordForSpanishChars } from "../src/util.mjs";
import { HyphenatorError } from "../src/errors.mjs";

/** @type {[string, string | null][]} */
const CASES = [
  // Valid Spanish words - should not throw
  ["hola", null],
  ["tenacidad", null],
  ["niño", null],
  ["güero", null],
  ["Güero", null],
  ["GÜERO", null],
  ["güe", null],
  ["güi", null],
  ["pingüino", null],
  ["bilingüe", null],
  ["Bilingüe", null],
  ["BILINGÜE", null],
  // Invalid characters
  ["café@", "invalid letters"],
  ["word123", "invalid letters"],
  ["señor!", "invalid letters"],
  ["test&word", "invalid letters"],
  // Invalid ü usage
  ["müsica", "ü can only appear in güe or güi"],
  ["tü", "ü can only appear in güe or güi"],
  ["ürsula", "ü can only appear in güe or güi"],
  ["güa", "ü can only appear in güe or güi"],
  ["güo", "ü can only appear in güe or güi"],
  ["gü", "ü can only appear in güe or güi"],
  ["büggy", "ü can only appear in güe or güi"],
  // Empty or blank input
  ["", "empty"],
  [" ", "invalid letters"],
  ["  \t", "invalid letters"],
];

test("Spanish character validation", async (t) => {
  for (const [word, expectedErrorSubstring] of CASES) {
    await t.test(JSON.stringify(word), () => {
      if (expectedErrorSubstring === null) {
        checkWordForSpanishChars(word);
      } else {
        assert.throws(
          () => checkWordForSpanishChars(word),
          (err) => {
            assert.ok(err instanceof HyphenatorError);
            assert.ok(
              String(err.message).includes(expectedErrorSubstring),
              `expected "${expectedErrorSubstring}" in "${err.message}"`,
            );
            return true;
          },
        );
      }
    });
  }
});
