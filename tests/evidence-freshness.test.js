/*
 * Headless tests for Phase 3E Evidence Freshness in zoe-pack-manager.html.
 * Run: node tests/evidence-freshness.test.js
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
  getConst("EVIDENCE_FRESHNESS_MODEL_VERSION"),
  "const EF_MODEL_VERSION = EVIDENCE_FRESHNESS_MODEL_VERSION;",
  extractBlock(HTML, "function efNormalizeDate"),
  extractBlock(HTML, "function evidenceDate"),
  extractBlock(HTML, "function efDaysBetween"),
  extractBlock(HTML, "function evidenceFreshnessBand"),
  extractBlock(HTML, "function evidenceFreshnessHalfLifeDays"),
  extractBlock(HTML, "function evidenceFreshnessWeight"),
  extractBlock(HTML, "function annotateEvidenceFreshness"),
  extractBlock(HTML, "function annotateEvidenceListFreshness"),
  extractBlock(HTML, "function summarizeEvidenceFreshness"),
  extractBlock(HTML, "function freshnessWeightedMean"),
  extractBlock(HTML, "function efFreshnessConfidenceModifier"),
  extractBlock(HTML, "function efFreshnessObject"),
  extractBlock(HTML, "function computeEvidenceFusion"),
].join("\n");

const vm = require("node:vm");
const ctx = {
  todayISO: () => "2026-06-24",
  RECIPES: { babyPack: { label: "Baby Pack", confirmed: false, optional: [] }, momPack: { label: "Mom Pack", confirmed: true, optional: [] } },
  packingHabitPatternKey: (t, p, i, r) => [t, p, i, r || ""].join("|"),
  itemName: id => id,
  state: { sampleData: true },
};
vm.createContext(ctx);
vm.runInContext(blocks, ctx);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}`);
    throw e;
  }
}

const ref = "2026-06-24T12:00:00.000Z";

test("band: 0 days -> fresh", () => {
  assert.equal(ctx.evidenceFreshnessBand(0), "fresh");
});
test("band: 14 days -> fresh", () => {
  assert.equal(ctx.evidenceFreshnessBand(14), "fresh");
});
test("band: 15 days -> recent", () => {
  assert.equal(ctx.evidenceFreshnessBand(15), "recent");
});
test("band: 45 days -> recent", () => {
  assert.equal(ctx.evidenceFreshnessBand(45), "recent");
});
test("band: 46 days -> ageing", () => {
  assert.equal(ctx.evidenceFreshnessBand(46), "ageing");
});
test("band: 90 days -> ageing", () => {
  assert.equal(ctx.evidenceFreshnessBand(90), "ageing");
});
test("band: 91 days -> stale", () => {
  assert.equal(ctx.evidenceFreshnessBand(91), "stale");
});
test("band: 180 days -> stale", () => {
  assert.equal(ctx.evidenceFreshnessBand(180), "stale");
});
test("band: 181 days -> historical", () => {
  assert.equal(ctx.evidenceFreshnessBand(181), "historical");
});
test("band: null -> unknown", () => {
  assert.equal(ctx.evidenceFreshnessBand(null), "unknown");
});

test("weight: fresh near 1.0", () => {
  assert.ok(ctx.evidenceFreshnessWeight(0, "recount") >= 0.95);
});
test("weight: historical lower than stale", () => {
  assert.ok(ctx.evidenceFreshnessWeight(120, "donation") < ctx.evidenceFreshnessWeight(60, "donation"));
});
test("weight: unknown date returns 0.5", () => {
  assert.equal(ctx.evidenceFreshnessWeight(null, "unknown"), 0.5);
});
test("weight: never below 0.10", () => {
  assert.ok(ctx.evidenceFreshnessWeight(9999, "recount") >= 0.10);
});
test("weight: never above 1.00", () => {
  assert.ok(ctx.evidenceFreshnessWeight(0, "recount") <= 1.00);
});

test("annotate: includes freshness block", () => {
  const out = ctx.annotateEvidenceFreshness(
    { description: "test", date: "2026-06-20", evidenceType: "recount" },
    { referenceAt: ref, evidenceType: "recount" }
  );
  assert.equal(out.freshness.modelVersion, "3E.1");
  assert.equal(out.freshness.freshnessBand, "fresh");
});

test("summarize: counts stale and historical", () => {
  const list = [
    { freshness: { freshnessBand: "stale", freshnessWeight: 0.4, evidenceDate: "2026-01-01" } },
    { freshness: { freshnessBand: "historical", freshnessWeight: 0.2, evidenceDate: "2025-01-01" } },
  ];
  const s = ctx.summarizeEvidenceFreshness(list);
  assert.equal(s.staleEvidenceCount, 1);
  assert.equal(s.historicalEvidenceCount, 1);
});

test("fusion: objects include freshness on evidence", () => {
  const fusion = ctx.computeEvidenceFusion({
    referenceAt: ref,
    synthetic: true,
    operationalIntelligence: {
      stockRisk: [{
        itemId: "pads", itemName: "Pads", balance: 10, threshold: 20,
        zeroStock: false, recentSubstitutionTouches: 0, recipeRoles: [{ role: "core" }],
      }],
      substitutionImpact: [],
      optionalImpact: [],
      donationImpact: [],
      recountImpact: [],
    },
    packingHabits: { observations: [] },
    itemConfidence: [],
    stockBeliefState: { items: [] },
    analyticsEvents: [],
  });
  assert.ok(fusion.objects.length >= 1);
  assert.ok(fusion.objects[0].evidence[0].freshness);
  assert.ok(fusion.objects[0].evidenceFreshnessSummary);
  assert.ok(fusion.summary.evidenceFreshnessSummary);
});

test("modifier: low average -> -0.15", () => {
  assert.equal(ctx.efFreshnessConfidenceModifier({ averageFreshnessWeight: 0.3, totalEvidence: 2 }), -0.15);
});

console.log(`\n${passed}/${passed} passed`);
