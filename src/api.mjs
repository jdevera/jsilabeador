// Port of pylabeador's api.py (v0.9.0).
//
// jsilabeador is a derivative work of pylabeador, copyright (c) 2020
// Jacobo de Vera Hernández, licensed under the GNU General Public License
// version 3 or later. See COPYING.

import { parseWord } from "./engine.mjs";
import { checkWordForSpanishChars } from "./util.mjs";

/**
 * Syllabify a word and provide detailed information about the syllable structure.
 *
 * @param {string} word The word to syllabify.
 * @returns {import("./models.mjs").SyllabifiedWord} The syllable structure with
 *   stress and accent information.
 *
 * @example
 * syllabifyWithDetails("encuentro").hyphenated
 * // => "en-cuen-tro"
 */
export function syllabifyWithDetails(word) {
  // Note: pylabeador does not normalize; NFC is an identity transform for
  // already-composed Spanish text, so parity holds for NFC input.
  word = word.normalize("NFC");
  checkWordForSpanishChars(word);
  return parseWord(word).toResult();
}

/**
 * Syllabify a word and return the syllables as a list of strings.
 *
 * @param {string} word The word to syllabify.
 * @returns {string[]} The syllables of the word.
 *
 * @example
 * syllabify("encuentro")
 * // => ["en", "cuen", "tro"]
 */
export function syllabify(word) {
  const res = syllabifyWithDetails(word);
  return res.syllables.map((syl) => syl.value);
}

/**
 * Syllabify a word and return the hyphenated word as a string.
 *
 * @param {string} word The word to syllabify.
 * @returns {string} The hyphenated word.
 *
 * @example
 * hyphenate("encuentro")
 * // => "en-cuen-tro"
 */
export function hyphenate(word) {
  return syllabifyWithDetails(word).hyphenated;
}
