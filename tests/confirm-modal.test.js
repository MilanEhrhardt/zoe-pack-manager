/*
 * Headless safety tests for confirm modal HTML builder in zoe-pack-manager.html.
 *
 * Run:  node tests/confirm-modal.test.js
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

// esc() uses document.createElement — provide a minimal DOM for headless runs.
global.document = {
  createElement() {
    return {
      textContent: "",
      get innerHTML() {
        return String(this.textContent)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      },
    };
  },
};

const HTML = fs.readFileSync(path.join(__dirname, "..", "zoe-pack-manager.html"), "utf8");

function extractBlock(src, anchor) {
  const start = src.indexOf(anchor);
  if (start === -1) throw new Error(`anchor not found: ${anchor}`);
  const braceStart = src.indexOf("{", start);
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
  extractBlock(HTML, "function esc("),
  (() => {
    const m = HTML.match(/const CONFIRM_ALLOWED_STYLES = new Set\(\[[\s\S]*?\]\);/);
    if (!m) throw new Error("CONFIRM_ALLOWED_STYLES not found");
    return m[0];
  })(),
  extractBlock(HTML, "function confirmText("),
  extractBlock(HTML, "function confirmStyleAttr("),
  extractBlock(HTML, "function confirmInline("),
  extractBlock(HTML, "function confirmHtml("),
].join("\n\n");

// eslint-disable-next-line no-new-func
const { confirmHtml, confirmText } = new Function(
  `${blocks}\nreturn { confirmHtml, confirmText };`
)();

const xssPayload = '<script>alert(1)</script><img src=x onerror=alert(1)>';

function testDonorNameIsEscaped() {
  const html = confirmHtml({
    paragraphs: [
      { parts: [{ strong: "Donation" }, " — ", "26 Jun 2026"] },
      { parts: ["From: ", xssPayload] },
    ],
    lists: [{ items: [[`${xssPayload}: `, "12"]] }],
  });
  assert.ok(!html.includes("<script>"), "raw script tag must not appear");
  assert.ok(!/<img[^>]*onerror/i.test(html), "live img onerror must not appear");
  assert.ok(html.includes(confirmText(xssPayload)), "payload appears escaped");
  assert.ok(html.includes("<strong>Donation</strong>"), "allowed strong tag preserved");
  assert.ok(html.includes("<ul>") && html.includes("<li>"), "list structure preserved");
}

function testRejectsArbitraryStyles() {
  const html = confirmHtml({
    divs: [{
      style: "position:fixed;top:0;left:0;background:red;",
      parts: ["hidden"],
    }],
  });
  assert.ok(!html.includes("position:fixed"), "disallowed style must be dropped");
  assert.ok(html.includes("hidden"), "content still rendered");
}

function testDeliverSummaryEscapesDestination() {
  const html = confirmHtml({
    paragraphs: [{
      parts: [
        "Deliver ",
        { strong: `3 Baby Packs` },
        " to ",
        { strong: xssPayload },
        { br: true },
        "26 Jun 2026",
      ],
    }],
  });
  assert.ok(!html.includes("<script>"), "destination XSS escaped");
  assert.ok(html.includes("<br>"), "line break preserved");
}

function testBuildPreviewSlotAcceptsOnlyPrebuiltSafeHtml() {
  const safeFragment = `<p><strong>From the shelf (2 packs):</strong></p>${confirmText("2 × Nappies")}`;
  const html = confirmHtml({
    divs: [{ style: "font-size:0.95rem;", html: safeFragment }],
  });
  assert.ok(html.includes("From the shelf"), "prebuilt safe fragment passes through");
  assert.ok(!html.includes("<script>"), "fragment must stay script-free");
}

let passed = 0;
for (const [name, fn] of [
  ["donor name XSS escaped", testDonorNameIsEscaped],
  ["arbitrary styles rejected", testRejectsArbitraryStyles],
  ["deliver destination escaped", testDeliverSummaryEscapesDestination],
  ["build preview slot safe html", testBuildPreviewSlotAcceptsOnlyPrebuiltSafeHtml],
]) {
  try {
    fn();
    passed++;
    console.log(`ok — ${name}`);
  } catch (err) {
    console.error(`FAIL — ${name}`);
    throw err;
  }
}
console.log(`\n${passed} confirm-modal tests passed`);
