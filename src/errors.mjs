// Port of pylabeador's errors.py (v0.9.0).
//
// jsilabeador is a derivative work of pylabeador, copyright (c) 2020
// Jacobo de Vera Hernández, licensed under the GNU General Public License
// version 3 or later. See COPYING.

/**
 * Error during syllabification.
 *
 * The in-progress word state, when available, is kept in `word` for debugging
 * but stays out of the message shown to users.
 */
export class HyphenatorError extends Error {
  /**
   * @param {string} message
   * @param {import("./models.mjs").WordProgress | null} [word]
   */
  constructor(message, word = null) {
    super(message);
    this.name = "HyphenatorError";
    this.word = word;
  }
}
