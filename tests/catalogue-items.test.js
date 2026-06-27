/*
 * Headless tests for the editable catalogue (add custom items) in
 * zoe-pack-manager.html.
 *
 * Run:  node tests/catalogue-items.test.js
 *
 * Extracts the real catalogue functions (brace-matched). ITEMS/itemMap/
 * BASE_ITEMS/state/saveState are stubbed so add + merge + reset can be driven
 * deterministically.
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
    { id: "pads", name: "Pads", category: "Moms", unit: "packet", threshold: 20 },
    { id: "deo",  name: "Deo",  category: "Moms", unit: "each",   threshold: 15 },
  ];
  const itemMap = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  const BASE_ITEMS = ITEMS.slice();
  let state = { balances: {}, customItems: [] };
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
  return {
    slugifyItemId, makeCustomItemId, normalizeCustomItem, setCatalogueCustomItems, addCustomItem,
    CUSTOM_ITEMS_MAX,
    ITEMS: () => ITEMS,
    itemMap: () => itemMap,
    state: () => state,
    saves: () => __saves,
    // reset the live catalogue too, not just state — ITEMS/itemMap are module-global
    setState: (s) => { state = s; setCatalogueCustomItems(s.customItems || []); },
  };
`;
const api = new Function(harness)();

let pass = 0;
function check(name, fn) {
  try { fn(); pass++; }
  catch (e) { console.error(`FAIL: ${name}\n  ${e.message}`); process.exitCode = 1; }
}

// ── slug + id ──────────────────────────────────────────────────────────────
check("slugifyItemId kebab-cases and strips punctuation", () => {
  assert.equal(api.slugifyItemId("Lip Balm"), "lip-balm");
  assert.equal(api.slugifyItemId("  Crazy!!  Stuff "), "crazy-stuff");
  assert.equal(api.slugifyItemId(""), "item");
});
check("makeCustomItemId prefixes with custom- and never collides with built-ins", () => {
  assert.equal(api.makeCustomItemId("Pads"), "custom-pads"); // no clash with built-in "pads"
});

// ── add happy path ─────────────────────────────────────────────────────────
check("addCustomItem adds to catalogue, state, balances; saves", () => {
  api.setState({ balances: {}, customItems: [] });
  const r = api.addCustomItem({ name: "Lip Balm", category: "Moms", unit: "each", threshold: "5" });
  assert.equal(r.ok, true);
  assert.equal(r.item.id, "custom-lip-balm");
  assert.ok(api.ITEMS().some(i => i.id === "custom-lip-balm"), "in ITEMS");
  assert.ok(api.itemMap()["custom-lip-balm"], "in itemMap");
  assert.equal(api.state().customItems.length, 1);
  assert.equal(api.state().balances["custom-lip-balm"], 0, "starts at 0 on the shelf");
  assert.equal(r.item.threshold, 5);
  assert.equal(r.item.custom, true);
  assert.ok(api.saves() > 0, "persisted");
});

// ── validation ─────────────────────────────────────────────────────────────
check("addCustomItem rejects empty name", () => {
  api.setState({ balances: {}, customItems: [] });
  assert.equal(api.addCustomItem({ name: "   " }).ok, false);
});
check("addCustomItem rejects a duplicate name (case-insensitive, built-in or custom)", () => {
  api.setState({ balances: {}, customItems: [] });
  assert.equal(api.addCustomItem({ name: "PADS" }).ok, false, "matches built-in 'Pads'");
  api.addCustomItem({ name: "Lip Balm" });
  assert.equal(api.addCustomItem({ name: "lip balm" }).ok, false, "matches the custom one");
});
check("addCustomItem normalizes unknown category, unit, and bad threshold", () => {
  api.setState({ balances: {}, customItems: [] });
  const r = api.addCustomItem({ name: "Mystery", category: "Nonsense", unit: "barrel", threshold: -9 });
  assert.equal(r.item.category, "Miscellaneous");
  assert.equal(r.item.unit, "each");
  assert.equal(r.item.threshold, 0);
});
check("two different names that slugify the same get distinct ids", () => {
  api.setState({ balances: {}, customItems: [] });
  const a = api.addCustomItem({ name: "Lip Balm" });
  const b = api.addCustomItem({ name: "Lip  Balm!" }); // different name, same slug
  assert.equal(a.item.id, "custom-lip-balm");
  assert.equal(b.item.id, "custom-lip-balm-2");
});
check("addCustomItem enforces the CUSTOM_ITEMS_MAX cap", () => {
  const customItems = Array.from({ length: api.CUSTOM_ITEMS_MAX }, (_, i) => ({ id: `custom-x${i}`, name: `X${i}` }));
  api.setState({ balances: {}, customItems });
  assert.equal(api.addCustomItem({ name: "One More" }).ok, false);
});

// ── merge / reset (no cross-state leak) ────────────────────────────────────
check("setCatalogueCustomItems merges persisted items and resets cleanly", () => {
  api.setCatalogueCustomItems([{ id: "custom-x", name: "X", category: "Moms", unit: "each", threshold: 1 }]);
  assert.ok(api.itemMap()["custom-x"], "merged in");
  assert.equal(api.ITEMS().length, 3, "base 2 + 1 custom");
  // loading a state with no custom items must reset the catalogue to base
  api.setCatalogueCustomItems([]);
  assert.equal(api.itemMap()["custom-x"], undefined, "no leak across states");
  assert.equal(api.ITEMS().length, 2, "back to base");
});
check("setCatalogueCustomItems drops malformed persisted entries", () => {
  api.setCatalogueCustomItems([{ name: "" }, null, { id: "custom-ok", name: "OK" }]);
  assert.ok(api.itemMap()["custom-ok"]);
  assert.equal(api.ITEMS().length, 3, "only the valid one merged");
  api.setCatalogueCustomItems([]);
});

console.log(`catalogue-items.test.js: ${pass} checks passed`);
