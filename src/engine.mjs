// Port of pylabeador's engine.py (v0.9.0).
//
// This is a fidelity port: control flow mirrors the Python line by line so
// that fixes can be diffed across the two implementations. Where behavior
// looks surprising, it is replicated on purpose and marked with a
// "parity:" comment.
//
// jsilabeador is a derivative work of pylabeador, copyright (c) 2020
// Jacobo de Vera Hernández, and of the C++ syllabifier by TIP: Text &
// Information Processing (http://tip.dis.ulpgc.es), copyright (C) 2009.
// Licensed under the GNU General Public License version 3 or later.
// See COPYING.

import { HyphenatorError } from "./errors.mjs";
import { VowelType, WordProgress } from "./models.mjs";
import { CONSONANTS, isVowel } from "./util.mjs";

const CONSONANTS_BAR_Y = new Set([...CONSONANTS].filter((c) => c !== "y"));

/**
 * @param {string} word
 * @returns {WordProgress}
 */
export function parseWord(word) {
  const wordProgress = new WordProgress(word);

  while (!wordProgress.ended) {
    const syllable = wordProgress.addSyllable();
    const startPos = wordProgress.pos;

    // All initial consonants belong to the onset (in the case of y, only the first)
    syllable.onset = onset(wordProgress);
    syllable.nucleus = nucleus(wordProgress);
    syllable.coda = coda(wordProgress);

    const endPos = wordProgress.pos;
    syllable.accented =
      wordProgress.accent !== null && startPos <= wordProgress.accent && wordProgress.accent < endPos;

    const numSyl = wordProgress.syllables.length;
    if (wordProgress.stressFound && wordProgress.stressed === null) {
      wordProgress.stressed = numSyl - 1;
    }
  }

  wordProgress.stressed = findStressedSyllable(wordProgress);
  wordProgress.syllables[wordProgress.stressed].stressed = true;
  wordProgress.stressFound = true;
  return wordProgress;
}

/**
 * @param {WordProgress} wordProgress
 * @returns {number}
 */
export function findStressedSyllable(wordProgress) {
  /** @type {number} */
  let stressed;
  if (wordProgress.stressFound) {
    if (wordProgress.stressed === null) {
      throw new Error("Stressed syllable is not set for accented word");
    }
    return wordProgress.stressed;
  }
  // If the word does not have a graphical accent, then find the stressed
  // syllable according to the Spanish rules
  const numSyl = wordProgress.syllables.length;
  // If the word has only one syllable, that's the one!
  if (numSyl === 1) {
    stressed = numSyl - 1;
  } else {
    const end = /** @type {string} */ (wordProgress.at(-1));
    const prev = /** @type {string} */ (wordProgress.at(-2));
    if (end === "y") {
      // When the word ends in y, it is treated as a vowel, unless it is preceded by a vowel
      if (isVowel(prev, end)) {
        // y is preceded by a vowel, so it is treated as a consonant
        stressed = numSyl - 1;
      } else {
        // y is preceded by a consonant, so it is treated as a vowel
        stressed = numSyl - 2;
      }
    } else if (isVowel(end) || ("ns".includes(end) && isVowel(prev))) {
      // Ends in vowel or n or s (y is treated as consonant for stress rules)
      stressed = numSyl - 2;
    } else {
      stressed = numSyl - 1;
    }
  }
  return stressed;
}

/**
 * Wrap a positional scan so it returns the slice of the ORIGINAL word
 * (case preserved) that the scan covered.
 * parity: mirrors pylabeador's return_section decorator.
 *
 * @param {(word: WordProgress) => void} f
 * @returns {(word: WordProgress) => string}
 */
function returnSection(f) {
  return function wrapped(word) {
    const initialPos = word.pos;
    f(word);
    const finalPos = word.pos;
    return word.originalWord.slice(initialPos, finalPos);
  };
}

