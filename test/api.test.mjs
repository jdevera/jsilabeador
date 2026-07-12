// Port of pylabeador's test_api.py.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as jsilabeador from "../src/index.mjs";

const { syllabify, syllabifyWithDetails, hyphenate, HyphenatorError } = jsilabeador;

test("empty word throws HyphenatorError", () => {
  assert.throws(() => syllabify(""), HyphenatorError);
});

test("words without vowels throw HyphenatorError", async (t) => {
  for (const word of ["b", "bcd"]) {
    await t.test(word, () => {
      assert.throws(() => syllabify(word), HyphenatorError);
    });
  }
});

test("error message is just the message", () => {
  try {
    syllabify("pm");
    assert.fail("expected HyphenatorError");
  } catch (err) {
    assert.ok(err instanceof HyphenatorError);
    assert.match(err.message, /no nucleus/);
    assert.ok(!err.message.includes("WordProgress"));
    // The word state is still available for debugging
    assert.ok(err.word !== null);
    assert.equal(err.word?.originalWord, "pm");
  }
});

test("syllabify", () => {
  assert.deepEqual(syllabify("tenacidad"), ["te", "na", "ci", "dad"]);
});

test("hyphenate", () => {
  assert.equal(hyphenate("tenacidad"), "te-na-ci-dad");
});

test("syllabifyWithDetails", () => {
  const res = syllabifyWithDetails("tenacidad");
  assert.equal(res.hyphenated, "te-na-ci-dad");
  assert.equal(res.stressed, 3);
  assert.equal(res.accented, null);
});

test("SyllabifiedWord is immutable", () => {
  const res = syllabifyWithDetails("tenacidad");
  assert.throws(() => {
    /** @type {any} */ (res).original = "otra";
  }, TypeError);
  assert.throws(() => {
    /** @type {any} */ (res.syllables).push(null);
  }, TypeError);
});

test("public API exports", () => {
  for (const name of ["syllabify", "syllabifyWithDetails", "hyphenate", "HyphenatorError"]) {
    assert.ok(name in jsilabeador, `missing export: ${name}`);
  }
});
