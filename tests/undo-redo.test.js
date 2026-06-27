/*
 * Headless tests for the light undo/redo history in zoe-pack-manager.html.
 *
 * Run:  node tests/undo-redo.test.js
 *
 * Extracts the real snapshot/undo/redo functions (brace-matched). state and the
 * side-effecting globals (saveState/render/analytics/cache) are stubbed so undo
 * and redo can be driven and asserted deterministically.
 *
 * History snapshots are light: balances + readyPacks are cloned, but the
 * append-only transactions log is never deep-cloned — undo truncates to a saved
 * length and redo re-appends the saved tail. Legacy full snapshots (older saved
 * state) are still restored for backward compatibility.
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
  let state = null;
  const saveState = () => {};
  const render = () => {};
  const analyticsTrack = () => {};
  const analyticsOperationalSnapshot = () => ({});
  const invalidateSessionTxDerivedCache = () => {};
  let __uid = 0;
  const uid = () => "id" + (++__uid);
  const todayISO = () => "2026-06-27";
`;

const harness = `
  ${STUBS}
  ${getConst("UNDO_STACK_LIMIT")}
  ${extractBlock(HTML, "function snapshotForUndo(")}
  ${extractBlock(HTML, "function cloneBalancesAndPacks(")}
  ${extractBlock(HTML, "function trimHistoryStack(")}
  ${extractBlock(HTML, "function applyHistorySnapshot(")}
  ${extractBlock(HTML, "function beginTransaction(")}
  ${extractBlock(HTML, "function canUndo(")}
  ${extractBlock(HTML, "function canRedo(")}
  ${extractBlock(HTML, "function undoLast(")}
  ${extractBlock(HTML, "function redoLast(")}
  // mirrors finishTransaction's effect without the analytics machinery
  function commit(tx, delta) {
    beginTransaction();
    state.transactions.push(tx);
    for (const k of Object.keys(delta || {})) state.balances[k] = (state.balances[k] || 0) + delta[k];
  }
  return {
    undoLast, redoLast, canUndo, canRedo, commit, trimHistoryStack, UNDO_STACK_LIMIT,
    setState: (s) => { state = s; },
    get: () => state,
  };
`;
const api = new Function(harness)();

function freshState() {
  return { balances: { pads: 10 }, readyPacks: {}, transactions: [], undoStack: [], redoStack: [] };
}

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

check("undo restores balances and truncates the log — with no 'undo' marker", () => {
  api.setState(freshState());
  api.commit({ id: "t1", type: "build" }, { pads: -3 });
  assert.equal(api.get().balances.pads, 7);
  api.undoLast();
  const s = api.get();
  assert.equal(s.balances.pads, 10, "balance restored");
  assert.equal(s.transactions.length, 0, "log truncated");
  assert.ok(!s.transactions.some(t => t.type === "undo"), "no synthetic undo marker injected");
  assert.equal(api.canRedo(), true);
});

check("redo re-applies the undone commit (balance + the exact tx)", () => {
  api.setState(freshState());
  api.commit({ id: "t1", type: "build" }, { pads: -3 });
  api.undoLast();
  api.redoLast();
  const s = api.get();
  assert.equal(s.balances.pads, 7, "balance re-applied");
  assert.equal(s.transactions.length, 1);
  assert.equal(s.transactions[0].id, "t1", "the original tx is restored, not a clone/marker");
  assert.equal(api.canRedo(), false);
});

check("multi-level undo then redo round-trips in order", () => {
  api.setState(freshState());
  api.commit({ id: "A", type: "build" }, { pads: -2 }); // pads 8
  api.commit({ id: "B", type: "build" }, { pads: -5 }); // pads 3
  api.undoLast(); // -> pads 8, [A]
  api.undoLast(); // -> pads 10, []
  let s = api.get();
  assert.equal(s.balances.pads, 10);
  assert.equal(s.transactions.length, 0);
  api.redoLast(); // -> pads 8, [A]
  assert.equal(api.get().balances.pads, 8);
  assert.deepEqual(api.get().transactions.map(t => t.id), ["A"]);
  api.redoLast(); // -> pads 3, [A,B]
  s = api.get();
  assert.equal(s.balances.pads, 3);
  assert.deepEqual(s.transactions.map(t => t.id), ["A", "B"]);
});

check("a new commit after undo clears the redo chain", () => {
  api.setState(freshState());
  api.commit({ id: "A", type: "build" }, { pads: -2 });
  api.undoLast();
  assert.equal(api.canRedo(), true);
  api.commit({ id: "C", type: "build" }, { pads: -1 });
  assert.equal(api.canRedo(), false, "new save clears redo");
});

check("history snapshots never deep-clone the transactions log (perf invariant)", () => {
  api.setState(freshState());
  api.commit({ id: "A", type: "build" }, { pads: -2 });
  api.undoLast();
  const redo = api.get().redoStack[0];
  assert.ok(Array.isArray(redo.tail), "redo entry stores a small tail");
  assert.equal(redo.transactions, undefined, "redo entry does NOT store a full transactions clone");
});

check("backward-compatible: a legacy full redo snapshot still restores", () => {
  const s = freshState();
  s.redoStack = [{ balances: { pads: 99 }, readyPacks: {}, transactions: [{ id: "L", type: "build" }] }];
  api.setState(s);
  api.redoLast();
  assert.equal(api.get().balances.pads, 99);
  assert.deepEqual(api.get().transactions.map(t => t.id), ["L"]);
});

check("backward-compatible: a legacy full undo snapshot still restores", () => {
  const s = freshState();
  s.transactions = [{ id: "X" }, { id: "Y" }];
  s.balances.pads = 1;
  s.undoStack = [{ balances: { pads: 5 }, readyPacks: {}, transactions: [{ id: "X" }] }];
  api.setState(s);
  api.undoLast();
  assert.equal(api.get().balances.pads, 5);
  assert.deepEqual(api.get().transactions.map(t => t.id), ["X"]);
  assert.deepEqual(api.get().redoStack[0].tail.map(t => t.id), ["Y"], "removed tail captured for redo");
});

check("trimHistoryStack caps a stack at UNDO_STACK_LIMIT (drops oldest)", () => {
  const stack = Array.from({ length: api.UNDO_STACK_LIMIT + 7 }, (_, i) => ({ i }));
  api.trimHistoryStack(stack);
  assert.equal(stack.length, api.UNDO_STACK_LIMIT);
  assert.equal(stack[0].i, 7, "oldest entries dropped, newest kept");
});

console.log(`undo-redo.test.js: ${pass} checks passed`);