export const onset = returnSection(
  /** @param {WordProgress} word */
  function onset(word) {
    while (!word.ended && CONSONANTS_BAR_Y.has(/** @type {string} */ (word.char))) {
      word.next();
    }

    if (!word.ended && word.oneBehind !== null) {
      const lastTwo = word.oneBehind + word.char;
      // parity: pylabeador does str(word.one_ahead), so a null lookahead
      // becomes a non-matching string rather than an error
      if (lastTwo === "qu" || (lastTwo === "gu" && "eiéí".includes(String(word.oneAhead)))) {
        // qu is always in the onset
        // gu is only in the onset if it is followed by i or e
        word.next();
      } else if (lastTwo === "gü") {
        // not gu
        // gü is always in the onset
        word.next();
      }
    }
  },
);

export const nucleus = returnSection(
  /** @param {WordProgress} word */
  function nucleus(word) {
    const startPos = word.pos;

    if (word.ended) {
      // The onset consumed the rest of the word: there is no vowel left for a nucleus
      throw new HyphenatorError("Syllable has no nucleus. Perhaps the word has no vowels?", word);
    }

    if (word.char === "y") {
      // Check if 'y' should be treated as vowel in this context
      if (isVowel(word.char, word.oneAhead)) {
        // 'y' is acting as vowel, continue with normal vowel processing
      } else {
        // 'y' is acting as consonant, move past it
        word.next();
      }
    }

    if (word.ended) {
      return;
    }

    if (!isVowel(word.char, word.oneAhead)) {
      throw new HyphenatorError("Nucleus expects a vowel!", word);
    }

    const vowelType = VowelType.fromChar(/** @type {string} */ (word.char));
    if (vowelType.hasAccent) {
      word.accent = word.pos;
      word.stressFound = true;
    }
    word.next();

    if (vowelType === VowelType.CLOSED_WITH_ACCENT) {
      // An accented closed vowel breaks a possible diphthong
      return;
    }

    // An h in the nucleus is not enough to determine whether this is a diphtong, and thus we need to
    // continue in the nucleus, like in prohi-bir, or it is a new syllable, like in a-ho-ra.
    const foundH = word.char === "h";
    if (foundH) {
      word.next();
    }

    if (word.ended) {
      return;
    }

    // If we have not moved forward, it might mean we have strange characters in the word
    if (startPos === word.pos) {
      throw new HyphenatorError("Expected to move forward in first stage of nucleus. Perhaps invalid chars?", word);
    }

    const previous = vowelType;

    if (!isVowel(word.char, word.oneAhead)) {
      return;
    }

    // Second vowel:
    const secondVowel = VowelType.fromChar(/** @type {string} */ (word.char));
    if (secondVowel.isOpen) {
      if (previous.isOpen) {
        // Two open vowels can't form a syllable
        if (foundH) {
          word.previous();
        }
        return;
      }

      // The previous is closed
      if (secondVowel.hasAccent) {
        word.accent = word.pos;
        word.stressFound = true;
      }
      word.next();
    } else if (secondVowel === VowelType.CLOSED_WITH_ACCENT) {
      // Closed-vowel with written accent, can't be a triphthong, but could be a diphthong
      word.accent = word.pos;
      if (previous.isClosed) {
        // diphthong
        word.stressFound = true;
        word.next();
      } else if (foundH) {
        word.previous();
      }
      return;
    } else if (secondVowel === VowelType.CLOSED) {
      // Closed vowel
      if (word.oneAhead !== null && isVowel(word.oneAhead, word.lookAhead(2))) {
        // Vowel - Closed vowel - vowel can never be a triphthong. This syllable is over, and the currently evaluated
        // second vowel belongs to the next syllable
        if (foundH) {
          word.previous();
          // The current letter was a weak vowel, it was followed by a vowel
          // and preceded by an h, so we go back 1 char.
        }
        return;
      }

      if (word.char !== word.oneBehind) {
        // Can only be diphthong if the closed vowels are different
        word.next();
      }

      return; // Decendent diphthong
    }

    // Third vowel?
    if (word.ended) {
      return;
    }

    if (word.char !== null && "ui".includes(word.char)) {
      word.next(); // Tripthong
    }

    // Special case: 'y' at the end of a word is treated as a consonant
    if (word.char === "y" && word.atEnd) {
      word.next();
    }
  },
);

