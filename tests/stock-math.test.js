/*
 * Headless correctness tests for the stock-math path in zoe-pack-manager.html.
 *
 * Run:  node tests/stock-math.test.js
 *
 * The app is a single offline HTML file with no module exports, so this test
 * EXTRACTS the relevant pure functions straight from the HTML source (by
 * brace-matching their declarations) and evaluates them in isolation. That
 * keeps the tests pinned to the real source — if computeBuildStockPlan or its
 * helpers change in the HTML, these tests exercise the new code automatically.
 *
 * Assumption: the extracted blocks contain no `{`/`}` inside string literals or
 * comments (true for the current functions). If that ever changes, swap the
 * naive brace matcher for a real tokenizer.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

// Pull a `function name(...) { ... }` or `const NAME = { ... };` block by
// matching braces from the first `{` after the anchor.
function extractBlock(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  const braceStart = src.indexOf("{", start);
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

const blocks = [
  extractBlock(HTML, "const RECIPES = {"),
  extractBlock(HTML, "function normalizeSubstitutions("),
  extractBlock(HTML, "function normalizeOmissions("),
  extractBlock(HTML, "function recipeQtyPerPack("),
  extractBlock(HTML, "function computeBuildStockPlan("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const { computeBuildStockPlan } = new Function(
  `${blocks}\nreturn { computeBuildStockPlan };`
)();

const plan = (...args) => computeBuildStockPlan(...args).usage;

const cases = [
  {
    name: "A · plain Mom Pack ×3 with deo",
    got: plan("momPack", 3, ["deo"], [], [], []),
    want: { pads: 6, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 3 },
  },
  {
    name: "B · core substitution pads→panties in 2 of 3",
    got: plan("momPack", 3, [], [], [{ insteadOf: "pads", substitute: "panties", packCount: 2, qtyPerPack: 1 }], []),
    want: { pads: 2, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, panties: 2 },
  },
  {
    // Regression: an INCLUDED optional swapped out of SOME packs must not double-subtract.
    name: "C · optional deo→panties in 2 of 3 (deo must be 1, not 0)",
    got: plan("momPack", 3, ["deo"], [], [{ insteadOf: "deo", substitute: "panties", packCount: 2, qtyPerPack: 1 }], []),
    want: { pads: 6, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 1, panties: 2 },
  },
  {
    // Step-6 dedup must still fire: an included optional used AS the substitute
    // should be counted once per pack, not twice.
    name: "D · substitute is an included optional pads→deo in 2 of 3 (deo stays 3)",
    got: plan("momPack", 3, ["deo"], [], [{ insteadOf: "pads", substitute: "deo", packCount: 2, qtyPerPack: 1 }], []),
    want: { pads: 2, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 3 },
  },
  {
    name: "E · optional omission deo left out of 2 of 3 (deo must be 1)",
    got: plan("momPack", 3, ["deo"], [], [], [{ itemId: "deo", packCount: 2, qtyPerPack: 1 }]),
    want: { pads: 6, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 1 },
  },
  {
    name: "F · core omission pads left out of 1 of 3 (pads must be 4)",
    got: plan("momPack", 3, [], [], [], [{ itemId: "pads", packCount: 1, qtyPerPack: 1 }]),
    want: { pads: 4, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3 },
  },
  {
    name: "G · full optional swap deo→panties in all 3 (deo 0)",
    got: plan("momPack", 3, ["deo"], [], [{ insteadOf: "deo", substitute: "panties", packCount: 3, qtyPerPack: 1 }], []),
    want: { pads: 6, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 0, panties: 3 },
  },
  {
    name: "H · custom extra adds qtyPerPack × qty",
    got: plan("momPack", 2, [], [{ itemId: "vaseline", qtyPerPack: 3 }], [], []),
    want: { pads: 4, "face-cloths": 2, "soap-moms": 2, toothbrush: 2, toothpaste: 2, vaseline: 6 },
  },
  {
    // Substitute quantity must scale by qtyPerPack: 2 packs × 2 panties each = 4.
    name: "I · substitution honours qtyPerPack (panties→deo? 2 packs × 2 = 4)",
    got: plan("momPack", 3, ["deo"], [], [{ insteadOf: "deo", substitute: "panties", packCount: 2, qtyPerPack: 2 }], []),
    want: { pads: 6, "face-cloths": 3, "soap-moms": 3, toothbrush: 3, toothpaste: 3, deo: 1, panties: 4 },
  },
];

let failed = 0;
for (const c of cases) {
  try {
    assert.deepEqual(c.got, c.want);
    console.log(`PASS  ${c.name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${c.name}`);
    console.log(`   got     : ${JSON.stringify(c.got)}`);
    console.log(`   expected: ${JSON.stringify(c.want)}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
