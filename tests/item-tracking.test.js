/*
 * Headless tests for the item tracking-mode model (exact | rough) in
 * zoe-pack-manager.html — Section 1 of the catalogue & counting-model design.
 *
 * Run:  node tests/item-tracking.test.js
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
  const m = new RegExp(`const ${name}\\s*=\\s*([\\s\\S]+?);`).exec(HTML);
  if (!m) throw new Error(`const not found: ${name}`);
  return `const ${name} = ${m[1]};`;
}

const STUBS = `
  let ITEMS = [
    { id: "pads",    name: "Pads",          category: "Moms",        unit: "packet", threshold: 20 },
    { id: "beanies", name: "Cotton Beanies", category: "Baby Clothes", unit: "each",  threshold: 10, tracking: "rough" },
  ];
  const itemMap = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  const BASE_ITEMS = ITEMS.slice();
  let state = { balances: {}, customItems: [], itemTracking: {} };
  let __saves = 0;
  const saveState = () => { __saves++; };
`;

const harness = `
  ${STUBS}
  ${getConst("CUSTOM_ITEMS_MAX")}
  ${getConst("CATALOGUE_CATEGORIES")}
  ${extractBlock(HTML, "function item(")}
  ${extractBlock(HTML, "function slugifyItemId(")}
  ${extractBlock(HTML, "function makeCustomItemId(")}
  ${extractBlock(HTML, "function normalizeCustomItem(")}
  ${extractBlock(HTML, "function rebuildItemMap(")}
  ${extractBlock(HTML, "function setCatalogueCustomItems(")}
  ${extractBlock(HTML, "function addCustomItem(")}
  ${extractBlock(HTML, "function itemTrackingMode(")}
  ${extractBlock(HTML, "function isRoughItem(")}
  ${extractBlock(HTML, "function setItemTracking(")}
  return {
    itemTrackingMode, isRoughItem, setItemTracking, addCustomItem, normalizeCustomItem,
    state: () => state,
    setState: (s) => { state = s; setCatalogueCustomItems(s.customItems || []); },
  };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

function fresh() { api.setState({ balances: {}, customItems: [], itemTracking: {} }); }

// ── resolution ─────────────────────────────────────────────────────────────
check("a plain item defaults to exact", () => {
  fresh();
  assert.equal(api.itemTrackingMode("pads"), "exact");
  assert.equal(api.isRoughItem("pads"), false);
});
check("an item pre-marked tracking:'rough' in config reads rough", () => {
  fresh();
  assert.equal(api.isRoughItem("beanies"), true);
});
check("the override map wins over the item's own mode", () => {
  api.setState({ balances: {}, customItems: [], itemTracking: { pads: "rough", beanies: "exact" } });
  assert.equal(api.isRoughItem("pads"), true, "override makes an exact item rough");
  assert.equal(api.isRoughItem("beanies"), false, "override makes a rough item exact");
});
check("unknown item resolves to exact (never throws)", () => {
  fresh();
  assert.equal(api.itemTrackingMode("nope"), "exact");
});

// ── custom items carry tracking ─────────────────────────────────────────────
check("addCustomItem persists tracking:'rough' on the item and its definition", () => {
  fresh();
  const r = api.addCustomItem({ name: "Booties", category: "Baby Clothes", unit: "each", threshold: 0, tracking: "rough" });
  assert.equal(r.ok, true);
  assert.equal(r.item.tracking, "rough");
  assert.equal(api.isRoughItem(r.item.id), true);
  const def = api.state().customItems.find(c => c.id === r.item.id);
  assert.equal(def.tracking, "rough", "round-trips in the persisted definition");
});
check("addCustomItem defaults tracking to exact; invalid value coerces to exact", () => {
  fresh();
  assert.equal(api.addCustomItem({ name: "Plain" }).item.tracking, "exact");
  fresh();
  assert.equal(api.addCustomItem({ name: "Weird", tracking: "kinda" }).item.tracking, "exact");
});

// ── setItemTracking (override writer, minimal map) ──────────────────────────
check("setItemTracking stores an override only when it differs from the base", () => {
  fresh();
  assert.equal(api.setItemTracking("pads", "rough"), true);
  assert.equal(api.state().itemTracking.pads, "rough");
  assert.equal(api.isRoughItem("pads"), true);
  // reverting to the item's base (exact) clears the override rather than storing it
  api.setItemTracking("pads", "exact");
  assert.equal(api.state().itemTracking.pads, undefined, "map stays minimal");
  assert.equal(api.isRoughItem("pads"), false);
});
check("setItemTracking can override a config-rough item back to exact", () => {
  fresh();
  api.setItemTracking("beanies", "exact");
  assert.equal(api.state().itemTracking.beanies, "exact", "stored because it differs from base 'rough'");
  assert.equal(api.isRoughItem("beanies"), false);
});
check("setItemTracking rejects unknown items and invalid modes", () => {
  fresh();
  assert.equal(api.setItemTracking("nope", "rough"), false);
  assert.equal(api.setItemTracking("pads", "sideways"), false);
});

console.log(`item-tracking.test.js: ${pass} checks passed`);
