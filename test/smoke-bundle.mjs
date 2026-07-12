// Smoke test for the built bundle: import it as ESM, check the named
// exports work, and check the global attaches. Run after `npm run build`.

import assert from "node:assert/strict";

const bundleUrl = new URL("../dist/jsilabeador.min.js", import.meta.url);
const bundle = await import(bundleUrl.href);

assert.deepEqual(bundle.syllabify("encuentro"), ["en", "cuen", "tro"]);
assert.equal(bundle.hyphenate("palabra"), "pa-la-bra");

const details = bundle.syllabifyWithDetails("melón");
assert.equal(details.hyphenated, "me-lón");
assert.equal(details.stressed, 1);
assert.equal(details.accented, 3);

assert.throws(() => bundle.syllabify("pm"), bundle.HyphenatorError);

// The bundle attaches a global for <script type="module"> use
const g = /** @type {any} */ (globalThis).jsilabeador;
assert.ok(g, "globalThis.jsilabeador not attached");
assert.equal(g.hyphenate("silabear"), "si-la-be-ar");

console.log("bundle smoke test: OK");
