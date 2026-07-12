// Bundle entry point: same ESM exports as index.mjs, plus a global for
// <script type="module"> consumers who don't want to import.

import * as jsilabeador from "./index.mjs";

export * from "./index.mjs";

/** @type {any} */ (globalThis).jsilabeador = jsilabeador;
