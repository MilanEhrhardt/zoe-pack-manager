/*
 * Headless tests for operational context capture (Phase X1 + X2).
 *
 * Run:  node tests/operational-context.test.js
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

const STUBS = `
  const ITEMS = [{ id: "pads", name: "Pads", threshold: 20 }];
  const state = { balances: { pads: 5 } };
  const getBalance = (id) => state.balances[id] || 0;
`;

const blocks = [
  STUBS,
  getConst("RECOUNT_TOLERANCE_ABS"),
  getConst("RECOUNT_TOLERANCE_PCT"),
  getConst("OPERATIONAL_CONTEXT_VERSION"),
  extractBlock(HTML, "const OPERATIONAL_CAUSES = {"),
  extractBlock(HTML, "function operationalCauseFromId("),
  extractBlock(HTML, "function normalizeOperationalReason("),
  extractBlock(HTML, "function operationalReasonLabel("),
  extractBlock(HTML, "function recountVarianceSignificant("),
  extractBlock(HTML, "function buildCommitContext("),
  extractBlock(HTML, "function normalizeImportedTransactionContext("),
  extractBlock(HTML, "const RECIPES = {"),
  extractBlock(HTML, "function normalizeSubstitutions("),
  extractBlock(HTML, "function normalizeOmissions("),
].join("\n\n");

const api = new Function(
  `${blocks}\nreturn {
    normalizeOperationalReason,
    operationalReasonLabel,
    recountVarianceSignificant,
    buildCommitContext,
    normalizeImportedTransactionContext,
    normalizeSubstitutions,
    normalizeOmissions,
    setBalance: (id, n) => { state.balances[id] = n; },
  };`
)();

let failed = 0;
const ok = (name, cond, info) => {
  if (cond) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}${info ? "  " + info : ""}`); }
};

(() => {
  const legacy = api.normalizeOperationalReason("counting correction");
  ok("legacy string becomes legacy_text", legacy?.id === "legacy_text" && legacy.label === "counting correction");
  const structured = api.normalizeOperationalReason({ id: "stock_shortage", label: "x", category: "inventory" });
  ok("structured cause normalizes", structured?.id === "stock_shortage" && structured.label === "Not on the shelf");
  ok("empty string is null", api.normalizeOperationalReason("") === null);
  ok("label from cause id", api.operationalReasonLabel("counting_error") === "Counting mistake");
})();

(() => {
  ok("small recount variance not significant", !api.recountVarianceSignificant(240, 235));
  ok("large recount variance significant", api.recountVarianceSignificant(240, 200));
  ok("zero change not significant", !api.recountVarianceSignificant(10, 10));
})();

(() => {
  api.setBalance("pads", 12);
  const ctx = api.buildCommitContext(["pads"]);
  ok("commitContext captures balance", ctx.balances.pads === 12 && ctx.version === "ctx.1");
})();

(() => {
  const subs = api.normalizeSubstitutions([{
    insteadOf: "pads", substitute: "panties", packCount: 2, qtyPerPack: 1, reasonId: "stock_shortage",
  }]);
  ok("substitution preserves reason", subs[0].reason?.id === "stock_shortage");
  const plain = api.normalizeSubstitutions([{
    insteadOf: "pads", substitute: "panties", packCount: 1, qtyPerPack: 1,
  }]);
  ok("substitution without reason omits field", plain[0].reason === undefined);
})();

(() => {
  const tx = { type: "recount", reason: "old note" };
  api.normalizeImportedTransactionContext(tx);
  ok("import migrates recount string reason", tx.reason?.id === "legacy_text");
  const build = {
    type: "build",
    substitutions: [{ insteadOf: "a", substitute: "b", packCount: 1, qtyPerPack: 1, reason: { id: "volunteer_preference" } }],
  };
  api.normalizeImportedTransactionContext(build);
  ok("import normalizes build sub reason", build.substitutions[0].reason.id === "volunteer_preference");
})();

console.log(`\n${failed ? "FAILURES: " + failed : "all passed"}`);
process.exit(failed ? 1 : 0);
