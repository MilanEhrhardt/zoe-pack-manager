/*
 * Headless tests for undo/redo snapshot restore.
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

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

const blocks = [
  "const UNDO_STACK_LIMIT = 25;",
  extractBlock(HTML, "function todayISO("),
  extractBlock(HTML, "function uid("),
  extractBlock(HTML, "function snapshotForUndo("),
  extractBlock(HTML, "function fullSnapshotForHistory("),
  extractBlock(HTML, "function trimHistoryStack("),
  extractBlock(HTML, "function restoreHistorySnapshot("),
  extractBlock(HTML, "function canUndo("),
  extractBlock(HTML, "function canRedo("),
  extractBlock(HTML, "function beginTransaction("),
  extractBlock(HTML, "function undoLast("),
  extractBlock(HTML, "function redoLast("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(`
  let state = {
    balances: { pads: 5 },
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [{ id: "1", type: "donation" }],
    undoStack: [],
    redoStack: [],
  };
  function invalidateSessionTxDerivedCache() {}
  function saveState() {}
  function render() {}
  function analyticsTrack() {}
  function analyticsOperationalSnapshot() { return {}; }
  ${blocks}
  return {
    restoreHistorySnapshot,
    undoLast,
    redoLast,
    beginTransaction,
    canUndo,
    canRedo,
    getState: () => state,
    setState: (s) => { state = s; },
  };
`)();

test("redo restores full transaction snapshot", () => {
  api.setState({
    balances: { pads: 10 },
    readyPacks: { momPack: 2, babyPack: 0 },
    transactions: [{ id: "1" }, { id: "2", type: "build" }],
    undoStack: [],
    redoStack: [],
  });
  api.restoreHistorySnapshot({
    balances: { pads: 5 },
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [{ id: "1" }],
  });
  const s = api.getState();
  assert.equal(s.balances.pads, 5);
  assert.equal(s.transactions.length, 1);
});

test("undo txCount path adds undo marker", () => {
  api.setState({
    balances: { pads: 10 },
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [{ id: "1" }, { id: "2" }],
    undoStack: [],
    redoStack: [],
  });
  api.restoreHistorySnapshot({
    balances: { pads: 5 },
    readyPacks: { momPack: 0, babyPack: 0 },
    txCount: 1,
  });
  const s = api.getState();
  assert.equal(s.balances.pads, 5);
  assert.equal(s.transactions.length, 2);
  assert.equal(s.transactions[1].type, "undo");
});

test("undo then redo round-trip restores prior state", () => {
  api.setState({
    balances: { pads: 5 },
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [{ id: "1", type: "donation" }],
    undoStack: [{
      balances: { pads: 5 },
      readyPacks: { momPack: 0, babyPack: 0 },
      transactions: [{ id: "1", type: "donation" }],
    }],
    redoStack: [],
  });
  const after = api.getState();
  after.balances.pads = 12;
  after.transactions.push({ id: "2", type: "recount", itemId: "pads", newQty: 12 });
  api.setState(after);

  assert.equal(api.getState().balances.pads, 12);
  assert.equal(api.getState().transactions.length, 2);

  api.undoLast();
  assert.equal(api.getState().balances.pads, 5);
  assert.equal(api.getState().transactions.length, 1);
  assert.ok(api.canRedo());

  api.redoLast();
  assert.equal(api.getState().balances.pads, 12);
  assert.equal(api.getState().transactions.length, 2);
  assert.ok(!api.canRedo());
});
