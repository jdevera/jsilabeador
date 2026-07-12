// Port of pylabeador's models.py (v0.9.0).
//
// jsilabeador is a derivative work of pylabeador, copyright (c) 2020
// Jacobo de Vera Hernández, licensed under the GNU General Public License
// version 3 or later. See COPYING.

import { isVowel } from "./util.mjs";

export class Syllable {
  /**
   * @param {string} [onset]
   * @param {string} [nucleus]
   * @param {string} [coda]
   * @param {boolean} [accented]
   * @param {boolean} [stressed]
   */
  constructor(onset = "", nucleus = "", coda = "", accented = false, stressed = false) {
    this.onset = onset;
    this.nucleus = nucleus;
    this.coda = coda;
    this.accented = accented;
    this.stressed = stressed;
  }

  /** @returns {string} */
  get value() {
    return `${this.onset}${this.nucleus}${this.coda}`;
  }
}

export class SyllabifiedWord {
  /**
   * @param {string} original
   * @param {Syllable[]} syllables
   * @param {number | null} [stressed] 0-based index of the stressed syllable
   * @param {number | null} [accented] 0-based character position of the tilde, or null
   */
  constructor(original, syllables, stressed = null, accented = null) {
    this.original = original;
    // parity: pylabeador stores a tuple in a frozen dataclass
    this.syllables = Object.freeze([...syllables]);
    this.stressed = stressed;
    this.accented = accented;
    Object.freeze(this);
  }

  /** @returns {string} */
  get hyphenated() {
    return this.syllables.map((s) => s.value).join("-");
  }

  /**
   * @param {boolean} [withStressed]
   * @returns {string}
   */
  hyphenate(withStressed = false) {
    /** @param {Syllable} s */
    const value = (s) => (!s.stressed || !withStressed ? s.value : `>${s.value}<`);
    return this.syllables.map(value).join("-");
  }
}

export class WordProgress {
  /**
   * @param {string} originalWord
   */
  constructor(originalWord) {
    this.originalWord = originalWord;
    this.pos = 0;
    /** @type {number | null} */
    this.accent = null;
    this.stressFound = false;
    /** @type {number | null} */
    this.stressed = null;
    /** @type {Syllable[]} */
    this.syllables = [];
    this.word = originalWord.toLowerCase();
    this.len = this.word.length;
  }

  /** @returns {string | null} */
  get char() {
    return this.word[this.pos] ?? null;
  }

  /** @returns {string | null} */
  get oneAhead() {
    return this.lookAhead(1);
  }

  /**
   * @param {number} [steps]
   * @returns {string | null}
   */
  lookAhead(steps = 1) {
    if (this.hasNext(steps)) {
      return this.word[this.pos + steps];
    }
    return null;
  }

  /** @returns {string | null} */
  get oneBehind() {
    return this.lookBehind(1);
  }

  /**
   * @param {number} [steps]
   * @returns {string | null}
   */
  lookBehind(steps = 1) {
    if (this.pos - steps >= 0) {
      return this.word[this.pos - steps];
    }
    return null;
  }

  /** @returns {boolean} */
  get ended() {
    return this.pos >= this.len;
  }

  /** @returns {boolean} */
  get atEnd() {
    return this.pos === this.len - 1;
  }

  /**
   * @param {number} [steps]
   * @returns {string | null}
   */
  next(steps = 1) {
    for (let i = 0; i < steps; i++) {
      if (!this.hasNext()) {
        this.pos = this.len;
        return null;
      }
      this.pos += 1;
    }
    return this.char;
  }

  /** @returns {string | null} */
  previous() {
    if (this.pos > 0) {
      this.pos -= 1;
      return this.char;
    }
    return null;
  }

  /**
   * @param {number} [steps]
   * @returns {boolean}
   */
  hasNext(steps = 1) {
    return this.pos + steps < this.len;
  }

  /**
   * Python-style indexing into the lowercased word (negative indices count
   * from the end). parity: mirrors WordProgress.__getitem__.
   * @param {number} index
   * @returns {string | undefined}
   */
  at(index) {
    return this.word.at(index);
  }

  /** @returns {Syllable} */
  addSyllable() {
    const syllable = new Syllable();
    this.syllables.push(syllable);
    return syllable;
  }

  /** @returns {Syllable | null} */
  get currentSyllable() {
    if (this.syllables.length > 0) {
      return this.syllables[this.syllables.length - 1];
    }
    return null;
  }

  /** @returns {SyllabifiedWord} */
  toResult() {
    if (!this.ended) {
      throw new Error("Word is not ended");
    }
    if (!this.stressFound) {
      throw new Error("Stress is not found");
    }
    return new SyllabifiedWord(this.originalWord, this.syllables, this.stressed, this.accent);
  }
}

export class VowelType {
  /**
   * @param {string} chars
   */
  constructor(chars) {
    this.chars = chars;
  }

  static OPEN = new VowelType("aeo");
  static OPEN_WITH_ACCENT = new VowelType("áéó");
  static CLOSED = new VowelType("iuü");
  static CLOSED_WITH_ACCENT = new VowelType("íú");

  /**
   * @param {string} c
   * @returns {VowelType}
   */
  static fromChar(c) {
    if (c.toLowerCase() === "y") {
      // 'y' when acting as vowel behaves like 'i' (closed vowel)
      return VowelType.CLOSED;
    }
    if (isVowel(c)) {
      for (const val of [
        VowelType.OPEN,
        VowelType.OPEN_WITH_ACCENT,
        VowelType.CLOSED,
        VowelType.CLOSED_WITH_ACCENT,
      ]) {
        if (val.chars.includes(c)) {
          return val;
        }
      }
    }
    throw new Error(`${c} is not a vowel`);
  }

  /** @returns {boolean} */
  get hasAccent() {
    return this === VowelType.OPEN_WITH_ACCENT || this === VowelType.CLOSED_WITH_ACCENT;
  }

  /** @returns {boolean} */
  get isClosed() {
    return this === VowelType.CLOSED || this === VowelType.CLOSED_WITH_ACCENT;
  }

  /** @returns {boolean} */
  get isOpen() {
    return this === VowelType.OPEN_WITH_ACCENT || this === VowelType.OPEN;
  }
}
