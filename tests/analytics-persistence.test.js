/*
 * Headless tests for coalesced analytics persistence in zoe-pack-manager.html.
 *
 * Run:  node tests/analytics-persistence.test.js
 *
 * Extracts persistStateSoon / flushPendingPersist straight from the HTML
 * (brace-matched) so the tests track the real code. setTimeout/clearTimeout
 * and saveState are stubbed so the debounce can be driven deterministically.
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
function getVar(name) {
  const m = new RegExp(`var ${name}\\s*=\\s*(.+?);`).exec(HTML);
  if (!m) throw new Error(`var not found: ${name}`);
  return `var ${name} = ${m[1]};`;
}

// Deterministic timer + saveState stubs.
const STUBS = `
  let __saves__ = 0;
  let __timers__ = [];
  let __nextId__ = 1;
  function saveState() { __saves__++; }
  function setTimeout(fn, ms) { const id = __nextId__++; __timers__.push({ id, fn }); return id; }
  function clearTimeout(id) { __timers__ = __timers__.filter(t => t.id !== id); }
`;

const harness = `
  ${STUBS}
  ${getVar("ANALYTICS_PERSIST_DEBOUNCE_MS")}
  var analyticsPersistTimer = null;
  ${extractBlock(HTML, "function persistStateSoon(")}
  ${extractBlock(HTML, "function flushPendingPersist(")}
  return {
    persistStateSoon, flushPendingPersist,
    saves: () => __saves__,
    pendingTimers: () => __timers__.length,
    fireTimers: () => { const t = __timers__; __timers__ = []; t.forEach(x => x.fn()); },
    debounceMs: ANALYTICS_PERSIST_DEBOUNCE_MS,
  };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

check("debounce window is a sane positive value", () => {
  assert.ok(api.debounceMs > 0 && api.debounceMs <= 5000, `got ${api.debounceMs}`);
});
check("persistStateSoon does not write immediately — it schedules one timer", () => {
  assert.equal(api.saves(), 0);
  api.persistStateSoon();
  assert.equal(api.saves(), 0, "no synchronous write");
  assert.equal(api.pendingTimers(), 1, "one timer scheduled");
});
check("a burst of calls coalesces to a single pending write", () => {
  api.persistStateSoon();
  api.persistStateSoon();
  api.persistStateSoon();
  assert.equal(api.pendingTimers(), 1, "still just one timer");
  assert.equal(api.saves(), 0);
});
check("firing the timer performs exactly one write and clears the schedule", () => {
  api.fireTimers();
  assert.equal(api.saves(), 1, "one coalesced write");
  // after firing, a new call schedules afresh
  api.persistStateSoon();
  assert.equal(api.pendingTimers(), 1);
});
check("flushPendingPersist writes immediately and cancels the pending timer", () => {
  // a timer is pending from the previous check
  assert.equal(api.pendingTimers(), 1);
  const before = api.saves();
  api.flushPendingPersist();
  assert.equal(api.saves(), before + 1, "immediate synchronous write");
  assert.equal(api.pendingTimers(), 0, "pending timer cancelled (no double write)");
});
check("flushPendingPersist with nothing pending still writes once (beforeunload safety)", () => {
  assert.equal(api.pendingTimers(), 0);
  const before = api.saves();
  api.flushPendingPersist();
  assert.equal(api.saves(), before + 1);
});

console.log(`analytics-persistence.test.js: ${pass} checks passed`);
