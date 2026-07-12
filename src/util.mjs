// Port of pylabeador's util.py (v0.9.0).
//
// jsilabeador is a derivative work of pylabeador, copyright (c) 2020
// Jacobo de Vera Hernández, licensed under the GNU General Public License
// version 3 or later. See COPYING.

import { HyphenatorError } from "./errors.mjs";

export const VOWELS = new Set("aáeéiíoóuúü");
export const CONSONANTS = new Set("bcdfghjklmnñpqrstvwxyz");
export const LETTERS = new Set([...VOWELS, ...CONSONANTS]);

// parity: pylabeador uses a sentinel default so that is_vowel('y') without
// context differs from is_vowel('y', None) with explicit end-of-word context.
const NOT_PASSED = "-N/A-";

/**
 * Check if a character is a vowel.
 * For 'y', uses context-aware detection when letterAfter is provided:
 * - 'y' acts as CONSONANT when followed by a vowel
 * - 'y' acts as VOWEL otherwise (including when followed by a consonant or
 *   at word boundaries, where letterAfter is null)
 *
 * @param {string | null} v
 * @param {string | null} [letterAfter]
 * @returns {boolean}
 */
export function isVowel(v, letterAfter = NOT_PASSED) {
  if (v === "y") {
    if (letterAfter === NOT_PASSED) {
      return false;
    }
    // parity: null (end of word) is not in VOWELS, so y is a vowel there
    return !VOWELS.has(/** @type {string} */ (letterAfter));
  }
  return VOWELS.has(/** @type {string} */ (v));
}

/**
 * Check if a word contains only valid Spanish characters.
 *
 * Some characters are valid in Spanish only in specific contexts, such as 'ü'
 * in 'güe' or 'güi'.
 *
 * @param {string} word
 * @returns {void}
 */
export function checkWordForSpanishChars(word) {
  if (!word) {
    throw new HyphenatorError("The word is empty");
  }
  const wordLower = word.toLowerCase();
  const badLetters = [...new Set(wordLower)].filter((c) => !LETTERS.has(c));
  if (badLetters.length > 0) {
    throw new HyphenatorError(`The word ${word} contains invalid letters in Spanish: ${badLetters.join(", ")}`);
  }
  if (wordLower.includes("ü")) {
    // parity: pylabeador only validates the first ü in the word
    const pos = wordLower.indexOf("ü");
    const followsG = pos > 0 && wordLower[pos - 1] === "g";
    const followedByEi = pos + 1 < wordLower.length && "eiéí".includes(wordLower[pos + 1]);
    if (!followsG || !followedByEi) {
      throw new HyphenatorError(`The word ${word} does not seem to be Spanish, where ü can only appear in güe or güi`);
    }
  }
}
