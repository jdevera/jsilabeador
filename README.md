# jsilabeador: Automatic Syllabification of Spanish Words

A zero-dependency JavaScript port of
[pylabeador](https://github.com/jdevera/pylabeador) by Jacobo de Vera. The
algorithm originates in the C++ syllabifier formerly distributed by
tulengua.es ([Silabeador TIP](https://tulengua.iatext.ulpgc.es/syllables/),
TIP: Text & Information Processing, ULPGC).

This is a **fidelity port**: it reproduces pylabeador's behavior
convention-for-convention (currently pylabeador v0.9.0), and CI
cross-validates every word of the shared test corpus against the Python
implementation, comparing the full syllable structure. Where the two could
drift, pylabeador is the oracle.

## Install

```
npm install jsilabeador
```

Or load the single-file bundle without installing anything. Every published
version is served by the npm CDNs:

```html
<script type="module">
  import { hyphenate } from "https://cdn.jsdelivr.net/npm/jsilabeador@0.1.0/dist/jsilabeador.min.js";
  console.log(hyphenate("palabra")); // pa-la-bra
</script>
```

The bundle also attaches a `jsilabeador` global, so a plain script tag works
too:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/jsilabeador@0.1.0/dist/jsilabeador.min.js"></script>
<script type="module">
  console.log(globalThis.jsilabeador.hyphenate("palabra")); // pa-la-bra
</script>
```

(unpkg.com works the same way; you can also download the file from a GitHub
release or build it yourself with `npm run build` and self-host it.)

## Use

```js
import { syllabify, hyphenate, syllabifyWithDetails, HyphenatorError } from "jsilabeador";

syllabify("silabear");
// => ['si', 'la', 'be', 'ar']

hyphenate("palabra");
// => 'pa-la-bra'

const details = syllabifyWithDetails("melón");
details.hyphenated; // 'me-lón'
details.stressed;   // 1    (0-based index of the stressed syllable)
details.accented;   // 3    (0-based character position of the tilde, or null)
details.syllables;  // [{ onset: 'm', nucleus: 'e', coda: '', accented: false, stressed: false },
                    //  { onset: 'l', nucleus: 'ó', coda: 'n', accented: true, stressed: true }]
```

Words that cannot be syllabified (no vowels, invalid characters, `ü` outside
`güe`/`güi`) throw `HyphenatorError`.

## Accuracy

Automatic syllabification without lexical or semantic knowledge of the words
can only go so far, and this library (like pylabeador) has no such knowledge.
Words with prefixes such as *transatlántico*, whose correct hyphenation is
*trans-a-tlán-ti-co*, end up divided as *tran-sa-tlán-ti-co*. See the
[pylabeador README](https://github.com/jdevera/pylabeador#accuracy) for
details and references.

## Development

```
npm test            # ported pylabeador test suites (node:test)
npm run typecheck   # tsc --checkJs over JSDoc annotations
npm run lint        # eslint
npm run build       # dist/jsilabeador.min.js (esbuild)
npm run smoke       # node smoke test of the built bundle
npm run crosscheck  # full-structure diff against pylabeador (needs python3
                    # with pylabeador installed, or set CROSSCHECK_PYTHON)
```

`test/spanish-hyphens.txt` is copied verbatim from pylabeador and records
what the library *currently does* (not necessarily "correct" hyphenation);
it exists to catch behavior drift. To re-sync with a newer pylabeador, copy
the file again and run the crosscheck.

## License

GPL-3.0-or-later. jsilabeador is a derivative work of pylabeador, copyright
(c) 2020 Jacobo de Vera Hernández, which in turn derives from the C++
syllabifier by TIP: Text & Information Processing, copyright (c) 2009. See
COPYING for the full license text.
