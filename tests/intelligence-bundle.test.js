/*
 * Headless tests for the canonical intelligence bundle in zoe-pack-manager.html.
 *
 * Run:  node tests/intelligence-bundle.test.js
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

const STUBS = `
  let state = {
    sampleData: false,
    transactions: [{ type: "recount", itemId: "pads", newQty: 10, date: "2026-06-01" }],
    analytics: { events: [] },
  };
  let sessionTxDerivedCache = null;
  let buildLayerCalls = 0;

  function computeStockBeliefState() { return { items: [{ itemId: "pads" }], modelVersion: "bs.1" }; }
  function buildItemActivityStatsIndex() { return { pads: {} }; }
  function computeAllItemConfidence() { buildLayerCalls++; return [{ itemId: "pads" }]; }
  function packingHabitSummary() { buildLayerCalls++; return { trends: {} }; }
  function computeOperationalIntelligence() { buildLayerCalls++; return { modelVersion: "op.1" }; }
  function buildRecountCalibration() { buildLayerCalls++; return { modelVersion: "rc.2" }; }
  function computeEvidenceFusion() { buildLayerCalls++; return { modelVersion: "ef.1" }; }
  function computeOperationalReasoning() { buildLayerCalls++; return { modelVersion: "or.4" }; }
  function computeBeliefEngine() { buildLayerCalls++; return { modelVersion: "be.4" }; }
  function computeOperationalMemory() { buildLayerCalls++; return { modelVersion: "om.1" }; }
  function computeCountPriorities() { buildLayerCalls++; return { ranked: [], topPick: null, modelVersion: "voi.1" }; }

  const INTELLIGENCE_BUNDLE_VALIDATOR_VERSION = "ibv.1";
  function validateIntelligenceBundle() {
    return { ok: true, errors: [], warnings: [], errorCount: 0, warningCount: 0, validatorVersion: "ibv.1" };
  }
  function intelligenceBundleValidationSummary(v) {
    return { ok: v.ok, errorCount: 0, warningCount: 0, topErrors: [], topWarnings: [] };
  }
  function sessionIntelligenceBundleValidation() { return validateIntelligenceBundle(); }

  let lastExportPayload = null;
  function downloadTextFile(content) { lastExportPayload = JSON.parse(content); }
  function analyticsEpisodeFlushForExport() {}
  function analyticsTrack() {}
  function analyticsUserFields() { return { currentSelectedUser: "Janet", sessionUser: "Janet", isTesterSession: false }; }
  function todayISO() { return "2026-06-26"; }
  const ANALYTICS_SCHEMA_VERSION = 1;
  const PACKERS = [];
  const CLINICS = [];
  const ITEMS = [];
  const RECIPES = {};
  const COMPLETE_UNIT_ITEMS = [];
  function analyticsDerivedSummary(opts) {
    return {
      generatedAt: opts.intelligenceBundle.generatedAt,
      schemaVersion: ANALYTICS_SCHEMA_VERSION,
      confidenceSummary: {},
      packingHabitsSummary: {},
      packingHabitTrends: {},
      operationalIntelligenceSummary: {},
      evidenceFusionSummary: {},
      operationalReasoningSummary: {},
      beliefEngineSummary: {},
      operationalMemorySummary: {},
      recountCalibrationSummary: {},
      stockBeliefSummary: {},
      countPrioritiesSummary: {},
      interactionEpisodeSummary: {},
      intelligenceBundleValidationSummary: { ok: true, errorCount: 0, warningCount: 0, topErrors: [], topWarnings: [] },
      byEvent: {},
      byScreen: {},
      byFlow: {},
      eventCount: 0,
      transactionCount: state.transactions.length,
    };
  }
`;

const blocks = [
  STUBS,
  extractBlock(HTML, "function invalidateSessionTxDerivedCache("),
  extractBlock(HTML, "function sessionTxCacheKey("),
  extractBlock(HTML, "function ensureSessionTxDerivedCache("),
  extractBlock(HTML, "function buildIntelligenceBundle("),
  extractBlock(HTML, "function sessionIntelligenceBundle("),
  extractBlock(HTML, "function exportAnalyticsJSON("),
  extractBlock(HTML, "function exportAIDataPack("),
].join("\n\n");

const api = new Function(
  `${blocks}\nreturn {
    invalidateSessionTxDerivedCache,
    sessionTxCacheKey,
    sessionIntelligenceBundle,
    exportAnalyticsJSON,
    exportAIDataPack,
    getState: () => state,
    setState: (s) => { state = s; },
    getBuildLayerCalls: () => buildLayerCalls,
    resetBuildLayerCalls: () => { buildLayerCalls = 0; },
    getLastExportPayload: () => lastExportPayload,
  };`
)();

let failed = 0;
const ok = (name, cond, info) => {
  if (cond) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); }
};

api.invalidateSessionTxDerivedCache();
api.resetBuildLayerCalls();

(() => {
  const key = api.sessionTxCacheKey();
  ok("cache key includes analyticsEventCount", key.analyticsEventCount === 0);
})();

(() => {
  const first = api.sessionIntelligenceBundle();
  const callsAfterFirst = api.getBuildLayerCalls();
  ok("bundle builds intelligence layers once", callsAfterFirst > 0);
  const second = api.sessionIntelligenceBundle();
  ok("second read is same object reference", first === second);
  ok("second read does not recompute layers", api.getBuildLayerCalls() === callsAfterFirst);
  ok("bundle has generatedAt", typeof first.generatedAt === "string" && first.generatedAt.length > 0);
  ok("bundle includes activity stats", first.activityStatsVolunteer && first.activityStatsAll);
})();

(() => {
  const before = api.sessionIntelligenceBundle();
  api.invalidateSessionTxDerivedCache();
  api.resetBuildLayerCalls();
  const after = api.sessionIntelligenceBundle();
  ok("invalidate yields new bundle reference", after !== before);
  ok("invalidate yields new generatedAt", after.generatedAt !== before.generatedAt);
  ok("invalidate rebuilds layers", api.getBuildLayerCalls() > 0);
})();

(() => {
  api.invalidateSessionTxDerivedCache();
  api.resetBuildLayerCalls();
  const before = api.sessionIntelligenceBundle();
  const callsBefore = api.getBuildLayerCalls();
  api.setState({
    ...api.getState(),
    analytics: { events: [{ event: "click", timestamp: "2026-06-26T10:00:00Z" }] },
  });
  const after = api.sessionIntelligenceBundle();
  ok("analytics append invalidates bundle", after !== before);
  ok("analytics append rebuilds layers", api.getBuildLayerCalls() > callsBefore);
})();

(() => {
  api.invalidateSessionTxDerivedCache();
  api.exportAnalyticsJSON();
  const payload = api.getLastExportPayload();
  ok("analytics export has app", payload.app === "Zoe Pack Manager");
  ok("analytics export has analytics", payload.analytics != null);
  ok("analytics export has summary", payload.summary != null);
  ok("analytics export exportedAt matches bundle", payload.exportedAt === payload.summary.generatedAt);
  ok("analytics export has validation summary", payload.summary.intelligenceBundleValidationSummary?.ok === true);
})();

(() => {
  api.invalidateSessionTxDerivedCache();
  api.exportAIDataPack();
  const payload = api.getLastExportPayload();
  const keys = [
    "app", "purpose", "schema", "userContext", "config", "state",
    "itemConfidence", "packingHabits", "operationalIntelligence", "evidenceFusion",
    "operationalReasoning", "beliefEngine", "operationalMemory", "recountCalibration",
    "stockBeliefState", "countPriorities", "analytics", "summary",
  ];
  keys.forEach(k => ok(`ai pack has ${k}`, Object.prototype.hasOwnProperty.call(payload, k)));
  ok("ai pack has diagnostics.intelligenceBundleValidation", payload.diagnostics?.intelligenceBundleValidation?.ok === true);
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
