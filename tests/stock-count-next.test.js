/*
 * Headless tests for volunteer "count this next" copy helpers.
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

const blocks = [
  extractBlock(HTML, "function todayISO("),
  extractBlock(HTML, "function formatDate("),
  extractBlock(HTML, "function confidenceDaysSince("),
  extractBlock(HTML, "function getLastRecountDates("),
  extractBlock(HTML, "function stockLastCountedLabel("),
  extractBlock(HTML, "function stockCountNextInfo("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const api = new Function(`
  function getBalance(id) { return id === "face-cloth-baby" ? 13 : 0; }
  ${blocks}
  return { getLastRecountDates, stockLastCountedLabel, stockCountNextInfo };
`)();

let failed = 0;
const ok = (name, cond, info) => {
  if (cond) console.log(`PASS  ${name}`);
  else { failed++; console.log(`FAIL  ${name}${info ? `  ${info}` : ""}`); }
};

(() => {
  const map = api.getLastRecountDates([
    { type: "recount", itemId: "pads", date: "2026-06-01", newQty: 10 },
    { type: "recount", itemId: "pads", date: "2026-06-10", newQty: 12 },
  ]);
  ok("getLastRecountDates keeps newest per item", map.pads === "2026-06-10");
})();

(() => {
  ok("stockLastCountedLabel null when no date", api.stockLastCountedLabel(null) === null);
})();

(() => {
  const info = api.stockCountNextInfo(null, "face-cloth-baby");
  ok("never counted status is plain", info.status === "You haven't saved a count for this item yet");
  ok("never counted detail names one number", info.detail === "On the shelf right now: 13");
})();

(() => {
  // Mirrors bindStock pack-context handler: prefer count-next suggestion on pack change.
  function pickStockItemOnPackChange(packKey, currentItem, suggestion, shortcuts, isVisible) {
    if (suggestion && isVisible(suggestion.itemId, packKey)) {
      return suggestion.itemId;
    }
    if (!shortcuts.includes(currentItem)) {
      return shortcuts[0];
    }
    return currentItem;
  }
  const momShortcuts = ["pads", "liners", "wipes"];
  const babyShortcuts = ["nappies", "face-cloth-baby", "barrier-cream"];
  const isVisible = (itemId, packKey) =>
    (packKey === "momPack" ? momShortcuts : babyShortcuts).includes(itemId);

  ok(
    "pack change prefers count-next suggestion even when current item still in shortcuts",
    pickStockItemOnPackChange(
      "babyPack",
      "pads",
      { itemId: "face-cloth-baby" },
      babyShortcuts,
      isVisible,
    ) === "face-cloth-baby",
  );
  ok(
    "pack change keeps current item when no suggestion and item fits shortcuts",
    pickStockItemOnPackChange("momPack", "liners", null, momShortcuts, isVisible) === "liners",
  );
  ok(
    "pack change falls back to first shortcut when item absent",
    pickStockItemOnPackChange("babyPack", "pads", null, babyShortcuts, isVisible) === "nappies",
  );
})();

console.log(failed ? `\n${failed} failed` : "\nall passed");
assert.equal(failed, 0);
