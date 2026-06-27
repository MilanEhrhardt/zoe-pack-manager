/*
 * Headless tests for intelligence bundle dependency validation in zoe-pack-manager.html.
 *
 * Run:  node tests/intelligence-bundle-validation.test.js
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

function extractConstArray(name) {
  const start = HTML.indexOf(`const ${name} = [`);
  if (start === -1) throw new Error(`array const not found: ${name}`);
  let depth = 0;
  for (let j = start; j < HTML.length; j++) {
    if (HTML[j] === "[") depth++;
    else if (HTML[j] === "]" && --depth === 0) {
      const end = HTML[j + 1] === ";" ? j + 2 : j + 1;
      return HTML.slice(start, end);
    }
  }
  throw new Error(`unbalanced brackets for ${name}`);
}

const STUBS = `
  let state = { sampleData: false, transactions: [], analytics: { events: [] } };
`;

const blocks = [
  STUBS,
  getConst("INTELLIGENCE_BUNDLE_VALIDATOR_VERSION"),
  extractConstArray("INTELLIGENCE_BUNDLE_DAG"),
  extractBlock(HTML, "function ibvIsPlainObject("),
  extractBlock(HTML, "function intelligenceBundleDagIndex("),
  extractBlock(HTML, "function validateBundleLayerShape("),
  extractBlock(HTML, "function validateBundleGeneratedAt("),
  extractBlock(HTML, "function findNonFiniteNumbers("),
  extractBlock(HTML, "function validateIntelligenceBundleGraphIntegrity("),
  extractBlock(HTML, "function validateIntelligenceBundleMeta("),
  extractBlock(HTML, "function validateIntelligenceBundleDependencies("),
  extractBlock(HTML, "function validateIntelligenceBundle("),
  extractBlock(HTML, "function intelligenceBundleValidationSummary("),
].join("\n\n");

const api = new Function(
  `${blocks}\nreturn {
    INTELLIGENCE_BUNDLE_DAG,
    validateIntelligenceBundle,
    validateIntelligenceBundleDependencies,
    intelligenceBundleValidationSummary,
    findNonFiniteNumbers,
    setState: (s) => { state = s; },
  };`
)();

function validFixture() {
  const generatedAt = "2026-06-26T12:00:00.000Z";
  const reasoningId = "reasoning:stock:pads";
  return {
    generatedAt,
    meta: {
      transactionCount: 0,
      analyticsEventCount: 0,
      sampleData: false,
      cacheKey: { txCount: 0, sampleData: false, analyticsEventCount: 0 },
      validatorVersion: "ibv.1",
    },
    itemConfidence: [{ itemId: "pads" }],
    packingHabits: { generatedAt, trends: {}, observations: [] },
    recountCalibration: { modelVersion: "rc.2", totalLabeledRecounts: 0 },
    stockBeliefState: { modelVersion: "bs.1", items: [] },
    operationalIntelligence: { generatedAt, summary: {} },
    evidenceFusion: { generatedAt, modelVersion: "3E.1", summary: { totalObjects: 0 } },
    operationalReasoning: {
      generatedAt,
      modelVersion: "4.0",
      summary: { totalReasonings: 1 },
      reasonings: [{
        reasoningId,
        hypotheses: [
          { hypothesisId: "h1", confidence: 0.6, status: "leading" },
          { hypothesisId: "h2", confidence: 0.4, status: "plausible" },
        ],
      }],
    },
    beliefEngine: {
      generatedAt,
      modelVersion: "4.0",
      summary: { derivedBeliefCount: 1 },
      beliefs: [{ beliefId: "b1", derivedFromReasoningId: reasoningId }],
    },
    operationalMemory: {
      generatedAt,
      modelVersion: "3C.1.1",
      summary: { totalMemories: 0 },
      memories: [{ memoryId: "m1" }],
    },
    countPriorities: { modelVersion: "voi.1", ranked: [], topPick: null },
  };
}

let failed = 0;
const ok = (name, cond, info) => {
  if (cond) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); }
};

api.setState({ sampleData: false, transactions: [], analytics: { events: [] } });

(() => {
  const v = api.validateIntelligenceBundle(validFixture());
  ok("valid fixture passes", v.ok === true, JSON.stringify(v.errors));
})();

(() => {
  const b = validFixture();
  delete b.beliefEngine;
  const v = api.validateIntelligenceBundle(b);
  ok("missing required layer is error", !v.ok && v.errors.some(e => /beliefEngine/.test(e)));
})();

(() => {
  const b = validFixture();
  b.evidenceFusion = null;
  const v = api.validateIntelligenceBundle(b);
  ok("missing dependency layer is error", !v.ok && v.errors.some(e => /evidenceFusion/.test(e)));
})();

(() => {
  const badManifest = [
    { key: "stockBeliefState", name: "Belief", dependencies: ["itemConfidence"], required: true, expectsObject: true },
    { key: "itemConfidence", name: "Confidence", dependencies: [], required: true, expectsArray: true },
  ];
  const b = { generatedAt: "t", itemConfidence: [], stockBeliefState: {} };
  const v = api.validateIntelligenceBundleDependencies(b, badManifest);
  ok("manifest order violation detected", v.errors.some(e => /dependency order violation/.test(e)));
})();

(() => {
  const b = validFixture();
  b.evidenceFusion = { ...b.evidenceFusion, generatedAt: "2026-01-01T00:00:00.000Z" };
  const v = api.validateIntelligenceBundle(b);
  ok("generatedAt mismatch on strict layer is error", !v.ok && v.errors.some(e => /generatedAt mismatch/.test(e)));
})();

(() => {
  const b = validFixture();
  b.itemConfidence = {};
  const v = api.validateIntelligenceBundle(b);
  ok("array shape mismatch is error", !v.ok && v.errors.some(e => /itemConfidence.*expected array/.test(e)));
})();

(() => {
  const b = validFixture();
  b.operationalReasoning.reasonings.push({
    reasoningId: "reasoning:stock:pads",
    hypotheses: [{ hypothesisId: "h1", confidence: 1 }],
  });
  const v = api.validateIntelligenceBundle(b);
  ok("duplicate reasoningId is error", !v.ok && v.errors.some(e => /duplicate reasoningId/.test(e)));
})();

(() => {
  const b = validFixture();
  b.beliefEngine.beliefs.push({ beliefId: "b1", derivedFromReasoningId: "reasoning:stock:pads" });
  const v = api.validateIntelligenceBundle(b);
  ok("duplicate beliefId is error", !v.ok && v.errors.some(e => /duplicate beliefId/.test(e)));
})();

(() => {
  const b = validFixture();
  b.operationalIntelligence = { generatedAt: b.generatedAt, summary: {}, bad: NaN };
  const v = api.validateIntelligenceBundle(b);
  ok("non-finite number detected", !v.ok && v.errors.some(e => /non-finite/.test(e)));
})();

(() => {
  const b = validFixture();
  b.beliefEngine.beliefs[0].derivedFromReasoningId = "reasoning:missing";
  const v = api.validateIntelligenceBundle(b);
  ok("broken derivedFromReasoningId is error", !v.ok && v.errors.some(e => /missing reasoningId/.test(e)));
})();

(() => {
  const b = validFixture();
  b.operationalReasoning.reasonings[0].hypotheses = [
    { hypothesisId: "h1", confidence: 0.54 },
    { hypothesisId: "h2", confidence: 0.40 },
  ];
  const v = api.validateIntelligenceBundle(b);
  ok("hypothesis sum warning", v.warnings.some(w => /hypothesis confidence sum/.test(w)));
})();

(() => {
  let threw = false;
  try {
    api.validateIntelligenceBundle(null);
  } catch (e) {
    threw = true;
  }
  ok("validator does not throw on null bundle", !threw);
  const v = api.validateIntelligenceBundle(null);
  ok("null bundle reports errors", !v.ok && v.errorCount > 0);
})();

(() => {
  const summary = api.intelligenceBundleValidationSummary({
    ok: false,
    validatorVersion: "ibv.1",
    errorCount: 2,
    warningCount: 1,
    errors: ["e1", "e2"],
    warnings: ["w1"],
  });
  ok("summary truncates top errors", summary.topErrors.length === 2 && summary.topWarnings.length === 1);
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
