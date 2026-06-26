/*
 * Headless tests for Phase 4 Operational Reasoning Engine in zoe-pack-manager.html.
 * Run: node tests/operational-reasoning.test.js
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

const freshnessBlocks = [
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

const beliefHelpers = [
  getConst("BE_MODEL_VERSION"),
  getConst("BE_BANNED_COPY"),
  extractBlock(HTML, "function beCopySafe"),
  extractBlock(HTML, "function beConfidenceBand"),
  extractBlock(HTML, "function computeBeliefConfidence"),
  extractBlock(HTML, "function beBeliefCtx"),
  extractBlock(HTML, "function beImpactReady"),
  extractBlock(HTML, "function beReadinessInputs"),
  extractBlock(HTML, "function beResolveActionability"),
  extractBlock(HTML, "function beMakeBelief"),
  extractBlock(HTML, "function beItemConfidenceRow"),
  extractBlock(HTML, "function beStockRiskRow"),
  extractBlock(HTML, "function beImportantItemIds"),
  extractBlock(HTML, "function beBalanceStatusFromConfidence"),
  extractBlock(HTML, "function beHabitStatusFromTrend"),
  extractBlock(HTML, "function beCountBy"),
  extractBlock(HTML, "function beReadyForRecommendations"),
  extractBlock(HTML, "function beBuildBeliefSummary"),
  extractBlock(HTML, "function beBeliefEvidenceType"),
  extractBlock(HTML, "function beInferBeliefEvidenceDate"),
  extractBlock(HTML, "function beFusionObjectForBelief"),
  extractBlock(HTML, "function beBuildEvidenceDetail"),
  extractBlock(HTML, "function beApplyFreshnessToBelief"),
].join("\n");

const reasoningSectionStart = HTML.indexOf("// OPERATIONAL REASONING ENGINE");
const reasoningSectionEnd = HTML.indexOf("// BELIEF ENGINE — Phase 3B");
if (reasoningSectionStart === -1 || reasoningSectionEnd === -1) {
  throw new Error("operational reasoning section not found");
}
const reasoningBlocks = HTML.slice(reasoningSectionStart, reasoningSectionEnd);

const vm = require("node:vm");
const ctx = {
  todayISO: () => "2026-06-24",
  itemName: id => ({ pads: "Pads", deo: "Deo", "breast-pads": "Breast Pads" }[id] || id),
  packingHabitPatternKey: (t, p, i, r) => [t, p, i, r || ""].join("|"),
  opDonationMaxEnablement: d => (d.lines || []).reduce((s, l) => s + (l.qty || 0), 0),
  opDonationLineMaxEnablement: l => l.qty || 0,
  buildConfidenceSummary: rows => ({
    volunteer: {
      uncertain: rows.filter(r => r.volunteerConfidence?.confidenceBand === "uncertain").length,
      needs_checking: rows.filter(r => r.volunteerConfidence?.confidenceBand === "needs_checking").length,
    },
  }),
  RECIPES: {
    babyPack: { label: "Baby Pack", confirmed: false, core: [], optional: [] },
    momPack: { label: "Mom Pack", confirmed: true, core: [{ itemId: "pads" }], optional: [{ itemId: "deo" }] },
  },
  state: { sampleData: true, transactions: [] },
};
vm.createContext(ctx);
vm.runInContext([freshnessBlocks, beliefHelpers, reasoningBlocks, extractBlock(HTML, "function computeBeliefEngine")].join("\n"), ctx);

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

const fixtureDeps = {
  referenceAt: ref,
  synthetic: true,
  itemConfidence: [{
    itemId: "pads",
    itemName: "Pads",
    volunteerConfidence: {
      confidenceBand: "uncertain",
      volunteerLabel: "uncertain",
      confidenceReason: "Many movements since last count.",
      stats: { totalMovements: 12, hasEverBeenRecounted: false },
    },
  }],
  packingHabits: {
    observations: [{
      type: "substitution",
      packKey: "momPack",
      packLabel: "Mom Pack",
      itemId: "pads",
      itemName: "Pads",
      replacementItemId: "breast-pads",
      replacementItemName: "Breast Pads",
      count: 4,
      percentage: 40,
      trend: "emerging",
      evidence: "early",
      volunteerText: "Breast Pads sometimes replace Pads.",
      possibleCauses: [
        { cause: "stock_shortage", confidence: 0.4, reason: "Pads may be low." },
        { cause: "volunteer_preference", confidence: 0.35, reason: "Volunteer habit." },
        { cause: "unknown", confidence: 0.25, reason: "Unclear." },
      ],
    }],
  },
  operationalIntelligence: {
    summary: { productionPacksCreated: 20, recountCount: 2 },
    impactReadiness: { readyForImpactJudgement: false, readinessScore: 40, blockers: ["Few recounts"], reasons: [] },
    stockRisk: [{
      itemId: "pads", itemName: "Pads", balance: 5, threshold: 20,
      zeroStock: false, lowStock: true, riskBand: "high",
      recentSubstitutionTouches: 3, recipeRoles: [{ role: "core" }],
      appearsInRecipes: true,
    }],
    substitutionImpact: [],
    optionalImpact: [],
    donationImpact: [{
      donationId: "don-1",
      date: "2026-06-01",
      donor: "Test Donor",
      lines: [{ itemId: "pads", qty: 50 }],
    }],
    recountImpact: [],
    buildImpact: { byPackKey: [{ packKey: "babyPack", productionPacksCreated: 2 }] },
  },
  stockBeliefState: { items: [] },
  recountCalibration: { readyForCalibration: false },
  analyticsEvents: [],
};

test("normalizeProbabilities: sums to 1.0", () => {
  const hyps = ctx.orNormalizeProbabilities([
    { hypothesisId: "a", confidence: 0.4 },
    { hypothesisId: "b", confidence: 0.35 },
    { hypothesisId: "c", confidence: 0.25 },
  ]);
  const sum = hyps.reduce((s, h) => s + h.confidence, 0);
  assert.ok(Math.abs(sum - 1) < 0.02);
  assert.ok(["leading", "plausible", "weak", "contradicted", "insufficient_evidence"].includes(hyps[0].status));
});

test("computeOperationalReasoning: six reasoning types present", () => {
  const fusion = ctx.computeEvidenceFusion({
    ...fixtureDeps,
    packingHabits: fixtureDeps.packingHabits,
  });
  const reasoning = ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion });
  const types = new Set((reasoning.reasonings || []).map(r => r.reasoningType));
  ["stock", "habit", "recipe", "donation", "confidence", "readiness"].forEach(t => {
    assert.ok(types.has(t), `missing reasoning type: ${t}`);
  });
  assert.equal(reasoning.modelVersion, "4.0");
  assert.equal(reasoning.activeLearning.enabled, false);
  assert.ok(reasoning.dependencyGraph);
});

test("reasoning: hypotheses sum to 1.0 per object", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const reasoning = ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion });
  reasoning.reasonings.forEach(r => {
    if (!r.hypotheses?.length) return;
    const sum = r.hypotheses.reduce((s, h) => s + h.confidence, 0);
    assert.ok(Math.abs(sum - 1) < 0.02, `${r.reasoningId} hypothesis sum ${sum}`);
  });
});

test("deriveBeliefsFromReasoning: preserves readiness:overall", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const operationalReasoning = ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion });
  const beliefEngine = ctx.deriveBeliefsFromReasoning(operationalReasoning, { ...fixtureDeps, evidenceFusion: fusion });
  const readiness = beliefEngine.beliefs.find(b => b.beliefId === "readiness:overall");
  assert.ok(readiness);
  assert.equal(readiness.beliefType, "readiness");
  assert.ok(readiness.derivedFromReasoningId);
});

test("deriveBeliefsFromReasoning: stock yields item_balance and shortage for pads", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const operationalReasoning = ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion });
  const beliefEngine = ctx.deriveBeliefsFromReasoning(operationalReasoning, { ...fixtureDeps, evidenceFusion: fusion });
  assert.ok(beliefEngine.beliefs.find(b => b.beliefId === "item_balance:pads"));
  assert.ok(beliefEngine.beliefs.find(b => b.beliefId === "shortage:pads"));
});

test("beliefEngine: compatibilityLayer true", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const beliefEngine = ctx.computeBeliefEngine({ ...fixtureDeps, evidenceFusion: fusion });
  assert.equal(beliefEngine.compatibilityLayer, true);
  assert.equal(beliefEngine.modelVersion, "4.0");
  assert.equal(beliefEngine.sourceModelVersion, "4.0");
});

test("derived beliefs: traceability fields", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const beliefEngine = ctx.computeBeliefEngine({ ...fixtureDeps, evidenceFusion: fusion });
  const withTrace = beliefEngine.beliefs.filter(b => b.derivedFromReasoningId);
  assert.ok(withTrace.length >= 3);
  assert.ok(withTrace[0].leadingHypothesisId);
  assert.ok(Array.isArray(withTrace[0].wouldChangeMyMind));
  assert.ok(Array.isArray(withTrace[0].nextBestEvidence));
});

test("derived beliefs: freshness fields present", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const beliefEngine = ctx.computeBeliefEngine({ ...fixtureDeps, evidenceFusion: fusion });
  const b = beliefEngine.beliefs[0];
  assert.ok(b.supportingEvidenceDetail);
  assert.ok(b.evidenceFreshnessSummary);
  assert.ok(typeof b.freshnessAdjustedConfidenceProbability === "number");
});

test("synthetic: readyForRecommendations false", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const beliefEngine = ctx.computeBeliefEngine({ ...fixtureDeps, evidenceFusion: fusion });
  assert.equal(beliefEngine.summary.readyForRecommendations, false);
});

test("operationalReasoningSummaryConcise: returns counts", () => {
  const fusion = ctx.computeEvidenceFusion({ ...fixtureDeps });
  const reasoning = ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion });
  const summary = ctx.operationalReasoningSummaryConcise(reasoning);
  assert.ok(summary.totalReasonings >= 6);
  assert.ok(summary.topThreeReasonings.length <= 3);
  assert.equal(summary.activeLearningEnabled, false);
});

test("fusion isolation: evidence fusion unchanged by reasoning", () => {
  const fusion1 = ctx.computeEvidenceFusion({ ...fixtureDeps });
  ctx.computeOperationalReasoning({ ...fixtureDeps, evidenceFusion: fusion1 });
  const fusion2 = ctx.computeEvidenceFusion({ ...fixtureDeps });
  assert.equal(fusion1.summary.totalObjects, fusion2.summary.totalObjects);
  assert.equal(fusion1.summary.totalEvidence, fusion2.summary.totalEvidence);
});

console.log(`\n${passed}/${passed} passed`);
