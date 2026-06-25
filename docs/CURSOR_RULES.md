# Cursor Rules

> Instructions for any AI agent (Cursor, ChatGPT, or otherwise) working on this repository.
>
> This file is **not** product documentation. It defines **how to change the code safely**.
>
> For product context, read `docs/AI_CONTEXT.md` first, then the rest of `/docs` as needed.

---

## Purpose

This project is a single-file operational app used by volunteers in a storeroom. Regressions are costly: a “cleaner” refactor or an ambitious UX change can break packing, donations, deliveries, or analytics without anyone noticing until volunteers are on the floor.

**Default posture: preserve behaviour, change incrementally, prove you didn’t break anything.**

---

## Non-Negotiables

### Business logic

- **Never rewrite working business logic** unless the user explicitly requests it.
- **Never simplify functionality** to achieve cleaner code. Volunteers depend on edge cases (substitutions, optional items, stock thresholds, undo, etc.).
- When fixing a bug, **change the smallest surface area** that fixes the bug — do not opportunistically refactor surrounding code.

### Analytics

- **Preserve analytics instrumentation** unless the user explicitly asks to remove or replace it.
- Do not rename or remove tracked control IDs, event names, or export formats without checking impact on Mission Control / AI Data Pack consumers.
- If you must change instrumentation, **document the change** in `docs/PRODUCT_DECISIONS.md` and `docs/CHANGELOG.md`.

### UI vs logic

- **Keep UI and business logic separate where possible.**
  - Rendering (`render*`, HTML strings, CSS) should not embed new inventory rules.
  - State mutations (`commit*`, `check*`, balance updates) should not depend on DOM structure.
- A UI redesign must not require re-deriving business rules from scratch.

### Change style

- **Prefer incremental changes over rewrites.**
- Do not replace the entire `zoe-pack-manager.html` unless the user explicitly asks for a full replacement from a known reference file.
- One concern per change when possible: UX tweak **or** logic fix **or** analytics — not all three in one unreviewable diff.

### Architecture and trade-offs

- **Explain trade-offs before major architectural changes** (splitting files, new frameworks, new build step, database, backend).
- This app is intentionally **offline, single-file, double-click to open**. Proposals that add install steps, servers, or bundlers need explicit user approval.

---

## Before You Touch Code

1. **Read every file in `/docs`** before substantive work — especially `AI_CONTEXT.md`, `PRODUCT_DECISIONS.md`, and `DESIGN_PRINCIPLES.md`.
2. **Read the relevant section of `zoe-pack-manager.html`** (CONFIG, state, render, bind, commit functions) before editing.
3. **Identify what must not change** (business rules, localStorage keys, export schemas, volunteer-facing labels).
4. **State your plan** if the change touches more than one screen or flow.

---

## UX Changes

- UX improvements must **not** remove paths volunteers already use (e.g. add-item subflows, admin/export, confirmation modals) unless explicitly requested.
- Do not hide critical actions behind new accordions or wizards without a documented decision in `PRODUCT_DECISIONS.md`.
- **Validate forms** — do not remove existing validation (e.g. donation quantity errors) when restyling.
- After UI changes, mentally walk through: **Pack → Donate → Deliver → Stock count → Undo → Export backup**.

---

## Testing Expectations

Before marking work complete:

- Confirm JavaScript still parses (no syntax errors in the `<script>` block).
- Smoke-test the flows you touched in a browser if possible.
- If you cannot run the app, say so and list what the user should verify.

---

## Documentation

- **Product content** → `THE_ZOE_PROJECT_BIBLE.md`, `USER_RESEARCH.md`, etc.
- **Current state for AI** → `AI_CONTEXT.md` (keep short; update when priorities change).
- **Decisions** → `PRODUCT_DECISIONS.md` using the decision log template.
- **Shipped changes** → `CHANGELOG.md` (newest first).
- **Do not invent** interview quotes, personas, or requirements — use placeholders or ask the user.

---

## Git and Commits

- **Only commit when the user asks.**
- Do not force-push `main`.
- Commit messages should describe **why**, not just what.
- Do not commit secrets, `.env` files, or macOS `.DS_Store` (see `.gitignore`).

---

## Things We Have Learned the Hard Way

| Mistake | Rule |
|--------|------|
| Full file swap from an old reference | Only on explicit user instruction; verify donation validation and analytics survived |
| Wizard UX replacing working add-item flow | Incremental UX; keep parity with existing flows until user tests |
| “Cleanup” refactors mixed with features | Separate commits; separate tasks |
| Assuming Downloads / local paths are readable | Ask user to put files in the repo or paste content |
| Analytics exports broken by renamed buttons | Preserve `id`s and event hooks; grep for `track` / `export` before merging |

---

## When in Doubt

1. Ask a clarifying question.
2. Propose the smallest change.
3. Explain what could break.
4. Wait for explicit approval on rewrites and architecture changes.