export const coda = returnSection(
  /** @param {WordProgress} word */
  function coda(word) {
    if (word.ended || isVowel(word.char, word.oneAhead)) {
      return; // No coda
    }

    // If we are at the end of the word, advance the pointer to the end position and bail out. The current consonant was
    // the coda.
    if (word.atEnd) {
      // End of word
      word.next();
      return;
    }

    // If there is only a consonant between vowels, it belongs to the following syllable
    // If the next letter is a vowel, then this consonant is not part of the coda
    if (word.hasNext() && isVowel(word.oneAhead, word.lookAhead(2))) {
      return;
    }

    // Current and next are consonants and are at the word, that looks like coda, except if the second is a y, which
    // acts like a vowel and then we'd have a case like above: one consonant between vowels.
    if (word.pos >= word.len - 2) {
      if (word.oneAhead !== "y") {
        // The word ends with 2 consonants
        word.next(2);
      }
      return;
    }

    // At this point we know that we have more than two letters until the end of the word
    const c1 = /** @type {string} */ (word.char);
    const c2 = /** @type {string} */ (word.lookAhead(1));
    const c3 = /** @type {string} */ (word.lookAhead(2));

    if (isVowel(c3, word.lookAhead(3))) {
      const digraph = c1 + c2;
      // ll, ch, and rr start a new syllable
      if (digraph === "ll" || digraph === "ch" || digraph === "rr") {
        return;
      }

      // cons + h starts a syllable, except sh and rh
      if (!"sr".includes(c1) && c2 === "h") {
        return;
      }

      // Handle 'y' based on whether it's acting as vowel or consonant
      if (c2 === "y") {
        // Use context-aware detection to see if y is vowel or consonant
        if (isVowel("y", word.lookAhead(2))) {
          // y is vowel - follows standard consonant+vowel rule (consonant goes to next syllable)
          return;
        }
        // y is consonant - move to y to start next syllable
        word.next(); // move the pointer to the y
        return;
      }

      // prettier-ignore
      if ([
        "gl", "cl", "kl", "bl", "vl", "pl", "fl", "tl",
        "gr", "cr", "kr", "br", "vr", "pr", "fr", "tr", "dr",
      ].includes(digraph)) {
        return;
      }

      word.next();
    } else {
      // 3rd consonant
      if (word.pos >= word.len - 3) {
        // The word ends with 3 consonants
        if (c2 === "y") {
          // Use context-aware detection
          if (isVowel("y", word.lookAhead(2))) {
            // y is vowel - previous consonant can stay as coda
            return;
          }
          // y is consonant - handle like other consonants
        }

        if (c3 === "y") {
          word.next();
        } else {
          word.next(3); // The word ends with 3 consonants
        }
        return;
      }

      // This is not the end of the word - handle y based on context
      if (c2 === "y") {
        // Use context-aware detection
        if (isVowel("y", word.lookAhead(2))) {
          // y is vowel - previous consonant goes to next syllable (standard rule)
          word.next();
          return;
        }
        // y is consonant - fall through to standard consonant cluster logic
      }

      // The groups pt, ct, cn, ps, mn, gn, ft, pn, cz, tz and ts begin a syllable
      // when preceded by other consonant
      if (["pt", "ct", "cn", "ps", "mn", "gn", "ft", "pn", "cz", "tz", "ts"].includes(c2 + c3)) {
        word.next();
        return;
      }

      // The consonant groups formed by a consonant following the letter l or r cannot be
      // separated and they always begin a new syllable.
      // y as a vowel starts a new syllable
      // ch starts a new syllable
      if ("lry".includes(c3) || c2 + c3 === "ch") {
        word.next(); // The next syllable starts in c2
      } else {
        word.next(2); // The next syllable starts in c3
      }
    }
  },
);
