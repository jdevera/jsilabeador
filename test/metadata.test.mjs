import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const requirements = readFileSync(new URL("../requirements-crosscheck.txt", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("README tracks the pinned pylabeador version", () => {
  const pinned = requirements.match(/^pylabeador==(\d+\.\d+\.\d+)(?=\s|$)/m);
  assert.ok(pinned, "requirements-crosscheck.txt must pin an exact pylabeador version");

  const documented = [...readme.matchAll(/\bpylabeador v(\d+\.\d+\.\d+)\b/g)];
  assert.ok(documented.length > 0, "README must name the tracked pylabeador version");
  for (const match of documented) {
    assert.equal(match[1], pinned[1], "README pylabeador version must match requirements-crosscheck.txt");
  }
});

test("README CDN examples use the package version", () => {
  const versions = [...readme.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/jsilabeador@([^/\s]+)\//g)];
  assert.ok(versions.length > 0, "README must include a versioned CDN example");
  for (const match of versions) {
    assert.equal(match[1], pkg.version, "README CDN versions must match package.json");
  }
});

test("README Node minimum matches the package engine", () => {
  const documented = readme.match(/Requires Node\.js (\d+\.\d+\.\d+) or later\./);
  assert.ok(documented, "README must state the minimum Node.js version");
  assert.equal(`>=${documented[1]}`, pkg.engines.node, "README Node minimum must match package.json");
});
