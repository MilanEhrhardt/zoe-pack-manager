/*
 * Headless tests for review-found bug fixes in zoe-pack-manager.html.
 *
 * Run:  node tests/review-bug-fixes.test.js
 *
 * Covers:
 *  - Bug 1: orEvidenceDiversityScore used sources.size on a numeric count → NaN.
 *  - Bug 2: getSubstitutionLineErrors silently ignored partially-filled rows
 *           (both items chosen, pack count blank) which normalizeSubstitutions
 *           then dropped on save.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

function extractBlock(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  const afterSig = anchor.startsWith("function") ? src.indexOf(")", start) : start;
  const braceStart = src.indexOf("{", afterSig);
  let depth = 0;
  for (let j = braceStart; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}" && --depth === 0) {
      const end = src[j + 1] === ";" ? j + 2 : j + 1;
      return src.slice(start, end);
    }
  }
  throw new Error(`unbalanced braces after: ${anchor}`);
}

const harness = `
  const itemName = (id) => id;
  ${extractBlock(HTML, "function orUniqueSources(")}
  ${extractBlock(HTML, "function orEvidenceDiversityScore(")}
  ${extractBlock(HTML, "function getSubstitutionLineErrors(")}
  return { orEvidenceDiversityScore, getSubstitutionLineErrors };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

// ── Bug 1: evidence diversity score ────────────────────────────────────────
const divCtx = {
  evidenceFusion: {
    objects: [
      { objectId: "a", source: "packing_habits" },
      { objectId: "b", source: "item_confidence" },
      { objectId: "c", source: "packing_habits" },
    ],
  },
};
check("diversity score is a finite number, never NaN (Bug 1 regression)", () => {
  const s = api.orEvidenceDiversityScore(["a", "b", "c"], divCtx);
  assert.ok(Number.isFinite(s), `expected finite, got ${s}`);
  assert.ok(!Number.isNaN(s));
});
check("diversity score uses unique sources / count + density bonus", () => {
  // unique sources = 2 (habits, confidence), count = 3 → min(1, 2/3 + 3*0.05) = 0.82
  assert.equal(api.orEvidenceDiversityScore(["a", "b", "c"], divCtx), 0.82);
});
check("diversity score is 0 for no evidence, and bounded at 1", () => {
  assert.equal(api.orEvidenceDiversityScore([], divCtx), 0);
  const many = Array.from({ length: 30 }, (_, i) => "a"); // all same source, large count
  assert.equal(api.orEvidenceDiversityScore(many, divCtx), 1);
});

// ── Bug 2: substitution line validation ────────────────────────────────────
const QTY = 3;
function errs(rows) { return api.getSubstitutionLineErrors(QTY, rows); }

check("both items chosen but pack count blank → blocked, not silently dropped (Bug 2)", () => {
  const e = errs([{ insteadOf: "pads", substitute: "breast-pads", packCount: "" }]);
  assert.ok(e[0], "row should have an error");
  assert.match(e[0], /how many packs/i);
});
check("a fully complete row has no error", () => {
  const e = errs([{ insteadOf: "pads", substitute: "breast-pads", packCount: "2" }]);
  assert.equal(Object.keys(e).length, 0);
});
check("a fully blank row is ignored (the add-another placeholder)", () => {
  const e = errs([{ insteadOf: "", substitute: "", packCount: "" }]);
  assert.equal(Object.keys(e).length, 0);
});
check("only 'instead of' chosen → asks for the substitute", () => {
  const e = errs([{ insteadOf: "pads", substitute: "", packCount: "" }]);
  assert.match(e[0], /used instead/i);
});
check("only 'substitute' chosen → asks for the swapped-out item", () => {
  const e = errs([{ insteadOf: "", substitute: "breast-pads", packCount: "" }]);
  assert.match(e[0], /swapped out/i);
});
check("same item on both sides still errors", () => {
  const e = errs([{ insteadOf: "pads", substitute: "pads", packCount: "2" }]);
  assert.match(e[0], /two different items/i);
});
check("complete row with pack count over qty still errors", () => {
  const e = errs([{ insteadOf: "pads", substitute: "breast-pads", packCount: "5" }]);
  assert.match(e[0], /only built 3/i);
});
check("pack count of 0 counts as incomplete (not a valid swap)", () => {
  const e = errs([{ insteadOf: "pads", substitute: "breast-pads", packCount: "0" }]);
  assert.ok(e[0], "0 packs is not a usable swap");
});

console.log(`review-bug-fixes.test.js: ${pass} checks passed`);
