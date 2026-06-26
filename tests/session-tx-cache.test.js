/*
 * Headless tests for session transaction-derived caches in zoe-pack-manager.html.
 *
 * Run:  node tests/session-tx-cache.test.js
 *
 * Verifies that cached belief state and activity-stats indexes match full replay,
 * that repeated reads hit the cache, and that invalidation after log changes works.
 */
const fs = require("node:fs");
const path = require("node:path");

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
function getConst(name) {
  const m = new RegExp(`const ${name}\\s*=\\s*(.+?);`).exec(HTML);
  if (!m) throw new Error(`const not found: ${name}`);
  return `const ${name} = ${m[1]};`;
}

const STUBS = `
  const ITEMS = [
    { id: "pads", name: "Pads", category: "Moms", unit: "packet", threshold: 20 },
    { id: "deo", name: "Deo", category: "Moms", unit: "each", threshold: 15 },
  ];
  let state = { sampleData: false, transactions: [], balances: { pads: 0, deo: 0 } };
  let sessionTxDerivedCache = null;
  const confidenceDaysSince = () => 1;
  const itemRecipeMeta = () => ({ isCore: false });
  const isOutOfSeason = () => false;
  const isTesterUser = () => false;
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
  extractBlock(HTML, "function emptyItemActivityStats("),
  extractBlock(HTML, "function confidenceTxAfterAnchor("),
  extractBlock(HTML, "function buildItemActivityStatsIndex("),
  extractBlock(HTML, "function beliefErf("),
  extractBlock(HTML, "function beliefNormalCdf("),
  extractBlock(HTML, "function beliefBandFromScore("),
  extractBlock(HTML, "function beliefWithinToleranceProbability("),
  extractBlock(HTML, "function beliefReason("),
  extractBlock(HTML, "function computeStockBeliefState("),
  extractBlock(HTML, "function invalidateSessionTxDerivedCache("),
  extractBlock(HTML, "function sessionTxCacheKey("),
  extractBlock(HTML, "function ensureSessionTxDerivedCache("),
  extractBlock(HTML, "function sessionStockBeliefState("),
  extractBlock(HTML, "function sessionActivityStatsIndex("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(
  `${blocks}\nreturn {
    computeStockBeliefState,
    buildItemActivityStatsIndex,
    invalidateSessionTxDerivedCache,
    sessionStockBeliefState,
    sessionActivityStatsIndex,
    getState: () => state,
    setState: (s) => { state = s; },
  };`
)();

const txs = [
  { type: "recount", itemId: "pads", newQty: 50, date: "2026-06-01" },
  { type: "donation", date: "2026-06-02", lines: [{ itemId: "pads", unitsAdded: 10 }] },
  { type: "build", packKey: "momPack", qty: 2, optionalIncluded: [], customExtras: [], substitutions: [], omissions: [], date: "2026-06-03", packer: "Sam" },
];

api.setState({ sampleData: false, transactions: txs, balances: { pads: 58, deo: 0 } });
api.invalidateSessionTxDerivedCache();

let failed = 0;
const ok = (name, cond, info) => {
  if (cond) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); }
};

(() => {
  const uncachedBelief = api.computeStockBeliefState(txs);
  const cachedBelief = api.sessionStockBeliefState();
  ok("belief: cached matches uncached", JSON.stringify(cachedBelief) === JSON.stringify(uncachedBelief));

  const uncachedAll = api.buildItemActivityStatsIndex(txs, { excludeTesterBuilds: false });
  const uncachedVol = api.buildItemActivityStatsIndex(txs, { excludeTesterBuilds: true });
  const cachedAll = api.sessionActivityStatsIndex({ excludeTesterBuilds: false });
  const cachedVol = api.sessionActivityStatsIndex({ excludeTesterBuilds: true });
  ok("activity all: cached matches uncached", JSON.stringify(cachedAll) === JSON.stringify(uncachedAll));
  ok("activity volunteer: cached matches uncached", JSON.stringify(cachedVol) === JSON.stringify(uncachedVol));
})();

(() => {
  const first = api.sessionStockBeliefState();
  const second = api.sessionStockBeliefState();
  ok("belief: second read is same object reference", first === second);

  const idx1 = api.sessionActivityStatsIndex({ excludeTesterBuilds: false });
  const idx2 = api.sessionActivityStatsIndex({ excludeTesterBuilds: false });
  ok("activity: second read is same object reference", idx1 === idx2);
})();

(() => {
  const before = api.sessionStockBeliefState();
  api.invalidateSessionTxDerivedCache();
  const after = api.sessionStockBeliefState();
  ok("invalidate: new object after clear", after !== before);
  ok("invalidate: values unchanged for same log", JSON.stringify(after) === JSON.stringify(before));
})();

(() => {
  const before = api.sessionStockBeliefState();
  const extended = [...txs, { type: "donation", date: "2026-06-04", lines: [{ itemId: "deo", unitsAdded: 5 }] }];
  api.setState({ ...api.getState(), transactions: extended });
  api.invalidateSessionTxDerivedCache();
  const after = api.sessionStockBeliefState();
  const direct = api.computeStockBeliefState(extended);
  ok("tx change: cached matches fresh replay", JSON.stringify(after) === JSON.stringify(direct));
  ok("tx change: belief differs after new donation", after.items.find(i => i.itemId === "deo").believedQty
    !== before.items.find(i => i.itemId === "deo").believedQty);
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
