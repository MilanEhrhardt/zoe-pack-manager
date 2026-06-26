/*
 * Headless tests for the probabilistic stock belief-state in
 * zoe-pack-manager.html.
 *
 * Run:  node tests/stock-belief-state.test.js
 *
 * Extracts the belief math + replay engine straight from the HTML (brace-
 * matched) so the tests track the real code. ITEMS and a few app globals are
 * stubbed; the build planner / RECIPES are the real extracted source.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

function extractBlock(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  // For functions, start matching at the BODY brace (after the parameter list),
  // so a `= {}` default in the signature doesn't get mistaken for the body.
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
function getConst(name) {
  const m = new RegExp(`const ${name}\\s*=\\s*(.+?);`).exec(HTML);
  if (!m) throw new Error(`const not found: ${name}`);
  return `const ${name} = ${m[1]};`;
}

// Stub app globals the belief engine touches (display / season / recipe-role only).
const STUBS = `
  const ITEMS = [
    { id: "pads", name: "Pads", category: "Moms", unit: "packet", threshold: 20 },
    { id: "deo", name: "Deo", category: "Moms", unit: "each", threshold: 15 },
    { id: "face-cloths", name: "Face Cloths", category: "Moms", unit: "each", threshold: 10 },
    { id: "soap-moms", name: "Hand Soap", category: "Moms", unit: "each", threshold: 15 },
    { id: "toothbrush", name: "Toothbrush", category: "Moms", unit: "each", threshold: 20 },
    { id: "toothpaste", name: "Toothpaste", category: "Moms", unit: "each", threshold: 15 },
    { id: "socks", name: "Socks", category: "Baby Clothes", unit: "each", threshold: 15 },
  ];
  const state = { sampleData: false };
  const confidenceDaysSince = () => 1;
  const itemRecipeMeta = () => ({ isCore: false });
  const isOutOfSeason = () => false;
`;

const blocks = [
  STUBS,
  getConst("RECOUNT_TOLERANCE_ABS"),
  getConst("RECOUNT_TOLERANCE_PCT"),
  getConst("BELIEF_MODEL_VERSION"),
  getConst("BELIEF_RECOUNT_VAR"),
  getConst("BELIEF_NO_ANCHOR_VAR"),
  getConst("BELIEF_DONATION_REL_SD"),
  getConst("BELIEF_DONATION_BASE_VAR"),
  getConst("BELIEF_BUILD_REL_SD"),
  getConst("BELIEF_MOVE_BASE_VAR"),
  extractBlock(HTML, "const RECIPES = {"),
  extractBlock(HTML, "function normalizeSubstitutions("),
  extractBlock(HTML, "function normalizeOmissions("),
  extractBlock(HTML, "function recipeQtyPerPack("),
  extractBlock(HTML, "function computeBuildStockPlan("),
  extractBlock(HTML, "function beliefErf("),
  extractBlock(HTML, "function beliefNormalCdf("),
  extractBlock(HTML, "function beliefBandFromScore("),
  extractBlock(HTML, "function beliefWithinToleranceProbability("),
  extractBlock(HTML, "function beliefReason("),
  extractBlock(HTML, "function computeStockBeliefState("),
  extractBlock(HTML, "function bsMean("),
  extractBlock(HTML, "function buildStockBeliefSummary("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(
  `${blocks}\nreturn { computeStockBeliefState, buildStockBeliefSummary, beliefNormalCdf };`
)();

const item = (state, id) => state.items.find(i => i.itemId === id);

let failed = 0;
const ok = (name, cond, info) => { if (cond) console.log(`PASS  ${name}`); else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); } };
const near = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

// --- normal CDF sanity ---
ok("Φ(0) = 0.5", near(api.beliefNormalCdf(0), 0.5));
ok("Φ(1.96) ≈ 0.975", near(api.beliefNormalCdf(1.96), 0.975, 0.005));
ok("Φ(-1) ≈ 0.159", near(api.beliefNormalCdf(-1), 0.1587, 0.005));

// --- recount collapses variance -> high confidence ---
(() => {
  const s = api.computeStockBeliefState([{ type: "recount", itemId: "pads", newQty: 50, date: "2026-06-01" }]);
  const p = item(s, "pads");
  ok("recount: believedQty = 50", p.believedQty === 50, `got ${p.believedQty}`);
  ok("recount: variance ≈ 0.5", near(p.variance, 0.5, 0.01), `got ${p.variance}`);
  ok("recount: confidence ~100 / trusted", p.confidenceScore >= 95 && p.confidenceBand === "trusted", `got ${p.confidenceScore}`);
  ok("recount: anchored true", p.anchored === true);
})();

// --- never anchored -> low confidence, wide variance ---
(() => {
  const s = api.computeStockBeliefState([]);
  const sock = item(s, "socks");
  ok("unanchored: believedQty 0", sock.believedQty === 0);
  ok("unanchored: variance = 64", sock.variance === 64, `got ${sock.variance}`);
  ok("unanchored: anchored false", sock.anchored === false);
  ok("unanchored: needs_checking band", sock.confidenceBand === "needs_checking", `got ${sock.confidenceBand} (${sock.confidenceScore})`);
})();

// --- donation grows variance, lowers confidence vs fresh recount ---
(() => {
  const s = api.computeStockBeliefState([
    { type: "recount", itemId: "deo", newQty: 30, date: "2026-06-01" },
    { type: "donation", date: "2026-06-02", lines: [{ itemId: "deo", unitsAdded: 20 }] },
  ]);
  const d = item(s, "deo");
  ok("donation: believedQty 50", d.believedQty === 50, `got ${d.believedQty}`);
  ok("donation: variance ≈ 5.5 (0.5 + 4 + 1)", near(d.variance, 5.5, 0.01), `got ${d.variance}`);
  ok("donation: confidence below a fresh count", d.confidenceScore < 100);
})();

// --- μ tracks the running balance through a build deduction ---
(() => {
  const s = api.computeStockBeliefState([
    { type: "recount", itemId: "pads", newQty: 50, date: "2026-06-01" },
    { type: "build", packKey: "momPack", qty: 5, optionalIncluded: [], customExtras: [], substitutions: [], omissions: [], date: "2026-06-02" },
  ]);
  const p = item(s, "pads");
  ok("build: believedQty 40 (50 − 2·5)", p.believedQty === 40, `got ${p.believedQty}`);
  ok("build: variance ≈ 0.91 (0.5 + 0.16 + 0.25)", near(p.variance, 0.91, 0.01), `got ${p.variance}`);
})();

// --- stock-out probability is monotone in distance to threshold ---
(() => {
  const low = item(api.computeStockBeliefState([{ type: "recount", itemId: "pads", newQty: 5, date: "2026-06-01" }]), "pads");
  const high = item(api.computeStockBeliefState([{ type: "recount", itemId: "pads", newQty: 100, date: "2026-06-01" }]), "pads");
  ok("stock-out: near-threshold risk high", low.lowStockProbability >= 0.9, `got ${low.lowStockProbability}`);
  ok("stock-out: well-stocked risk low", high.lowStockProbability <= 0.1, `got ${high.lowStockProbability}`);
  ok("stock-out: monotone (5 riskier than 100)", low.lowStockProbability > high.lowStockProbability);
})();

// --- summary aggregation ---
(() => {
  const s = api.computeStockBeliefState([
    { type: "recount", itemId: "pads", newQty: 50, date: "2026-06-01" },
    { type: "recount", itemId: "deo", newQty: 3, date: "2026-06-01" },
  ]);
  const sum = api.buildStockBeliefSummary(s);
  const bandTotal = Object.values(sum.bandCounts).reduce((a, b) => a + b, 0);
  ok("summary: bandCounts sum to itemCount", bandTotal === sum.itemCount && sum.itemCount === 7, `got ${bandTotal}/${sum.itemCount}`);
  ok("summary: anchoredCount = 2", sum.anchoredCount === 2, `got ${sum.anchoredCount}`);
  ok("summary: leastConfident ascending", sum.leastConfident.every((r, i, a) => i === 0 || a[i - 1].confidenceScore <= r.confidenceScore));
  ok("summary: highestStockOutRisk descending", sum.highestStockOutRisk.every((r, i, a) => i === 0 || a[i - 1].lowStockProbability >= r.lowStockProbability));
  ok("summary: deo=3 (below threshold 15) appears in stock-out risk", sum.highestStockOutRisk.some(r => r.itemId === "deo"));
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
