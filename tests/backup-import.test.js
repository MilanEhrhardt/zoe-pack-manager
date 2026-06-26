/*
 * Headless tests for backup import normalization in zoe-pack-manager.html.
 *
 * Run: node tests/backup-import.test.js
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

function extractBlock(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  const braceStart = anchor.trimEnd().endsWith("{")
    ? start + anchor.length - 1
    : src.indexOf("{", start);
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

function extractArray(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  const bracketStart = src.indexOf("[", start);
  let depth = 0;
  for (let j = bracketStart; j < src.length; j++) {
    if (src[j] === "[") depth++;
    else if (src[j] === "]" && --depth === 0) {
      const end = src[j + 1] === ";" ? j + 2 : j + 1;
      return src.slice(start, end);
    }
  }
  throw new Error(`unbalanced brackets after: ${anchor}`);
}

const blocks = [
  extractBlock(HTML, "function item(id, name, category, unit, threshold, extra = {}) {"),
  extractArray(HTML, "const ITEMS = ["),
  "const UNDO_STACK_LIMIT = 25;",
  "const BACKUP_IMPORT_MAX_BYTES = 10 * 1024 * 1024;",
  "const BACKUP_IMPORT_MAX_TRANSACTIONS = 50000;",
  "const BACKUP_IMPORT_MAX_DONORS = 5000;",
  "var ANALYTICS_SCHEMA_VERSION = \"1.3.0\";",
  "var ANALYTICS_MAX_EVENTS = 50000;",
  extractBlock(HTML, "function normalizeDonorName("),
  extractBlock(HTML, "function donorMatches("),
  extractBlock(HTML, "function extractDonorsFromTransactions("),
  extractBlock(HTML, "function analyticsId("),
  extractBlock(HTML, "function analyticsUpgradeState("),
  extractBlock(HTML, "function normalizeImportedState("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const {
  ITEMS,
  UNDO_STACK_LIMIT,
  BACKUP_IMPORT_MAX_TRANSACTIONS,
  BACKUP_IMPORT_MAX_DONORS,
  ANALYTICS_MAX_EVENTS,
  normalizeImportedState,
} = new Function(`${blocks}\nreturn { ITEMS, UNDO_STACK_LIMIT, BACKUP_IMPORT_MAX_TRANSACTIONS, BACKUP_IMPORT_MAX_DONORS, ANALYTICS_MAX_EVENTS, normalizeImportedState };`)();

function minimalBackup(overrides = {}) {
  const balances = {};
  ITEMS.forEach(i => { balances[i.id] = 0; });
  return {
    balances,
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [],
    undoStack: [],
    donors: [],
    packContext: "momPack",
    lastSelectedPacker: "",
    ...overrides,
  };
}

let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log("backup-import normalization tests\n");

test("rejects backup without balances", () => {
  assert.throws(() => normalizeImportedState({}), /Invalid backup file/);
  assert.throws(() => normalizeImportedState({ balances: null }), /Invalid backup file/);
});

test("fills missing item balances and defaults", () => {
  const { state, trim } = normalizeImportedState({ balances: { pads: 5 } });
  ITEMS.forEach(i => {
    assert.equal(state.balances[i.id], i.id === "pads" ? 5 : 0);
  });
  assert.deepEqual(state.readyPacks, { momPack: 0, babyPack: 0 });
  assert.deepEqual(state.transactions, []);
  assert.equal(state.packContext, "momPack");
  assert.equal(state.lastSelectedPacker, "");
  assert.ok(state.analytics.installId);
  assert.equal(trim.transactionsTrimmed, 0);
});

test("migrates undoSnapshot to undoStack", () => {
  const snap = { balances: { pads: 1 }, readyPacks: { momPack: 0, babyPack: 0 }, txCount: 0 };
  const { state } = normalizeImportedState(minimalBackup({
    undoSnapshot: snap,
    undoStack: undefined,
  }));
  assert.deepEqual(state.undoStack, [snap]);
  assert.equal(state.undoSnapshot, undefined);
});

test("clamps undoStack to UNDO_STACK_LIMIT keeping most recent", () => {
  const stacks = Array.from({ length: UNDO_STACK_LIMIT + 10 }, (_, i) => ({
    balances: { pads: i },
    readyPacks: { momPack: 0, babyPack: 0 },
    txCount: i,
  }));
  const { state, trim } = normalizeImportedState(minimalBackup({ undoStack: stacks }));
  assert.equal(state.undoStack.length, UNDO_STACK_LIMIT);
  assert.equal(state.undoStack[0].txCount, 10);
  assert.equal(state.undoStack[state.undoStack.length - 1].txCount, UNDO_STACK_LIMIT + 9);
  assert.equal(trim.undoStackTrimmed, 10);
});

test("clamps redoStack to UNDO_STACK_LIMIT keeping most recent", () => {
  const stacks = Array.from({ length: UNDO_STACK_LIMIT + 5 }, (_, i) => ({
    balances: { pads: i },
    readyPacks: { momPack: 0, babyPack: 0 },
    transactions: [{ id: `tx-${i}` }],
  }));
  const { state, trim } = normalizeImportedState(minimalBackup({ redoStack: stacks }));
  assert.equal(state.redoStack.length, UNDO_STACK_LIMIT);
  assert.equal(state.redoStack[0].balances.pads, 5);
  assert.equal(state.redoStack[state.redoStack.length - 1].balances.pads, UNDO_STACK_LIMIT + 4);
  assert.equal(trim.redoStackTrimmed, 5);
});

test("clears redoStack when transactions are trimmed", () => {
  const transactions = Array.from({ length: BACKUP_IMPORT_MAX_TRANSACTIONS + 10 }, (_, i) => ({
    id: `tx-${i}`,
    type: "donation",
    date: "2026-01-01",
    lines: [],
  }));
  const redoStack = [{ balances: { pads: 1 }, readyPacks: { momPack: 0, babyPack: 0 }, transactions: [{ id: "old" }] }];
  const { state, trim } = normalizeImportedState(minimalBackup({ transactions, redoStack }));
  assert.equal(state.redoStack.length, 0);
  assert.equal(trim.redoStackCleared, 1);
  assert.equal(trim.transactionsTrimmed, 10);
});

test("trims analytics events to ANALYTICS_MAX_EVENTS keeping most recent", () => {
  const events = Array.from({ length: ANALYTICS_MAX_EVENTS + 100 }, (_, i) => ({ event: "x", i }));
  const { state, trim } = normalizeImportedState(minimalBackup({
    analytics: { events },
  }));
  assert.equal(state.analytics.events.length, ANALYTICS_MAX_EVENTS);
  assert.equal(state.analytics.events[0].i, 100);
  assert.equal(trim.analyticsEventsTrimmed, 100);
});

test("caps transactions keeping most recent", () => {
  const transactions = Array.from({ length: BACKUP_IMPORT_MAX_TRANSACTIONS + 50 }, (_, i) => ({
    id: `tx-${i}`,
    type: "donation",
    donor: `Donor ${i}`,
    date: "2026-01-01",
    lines: [],
  }));
  const { state, trim } = normalizeImportedState(minimalBackup({ transactions }));
  assert.equal(state.transactions.length, BACKUP_IMPORT_MAX_TRANSACTIONS);
  assert.equal(state.transactions[0].id, "tx-50");
  assert.equal(trim.transactionsTrimmed, 50);
});

test("rebuilds donors from transactions when missing", () => {
  const { state } = normalizeImportedState(minimalBackup({
    donors: [],
    transactions: [
      { type: "donation", donor: "Zaida", date: "2026-01-01", lines: [] },
      { type: "donation", donor: "Angel Network", date: "2026-01-02", lines: [] },
      { type: "build", packer: "Janet", date: "2026-01-03" },
    ],
  }));
  assert.deepEqual(state.donors, ["Angel Network", "Zaida"]);
});

test("caps oversized donor list", () => {
  const donors = Array.from({ length: BACKUP_IMPORT_MAX_DONORS + 5 }, (_, i) => `Donor ${i}`);
  const { state, trim } = normalizeImportedState(minimalBackup({ donors }));
  assert.equal(state.donors.length, BACKUP_IMPORT_MAX_DONORS);
  assert.equal(trim.donorsTrimmed, 5);
});

console.log(`\n${passed} passed`);
