#!/usr/bin/env python3
"""Oracle side of the jsilabeador crosscheck.

Reads words from stdin (one per line) and writes one JSON object per line
with the full pylabeador structure, or the error it raised.
"""

import json
import sys

import pylabeador


def describe(word: str) -> dict:
    try:
        res = pylabeador.syllabify_with_details(word)
    except pylabeador.HyphenatorError as e:
        return {"word": word, "ok": False, "error": str(e)}
    return {
        "word": word,
        "ok": True,
        "syllables": [
            {
                "onset": s.onset,
                "nucleus": s.nucleus,
                "coda": s.coda,
                "accented": s.accented,
                "stressed": s.stressed,
            }
            for s in res.syllables
        ],
        "stressed": res.stressed,
        "accented": res.accented,
    }


def main() -> None:
    for line in sys.stdin:
        word = line.strip()
        if not word:
            continue
        print(json.dumps(describe(word), ensure_ascii=False))


if __name__ == "__main__":
    main()
