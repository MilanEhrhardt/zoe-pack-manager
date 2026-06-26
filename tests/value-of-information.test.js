/*
 * Headless tests for the Value-of-Information count-prioritisation layer in
 * zoe-pack-manager.html.
 *
 * Run:  node tests/value-of-information.test.js
 *
 * Extracts the VoI functions straight from the HTML (brace-matched) so the
 * tests track the real code. RECIPES is the real extracted source; belief-state
 * items are supplied directly as the input the layer consumes.
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
function getConst(name) {
  const m = new RegExp(`const ${name}\\s*=\\s*(.+?);`).exec(HTML);
  if (!m) throw new Error(`const not found: ${name}`);
  return `const ${name} = ${m[1]};`;
}

const blocks = [
  getConst("VOI_MODEL_VERSION"),
  extractBlock(HTML, "const RECIPES = {"),
  extractBlock(HTML, "function voiCapitalize("),
  extractBlock(HTML, "function voiBottleneckItemIds("),
  extractBlock(HTML, "function voiReason("),
  extractBlock(HTML, "function computeCountPriorities("),
  extractBlock(HTML, "function countPrioritiesSummaryConcise("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(
  `${blocks}\nreturn { computeCountPriorities, countPrioritiesSummaryConcise, voiBottleneckItemIds };`
)();

// Minimal belief-state item with the fields VoI reads.
function bi(itemId, { conf = 0.5, lowStock = 0, core = false, qty = 10, outOfSeason = false } = {}) {
  return {
    itemId, itemName: itemId, confidenceProbability: conf, lowStockProbability: lowStock,
    isCore: core, isOutOfSeason: outOfSeason, believedQty: qty, confidenceScore: Math.round(conf * 100),
  };
}
const belief = (items, sampleData = false) => ({ items, sampleData });

let failed = 0;
const ok = (name, cond, info) => { if (cond) console.log(`PASS  ${name}`); else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); } };
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

// --- a confidently-known item contributes no VoI (nothing to learn) ---
(() => {
  const cp = api.computeCountPriorities(belief([bi("x", { conf: 1.0 })]));
  ok("certain item has voiScore 0 / filtered out", cp.ranked.length === 0 && cp.topPick === null);
})();

// --- uncertainty AND relevance both drive the score; ranking is sensible ---
(() => {
  const cp = api.computeCountPriorities(belief([
    bi("known_core", { conf: 0.95, core: true }),           // low uncertainty -> low VoI
    bi("unknown_filler", { conf: 0.2, core: false }),       // uncertain but low relevance
    bi("unknown_core_low", { conf: 0.2, core: true, lowStock: 0.9 }), // uncertain + core + likely short -> top
  ]));
  ok("most uncertain+relevant item ranks first", cp.topPick.itemId === "unknown_core_low", cp.topPick && cp.topPick.itemId);
  ok("ranked sorted by voiScore desc", cp.ranked.every((r, i, a) => i === 0 || a[i - 1].voiScore >= r.voiScore));
  ok("topPick message mentions the item", /unknown_core_low/.test(cp.topPick.message));
  ok("uncertain core beats uncertain filler", cp.ranked.find(r => r.itemId === "unknown_core_low").voiScore > cp.ranked.find(r => r.itemId === "unknown_filler").voiScore);
})();

// --- out-of-season items are heavily discounted ---
(() => {
  const inSeason = api.computeCountPriorities(belief([bi("a", { conf: 0.2, core: true, lowStock: 0.5 })]));
  const offSeason = api.computeCountPriorities(belief([bi("a", { conf: 0.2, core: true, lowStock: 0.5, outOfSeason: true })]));
  ok("seasonal discount lowers VoI", offSeason.ranked[0].voiScore < inSeason.ranked[0].voiScore, `${offSeason.ranked[0].voiScore} vs ${inSeason.ranked[0].voiScore}`);
})();

// --- bottleneck detection: the binding core constraint per pack is flagged ---
(() => {
  // momPack core includes pads(2),face-cloths(1),soap-moms(1),toothbrush(1),toothpaste(1).
  // Give pads the lowest believed/qty ratio -> it should be the momPack bottleneck.
  const items = [
    bi("pads", { conf: 0.3, core: true, qty: 2 }),         // ratio 2/2 = 1
    bi("face-cloths", { conf: 0.3, core: true, qty: 50 }), // ratio 50/1 = 50
    bi("soap-moms", { conf: 0.3, core: true, qty: 40 }),
    bi("toothbrush", { conf: 0.3, core: true, qty: 40 }),
    bi("toothpaste", { conf: 0.3, core: true, qty: 40 }),
  ];
  const ids = api.voiBottleneckItemIds(Object.fromEntries(items.map(i => [i.itemId, i])));
  ok("pads flagged as the momPack bottleneck", ids.has("pads"));
  const cp = api.computeCountPriorities(belief(items));
  ok("bottleneck item carries isBottleneck", cp.ranked.find(r => r.itemId === "pads").isBottleneck === true);
})();

// --- summary shape: topPick + topThree, sampleData propagated ---
(() => {
  const cp = api.computeCountPriorities(belief([
    bi("a", { conf: 0.2, core: true, lowStock: 0.8 }),
    bi("b", { conf: 0.3, core: false, lowStock: 0.4 }),
    bi("c", { conf: 0.4, core: true }),
    bi("d", { conf: 0.5 }),
  ], true));
  const s = api.countPrioritiesSummaryConcise(cp);
  ok("summary topThree length <= 3", s.topThree.length <= 3);
  eq("summary topPick item matches", s.topPick.itemId, cp.topPick.itemId);
  ok("summary carries sampleData flag", s.sampleData === true);
  eq("model version exposed", s.modelVersion, cp.modelVersion);
})();

// --- empty belief state is handled ---
(() => {
  const cp = api.computeCountPriorities(belief([]));
  ok("empty: no topPick", cp.topPick === null && cp.ranked.length === 0);
  ok("empty summary topPick null", api.countPrioritiesSummaryConcise(cp).topPick === null);
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
