/*
 * Headless tests for the custom donor autocomplete in zoe-pack-manager.html
 * (replaces the native <datalist>).
 *
 * Run:  node tests/donor-autocomplete.test.js
 *
 * Extracts the pure matching + label functions straight from the HTML
 * (brace-matched) so the tests track the real code. `getDonors` and `esc`
 * are stubbed; `normalizeDonorName` is the real extracted source.
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

// esc mirrors the app's div.textContent→innerHTML escaping (& < >).
const STUBS = `
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let __DONORS__ = [];
  let __TX__ = [];
  const getDonors = () => __DONORS__;
  const state = { get transactions() { return __TX__; } };
`;

const harness = `
  ${STUBS}
  ${extractBlock(HTML, "function normalizeDonorName(")}
  ${getConst("DONOR_SUGGEST_LIMIT")}
  ${extractBlock(HTML, "function donorDonationCounts(")}
  ${extractBlock(HTML, "function donorsRankedByPopularity(")}
  ${extractBlock(HTML, "function donorSuggestMatches(")}
  ${extractBlock(HTML, "function donorSuggestLabel(")}
  return {
    DONOR_SUGGEST_LIMIT, donorDonationCounts, donorsRankedByPopularity,
    donorSuggestMatches, donorSuggestLabel,
    setDonors: (d) => { __DONORS__ = d; },
    setTransactions: (t) => { __TX__ = t; },
  };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

const DONORS = [
  "Angel Network", "Anonymous", "Baby products — Mitchell's Plain",
  "Mitchell's Plain church", "St Michael's — Mowbray", "Huggies / Dianna",
];
const TX = [
  { type: "donation", date: "2026-01-01", donor: "Milan" },
  { type: "donation", date: "2026-02-01", donor: "Milan" },
  { type: "donation", date: "2026-03-01", donor: "Milan" },
  { type: "donation", date: "2026-01-15", donor: "Angel Network" },
  { type: "donation", date: "2026-01-20", donor: "Angel Network" },
  { type: "donation", date: "2026-04-01", donor: "Huggies / Dianna" },
  { type: "build", date: "2026-04-02", donor: "ignored" },
];
api.setDonors(DONORS);
api.setTransactions(TX);

// ── popularity ranking ───────────────────────────────────────────────────
check("empty query returns most frequent donors first", () => {
  const m = api.donorSuggestMatches("");
  assert.equal(m[0], "Milan");
  assert.equal(m[1], "Angel Network");
  assert.equal(m[2], "Huggies / Dianna");
});
check("donors only in transactions still appear when ranked", () => {
  api.setDonors(["Angel Network"]);
  api.setTransactions([{ type: "donation", date: "2026-01-01", donor: "Milan" }]);
  assert.deepEqual(api.donorSuggestMatches(""), ["Milan", "Angel Network"]);
  api.setDonors(DONORS);
  api.setTransactions(TX);
});
check("empty query returns all donors capped at the limit", () => {
  api.setDonors(Array.from({ length: 20 }, (_, i) => `Donor ${i}`));
  api.setTransactions(Array.from({ length: 20 }, (_, i) => ({
    type: "donation", date: "2026-01-01", donor: `Donor ${i}`,
  })));
  assert.equal(api.donorSuggestMatches("").length, api.DONOR_SUGGEST_LIMIT);
  api.setDonors(DONORS);
  api.setTransactions(TX);
});

// ── matching ─────────────────────────────────────────────────────────────
check("matches are case-insensitive and substring (mid-word counts)", () => {
  const m = api.donorSuggestMatches("mi");
  assert.ok(m.includes("Milan"));
  assert.ok(m.includes("Baby products — Mitchell's Plain"));
  assert.ok(m.includes("Mitchell's Plain church"));
  assert.ok(m.includes("St Michael's — Mowbray"));
});
check("prefix matches rank above mid-string at same frequency", () => {
  api.setDonors(["Milan", "St Michael's — Mowbray"]);
  api.setTransactions([
    { type: "donation", date: "2026-01-01", donor: "Milan" },
    { type: "donation", date: "2026-01-02", donor: "St Michael's — Mowbray" },
  ]);
  const m = api.donorSuggestMatches("mi");
  assert.equal(m[0], "Milan");
  api.setDonors(DONORS);
  api.setTransactions(TX);
});
check("query is trimmed before matching", () => {
  assert.deepEqual(api.donorSuggestMatches("  angel  "), ["Angel Network"]);
});
check("no matches returns an empty list", () => {
  assert.deepEqual(api.donorSuggestMatches("zzz"), []);
});
check("results are capped at DONOR_SUGGEST_LIMIT", () => {
  api.setDonors(Array.from({ length: 30 }, (_, i) => `Match ${i}`));
  api.setTransactions(Array.from({ length: 30 }, (_, i) => ({
    type: "donation", date: "2026-01-01", donor: `Match ${i}`,
  })));
  assert.equal(api.donorSuggestMatches("match").length, api.DONOR_SUGGEST_LIMIT);
  api.setDonors(DONORS);
  api.setTransactions(TX);
});

// ── label (highlight + escaping) ───────────────────────────────────────────
check("label wraps the matched span in <mark>, preserving original case", () => {
  // esc escapes & < > only (mirrors div.textContent→innerHTML); apostrophes pass through
  assert.equal(api.donorSuggestLabel("Mitchell's Plain church", "mi"), "<mark>Mi</mark>tchell's Plain church");
});
check("label highlights a mid-string match", () => {
  assert.equal(api.donorSuggestLabel("St Michael's", "mich"), "St <mark>Mich</mark>ael's");
});
check("empty query yields a plain escaped label with no <mark>", () => {
  const out = api.donorSuggestLabel("Angel Network", "");
  assert.equal(out, "Angel Network");
  assert.doesNotMatch(out, /<mark>/);
});
check("label escapes HTML so donor names can't inject markup (XSS-safe)", () => {
  const out = api.donorSuggestLabel("<script>x</script>", "scr");
  // Each slice is escaped independently, so the only tags emitted are our own
  // <mark>; the donor's angle brackets are always escaped — no executable markup.
  assert.doesNotMatch(out, /<script/);            // raw tag never emitted
  assert.match(out, /&lt;/);                       // < escaped
  assert.match(out, /&gt;/);                       // > escaped
  assert.match(out, /<mark>scr<\/mark>/);          // match still highlighted
});
check("label falls back to plain escaped name when query isn't found", () => {
  assert.equal(api.donorSuggestLabel("Angel Network", "zzz"), "Angel Network");
});

console.log(`donor-autocomplete.test.js: ${pass} checks passed`);
