/*
 * Headless tests for the Storeroom Mind admin intelligence dashboard in
 * zoe-pack-manager.html.
 *
 * Run:  node tests/intelligence-dashboard.test.js
 *
 * Extracts the dashboard's render layer straight from the HTML (brace-matched)
 * so the tests track the real code. `esc` / `confidenceVolunteerLabel` are
 * stubbed, and `computeIntelligenceDashboardModel` is replaced with a
 * controlled stub so the section renderers and banner logic can be exercised
 * in isolation from the (separately tested) engine stack.
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

// Minimal stubs: esc is identity-ish (no DOM); volunteer band labels are real
// in spirit; computeIntelligenceDashboardModel is injected per-test via global.
const STUBS = `
  const esc = (s) => String(s == null ? "" : s);
  function confidenceVolunteerLabel(band) {
    if (band === "trusted") return "Trusted";
    if (band === "probably_right") return "Probably right";
    if (band === "uncertain") return "May need checking";
    return "Worth counting soon";
  }
  let __MODEL__ = null;
  function computeIntelligenceDashboardModel() { return __MODEL__; }
`;

const blocks = [
  STUBS,
  extractBlock(HTML, "function mindSafe("),
  extractBlock(HTML, "function mindPct("),
  extractBlock(HTML, "function mindBandPill("),
  extractBlock(HTML, "function mindReasoningTypeLabel("),
  extractBlock(HTML, "function mindVerdictPill("),
  extractBlock(HTML, "function mindUsableReasoning("),
  extractBlock(HTML, "function renderMindTrustSection("),
  extractBlock(HTML, "function renderMindCountNextSection("),
  extractBlock(HTML, "function renderMindShelfSection("),
  extractBlock(HTML, "function renderMindNoticedSection("),
  extractBlock(HTML, "function renderMindStockSection("),
  extractBlock(HTML, "function renderIntelligenceDashboard("),
];

const harness = `
  ${blocks.join("\n")}
  return {
    mindPct, mindBandPill, mindSafe, mindVerdictPill, mindUsableReasoning,
    renderMindTrustSection, renderMindCountNextSection, renderMindShelfSection,
    renderMindNoticedSection, renderMindStockSection, renderIntelligenceDashboard,
    setModel: (m) => { __MODEL__ = m; },
  };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

// ── helpers ─────────────────────────────────────────────────────────────
check("mindPct rounds a probability to a percent", () => {
  assert.equal(api.mindPct(0.5), "50%");
  assert.equal(api.mindPct(0.123), "12%");
});
check("mindPct guards null/NaN", () => {
  assert.equal(api.mindPct(null), "—");
  assert.equal(api.mindPct(undefined), "—");
  assert.equal(api.mindPct(NaN), "—");
});
check("mindBandPill emits a band-specific class and friendly label", () => {
  const html = api.mindBandPill("needs_checking");
  assert.match(html, /mind-pill--needs_checking/);
  assert.match(html, /Worth counting soon/);
});
check("mindSafe returns fallback when the thunk throws", () => {
  assert.equal(api.mindSafe(() => { throw new Error("boom"); }, "fb"), "fb");
  assert.equal(api.mindSafe(() => 42, "fb"), 42);
});
check("mindVerdictPill labels calibration verdicts (not stock bands)", () => {
  assert.match(api.mindVerdictPill("insufficient"), /Not enough data yet/);
  assert.match(api.mindVerdictPill("well_calibrated"), /Well calibrated/);
  assert.match(api.mindVerdictPill("overconfident"), /mind-pill--overconfident/);
  // an unknown verdict degrades to a calm default, never a stock-band label
  assert.match(api.mindVerdictPill("weird"), /Still learning/);
});
check("mindUsableReasoning drops sentinels and low-confidence rows", () => {
  assert.equal(api.mindUsableReasoning({ conclusion: "insufficient_evidence", confidenceProbability: 0.9 }), false);
  assert.equal(api.mindUsableReasoning({ conclusion: "", confidenceProbability: 0.9 }), false);
  assert.equal(api.mindUsableReasoning({ conclusion: "Pads run low on Mondays.", confidenceProbability: 0.2 }), false);
  assert.equal(api.mindUsableReasoning({ conclusion: "Pads run low on Mondays.", confidenceProbability: 0.6 }), true);
});

// ── Section 1: trust ────────────────────────────────────────────────────
check("trust section surfaces both calibration headlines", () => {
  const html = api.renderMindTrustSection({
    calibration: {
      headline: "Provisional: 3 real recounts so far.",
      beliefHeadline: "Belief-state: provisional on 3 recount(s).",
      realLabeledRecounts: 3, withinToleranceRate: 0.66, readyForCalibration: false,
      beliefCalibration: { verdict: "provisional" },
    },
  });
  assert.match(html, /Can I trust these numbers yet\?/);
  assert.match(html, /Provisional: 3 real recounts/);
  assert.match(html, /Belief-state: provisional/);
  assert.match(html, /mind-pill--provisional/);
});
check("trust section degrades gracefully when calibration is null", () => {
  const html = api.renderMindTrustSection({ calibration: null });
  assert.match(html, /not available yet/);
});

// ── Section 2: count next (VoI) ─────────────────────────────────────────
check("count-next surfaces the top pick message and the rest of the top three", () => {
  const html = api.renderMindCountNextSection({
    countPriorities: {
      topPick: { itemName: "Pads", message: "If you have a minute, counting Pads would help most." },
      topThree: [
        { itemName: "Pads", voiScore: 80, reason: "We're not sure how many there are." },
        { itemName: "Soap", voiScore: 40, reason: "It may be running low." },
        { itemName: "Wipes", voiScore: 20, reason: "It's needed for every pack." },
      ],
    },
  });
  assert.match(html, /counting Pads would help most/);
  assert.match(html, /Soap/);
  assert.match(html, /Wipes/);
  // top pick (Pads) appears in the headline, not duplicated in the list rows
  assert.equal((html.match(/mind-item-name">Pads/g) || []).length, 0);
});
check("count-next shows a calm empty state when nothing stands out", () => {
  const html = api.renderMindCountNextSection({ countPriorities: { topPick: null, topThree: [] } });
  assert.match(html, /Nothing stands out/);
});

// ── Section 3: shelf confidence ─────────────────────────────────────────
check("shelf section renders stock-out risk and least-confident lists", () => {
  const html = api.renderMindShelfSection({
    beliefSummary: {
      itemCount: 7, anchoredCount: 2, lowConfidenceCount: 3,
      highestStockOutRisk: [
        { itemName: "Pads", believedQty: 8, threshold: 20, lowStockProbability: 0.8 },
      ],
      leastConfident: [
        { itemName: "Soap", band: "needs_checking", believedQty: 12, sd: 6 },
      ],
    },
  });
  assert.match(html, /Shelf confidence/);
  assert.match(html, /Pads/);
  assert.match(html, /80% chance below 20/);
  assert.match(html, /Soap/);
  assert.match(html, /±12/); // sd 6 → ±2σ = 12
});
check("shelf section handles a missing summary", () => {
  const html = api.renderMindShelfSection({ beliefSummary: null });
  assert.match(html, /not available yet/);
});

// ── Section 4: what the app noticed ─────────────────────────────────────
check("noticed section renders reasoning conclusions with confidence", () => {
  const html = api.renderMindNoticedSection({
    reasoning: {
      topThreeReasonings: [
        { conclusion: "Pads are trending down faster than donations replace them.", reasoningType: "stock_trend", confidenceProbability: 0.62 },
      ],
    },
  });
  assert.match(html, /trending down faster/);
  assert.match(html, /stock trend/); // underscores humanised
  assert.match(html, /62% sure/);
});
check("noticed section is empty-safe", () => {
  const html = api.renderMindNoticedSection({ reasoning: { topThreeReasonings: [] } });
  assert.match(html, /Nothing notable yet/);
  const html2 = api.renderMindNoticedSection({ reasoning: null });
  assert.match(html2, /Nothing notable yet/);
  // a list of only raw sentinels collapses to the empty state, not noise
  const html3 = api.renderMindNoticedSection({ reasoning: { topThreeReasonings: [
    { conclusion: "insufficient_evidence", reasoningType: "stock", confidenceProbability: 0.26 },
  ] } });
  assert.match(html3, /Nothing notable yet/);
  assert.doesNotMatch(html3, /insufficient_evidence/);
});

// ── Section 5: stock at risk (hard numbers) ─────────────────────────────
check("stock section renders buildable counts and below-line items", () => {
  const html = api.renderMindStockSection({
    buildable: [{ label: "Mom Pack", count: 4 }, { label: "Baby Pack", count: 0 }],
    lowStock: [{ name: "Pads", balance: 8, threshold: 20 }],
  });
  assert.match(html, /Mom Packs buildable now: <b>4<\/b>/);
  assert.match(html, /Baby Packs buildable now: <b>0<\/b>/);
  assert.match(html, /Pads/);
  assert.match(html, /8 on hand · line 20/);
});
check("stock section reports a clean shelf when nothing is low", () => {
  const html = api.renderMindStockSection({ buildable: [{ label: "Mom Pack", count: 9 }], lowStock: [] });
  assert.match(html, /Nothing below its reorder line/);
});

// ── Banner / honesty logic (the core principle) ─────────────────────────
check("sample data shows the sample banner, not the learning banner", () => {
  api.setModel({
    sampleData: true,
    calibration: { readyForCalibration: false, headline: "", beliefHeadline: "", beliefCalibration: {} },
    countPriorities: { topPick: null, topThree: [] },
    beliefSummary: { itemCount: 0 }, reasoning: null, lowStock: [], buildable: [],
  });
  const html = api.renderIntelligenceDashboard();
  assert.match(html, /This is sample data/);
  assert.doesNotMatch(html, /hasn't been checked against enough real recounts/);
});
check("provisional real data shows the learning banner", () => {
  api.setModel({
    sampleData: false,
    calibration: { readyForCalibration: false, headline: "", beliefHeadline: "", beliefCalibration: {} },
    countPriorities: { topPick: null, topThree: [] },
    beliefSummary: { itemCount: 0 }, reasoning: null, lowStock: [], buildable: [],
  });
  const html = api.renderIntelligenceDashboard();
  assert.match(html, /hasn't been checked against enough real recounts/);
  assert.doesNotMatch(html, /This is sample data/);
});
check("calibrated real data shows no warning banner", () => {
  api.setModel({
    sampleData: false,
    calibration: { readyForCalibration: true, headline: "Good.", beliefHeadline: "Good.", withinToleranceRate: 0.9, realLabeledRecounts: 12, beliefCalibration: { verdict: "well_calibrated" } },
    countPriorities: { topPick: null, topThree: [] },
    beliefSummary: { itemCount: 7 }, reasoning: null, lowStock: [], buildable: [],
  });
  const html = api.renderIntelligenceDashboard();
  assert.doesNotMatch(html, /mind-banner/);
});
check("full dashboard renders all five sections in trust-first order", () => {
  api.setModel({
    sampleData: false,
    calibration: { readyForCalibration: true, headline: "h", beliefHeadline: "b", withinToleranceRate: 0.9, realLabeledRecounts: 10, beliefCalibration: { verdict: "well_calibrated" } },
    countPriorities: { topPick: { itemName: "Pads", message: "count pads" }, topThree: [{ itemName: "Pads", voiScore: 80, reason: "x" }] },
    beliefSummary: { itemCount: 7, anchoredCount: 3, lowConfidenceCount: 1, highestStockOutRisk: [], leastConfident: [] },
    reasoning: { topThreeReasonings: [] },
    lowStock: [], buildable: [{ label: "Mom Pack", count: 5 }],
  });
  const html = api.renderIntelligenceDashboard();
  const order = ["Can I trust these numbers yet?", "Count this next", "Shelf confidence", "What the app has noticed", "Stock at risk"]
    .map(h => html.indexOf(h));
  assert.ok(order.every(i => i >= 0), "all five section headers present");
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "sections render in trust-first order");
});
check("dashboard survives a null model without throwing", () => {
  api.setModel(null);
  const html = api.renderIntelligenceDashboard();
  assert.match(html, /could not be assembled/);
});

console.log(`intelligence-dashboard.test.js: ${pass} checks passed`);
