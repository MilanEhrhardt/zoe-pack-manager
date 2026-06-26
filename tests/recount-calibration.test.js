/*
 * Headless tests for the recount calibration feedback loop in
 * zoe-pack-manager.html.
 *
 * Run:  node tests/recount-calibration.test.js
 *
 * Like the stock-math suite, this extracts the pure derive-side functions
 * straight from the HTML source (brace-matched) so the tests track the real
 * code. The capture side (captureRecountPrediction) reads live app state and
 * is verified in-browser, not here.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

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
function getConst(name) {
  const m = new RegExp(`const ${name}\\s*=\\s*(.+?);`).exec(HTML);
  if (!m) throw new Error(`const not found: ${name}`);
  return `const ${name} = ${m[1]};`;
}

const blocks = [
  getConst("RECOUNT_CALIBRATION_MODEL_VERSION"),
  getConst("RECOUNT_TOLERANCE_ABS"),
  getConst("RECOUNT_TOLERANCE_PCT"),
  getConst("RECOUNT_MIN_LABELED"),
  "const itemName = (id) => id;", // stub — display only
  extractBlock(HTML, "function recountWithinTolerance("),
  extractBlock(HTML, "function classifyRecountVerdict("),
  extractBlock(HTML, "function buildRecountCalibrationRows("),
  extractBlock(HTML, "function rcMean("),
  extractBlock(HTML, "function rcRate("),
  extractBlock(HTML, "function buildRecountCalibration("),
  extractBlock(HTML, "function rcCalibrationLimitations("),
  extractBlock(HTML, "function recountCalibrationSummaryConcise("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(
  `${blocks}\nreturn { buildRecountCalibration, buildRecountCalibrationRows, classifyRecountVerdict, recountWithinTolerance, recountCalibrationSummaryConcise };`
)();

// Build a recount transaction carrying a prediction label.
function rc(predictedQty, actualQty, band, trustworthy, p, synthetic = false) {
  return {
    type: "recount", itemId: "x", date: "2026-06-01", newQty: actualQty,
    prediction: {
      predictedQty, confidenceBand: band, predictedTrustworthy: trustworthy,
      confidenceProbability: p, syntheticAtCapture: synthetic,
    },
  };
}

let failed = 0;
const check = (name, got, want) => {
  try { assert.deepEqual(got, want); console.log(`PASS  ${name}`); }
  catch { failed++; console.log(`FAIL  ${name}`);
    console.log(`   got     : ${JSON.stringify(got)}`);
    console.log(`   expected: ${JSON.stringify(want)}`); }
};
const checkTrue = (name, cond) => { if (cond) console.log(`PASS  ${name}`); else { failed++; console.log(`FAIL  ${name}`); } };

// --- verdict classification (the core logic) ---
check("verdict: sure + right = confident_correct", api.classifyRecountVerdict(true, true), "confident_correct");
check("verdict: sure + wrong = overconfident", api.classifyRecountVerdict(true, false), "overconfident");
check("verdict: flagged + wrong = flagged_correctly", api.classifyRecountVerdict(false, false), "flagged_correctly");
check("verdict: flagged + right = false_alarm", api.classifyRecountVerdict(false, true), "false_alarm");

// --- tolerance: absolute and percentage paths ---
checkTrue("tolerance: abs path (err 2 of 50 ok)", api.recountWithinTolerance(2, 50) === true);
checkTrue("tolerance: abs fail (err 3 of 5 -> pct saves? 0.6 no)", api.recountWithinTolerance(3, 5) === false);
checkTrue("tolerance: pct path (err 9 of 109 ~0.08 ok)", api.recountWithinTolerance(9, 109) === true);
checkTrue("tolerance: both fail (err 30 of 80)", api.recountWithinTolerance(30, 80) === false);

// --- empty input ---
(() => {
  const cal = api.buildRecountCalibration([]);
  check("empty: totals", [cal.totalLabeledRecounts, cal.realLabeledRecounts, cal.readyForCalibration], [0, 0, false]);
  const s = api.recountCalibrationSummaryConcise(cal);
  checkTrue("empty: headline mentions no recounts", /no real recounts/i.test(s.headline));
})();

// --- mixed dataset: 8 real + 1 synthetic, two of each verdict ---
const txs = [
  rc(50, 51, "trusted", true, 0.9),          // within  -> confident_correct
  rc(50, 80, "trusted", true, 0.9),          // wrong   -> overconfident
  rc(50, 80, "needs_checking", false, 0.2),  // wrong   -> flagged_correctly
  rc(50, 51, "needs_checking", false, 0.2),  // within  -> false_alarm
  rc(100, 109, "trusted", true, 0.85),       // within(pct) -> confident_correct
  rc(20, 40, "probably_right", true, 0.65),  // wrong   -> overconfident
  rc(10, 8, "uncertain", false, 0.35),       // within  -> false_alarm (overstated by 2)
  rc(30, 60, "uncertain", false, 0.35),      // wrong   -> flagged_correctly
  rc(5, 99, "trusted", true, 0.95, true),    // SYNTHETIC -> excluded from rates
];
const cal = api.buildRecountCalibration(txs);

check("counts: total vs real (synthetic excluded)",
  [cal.totalLabeledRecounts, cal.realLabeledRecounts, cal.syntheticLabeledRecounts], [9, 8, 1]);
check("readyForCalibration at 8 real", cal.readyForCalibration, true);
check("verdictCounts (2 of each)", cal.verdictCounts,
  { confident_correct: 2, overconfident: 2, flagged_correctly: 2, false_alarm: 2 });
check("withinToleranceRate = 4/8", cal.withinToleranceRate, 0.5);
check("overconfidenceRate = 2/4 trustworthy", cal.overconfidenceRate, 0.5);
check("catchRate = 2/4 wrong", cal.catchRate, 0.5);
check("falseAlarmRate = 2/4 flagged", cal.falseAlarmRate, 0.5);
checkTrue("meanSignedError positive (model undercounts here)", cal.meanSignedError > 0);
checkTrue("brierScore within (0,1)", cal.brierScore > 0 && cal.brierScore < 1);
check("per-band trusted: 3 rows, 2 within tolerance",
  [cal.byBand.trusted.count, cal.byBand.trusted.withinToleranceRate], [3, Math.round((2 / 3) * 100) / 100]);
check("trackRecord newest-first", cal.trackRecord[0].actualQty, 99);

const summary = api.recountCalibrationSummaryConcise(cal);
checkTrue("summary headline reports a match rate", /matched 50% of 8 recounts/i.test(summary.headline));

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
