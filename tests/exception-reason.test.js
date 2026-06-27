/*
 * Headless tests for volunteer exception reasons on build substitutions/omissions.
 *
 * Run:  node tests/exception-reason.test.js
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
  extractBlock(HTML, "const EXCEPTION_CAUSES = {"),
  extractBlock(HTML, "const LEGACY_EXCEPTION_CAUSE_MAP = {"),
  extractBlock(HTML, "function exceptionCauseFromId("),
  extractBlock(HTML, "function exceptionReasoningCause("),
  extractBlock(HTML, "function resolveExceptionCauseId("),
  extractBlock(HTML, "function normalizeExceptionReason("),
  extractBlock(HTML, "function computeExceptionReasonSummary("),
  extractBlock(HTML, "const RECIPES = {"),
  extractBlock(HTML, "function normalizeSubstitutions("),
  extractBlock(HTML, "function normalizeOmissions("),
  extractBlock(HTML, "function normalizeImportedTransactionContext("),
].join("\n\n");

const api = new Function(
  `${blocks}\nreturn {
    normalizeExceptionReason,
    exceptionReasoningCause,
    normalizeSubstitutions,
    normalizeOmissions,
    normalizeImportedTransactionContext,
    computeExceptionReasonSummary,
  };`
)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

check("substitution reason normalises to volunteer shape", () => {
  const subs = api.normalizeSubstitutions([{
    insteadOf: "soap-moms",
    substitute: "body-wash",
    packCount: 2,
    qtyPerPack: 1,
    reasonId: "not_on_shelf",
  }]);
  assert.deepEqual(subs[0].reason, {
    causeId: "not_on_shelf",
    label: "Not on shelf",
    source: "volunteer",
  });
});

check("omission reason normalises to volunteer shape", () => {
  const omits = api.normalizeOmissions([{
    itemId: "hand-cream",
    packCount: 8,
    qtyPerPack: 1,
    reasonId: "not_needed_today",
  }]);
  assert.equal(omits[0].reason.causeId, "not_needed_today");
  assert.equal(omits[0].reason.source, "volunteer");
});

check("no selected reason omits reason property", () => {
  const subs = api.normalizeSubstitutions([{
    insteadOf: "pads", substitute: "panties", packCount: 1, qtyPerPack: 1,
  }]);
  assert.equal(subs[0].reason, undefined);
});

check("invalid causeId is ignored", () => {
  assert.equal(api.normalizeExceptionReason("nonsense"), null);
  assert.equal(api.normalizeExceptionReason({ causeId: "nonsense" }), null);
});

check("legacy stock_shortage maps to not_on_shelf", () => {
  const r = api.normalizeExceptionReason({ id: "stock_shortage" });
  assert.equal(r.causeId, "not_on_shelf");
  assert.equal(r.label, "Not on shelf");
});

check("reasoningCause mapping is available without storing on tx", () => {
  assert.equal(api.exceptionReasoningCause("not_on_shelf"), "stock_shortage");
  assert.equal(api.exceptionReasoningCause("clinic_requested"), "clinic_requested");
});

check("import normalises build exception reasons and strips legacy keys", () => {
  const tx = {
    type: "build",
    substitutions: [{
      insteadOf: "a", substitute: "b", packCount: 1, qtyPerPack: 1,
      reason: { id: "volunteer_preference" },
    }],
    omissions: [{
      itemId: "c", packCount: 1, qtyPerPack: 1, reasonId: "unknown",
    }],
  };
  api.normalizeImportedTransactionContext(tx);
  assert.equal(tx.substitutions[0].reason.causeId, "volunteer_choice");
  assert.equal(tx.omissions[0].reason.causeId, "other");
  assert.equal(tx.substitutions[0].reasonId, undefined);
});

check("computeExceptionReasonSummary counts totals and byCause", () => {
  const txs = [
    {
      type: "build",
      substitutions: [
        { insteadOf: "a", substitute: "b", packCount: 1, qtyPerPack: 1, reason: { causeId: "not_on_shelf", label: "Not on shelf", source: "volunteer" } },
        { insteadOf: "c", substitute: "d", packCount: 1, qtyPerPack: 1 },
      ],
      omissions: [
        { itemId: "e", packCount: 1, qtyPerPack: 1, reason: { causeId: "not_needed_today", label: "Not needed today", source: "volunteer" } },
      ],
    },
  ];
  const s = api.computeExceptionReasonSummary(txs);
  assert.equal(s.substitutions.total, 2);
  assert.equal(s.substitutions.withReason, 1);
  assert.equal(s.substitutions.reasonCaptureRate, 0.5);
  assert.equal(s.substitutions.byCause.not_on_shelf, 1);
  assert.equal(s.omissions.total, 1);
  assert.equal(s.omissions.withReason, 1);
  assert.equal(s.omissions.byCause.not_needed_today, 1);
});

check("existing substitution save without reason still works", () => {
  const subs = api.normalizeSubstitutions([
    { insteadOf: "pads", substitute: "panties", packCount: 3, qtyPerPack: 1 },
  ]);
  assert.equal(subs.length, 1);
  assert.equal(subs[0].packCount, 3);
  assert.equal(subs[0].reason, undefined);
});

console.log(`exception-reason.test.js: ${pass} checks passed`);
