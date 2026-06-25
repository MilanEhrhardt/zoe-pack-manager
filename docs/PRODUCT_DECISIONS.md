# Product Decisions

> Decision log. Use the template below for each entry. Content to be added later.

---

## Decision Log Template

Copy this block for each new decision:

### [Decision title]

| Field | Content |
|-------|---------|
| **Decision** | <!-- TODO --> |
| **Date** | <!-- TODO --> |
| **Context** | <!-- TODO --> |
| **Decision** | <!-- TODO --> |
| **Reasoning** | <!-- TODO --> |
| **Alternatives Considered** | <!-- TODO --> |
| **Status** | <!-- TODO: e.g. Proposed / Accepted / Superseded / Rejected --> |

---

## Decisions

### Milan tester analytics separation

| Field | Content |
|-------|---------|
| **Decision** | Add Milan as packer option; tag tester sessions in analytics without deleting data |
| **Date** | 2026-06-25 |
| **Context** | Developer testing (Milan) polluted volunteer usability analysis. Full login/auth is out of scope. |
| **Decision** | Milan appears in the existing packer dropdown. `isTesterUser("Milan")` tags analytics events and AI Data Pack exports with `sessionUser`, `currentSelectedUser`, `isTesterSession`. Summary splits `productionVolunteerSessions`, `testerSessions`, `unknownSessions`. No passwords, accounts, or auth. Stock and pack logic unchanged. |
| **Reasoning** | Smallest safe separation: one extra dropdown name, additive analytics fields, future exports can exclude tester sessions. Janet/Judy workflow unchanged — no “admin login” language. |
| **Alternatives Considered** | **devMode toggle** — rejected for now; easy to forget. **Separate app build** — rejected; too heavy. **Delete tester analytics** — rejected; Milan needs history for debugging. |
| **Status** | Accepted |

### SPE is a future intelligence layer, not a Phase 1 UI feature

| Field | Content |
|-------|---------|
| **Decision** | Document SPE as future roadmap; do not implement yet |
| **Date** | 2026-06-25 |
| **Context** | Explored multi-objective recommendation systems inspired by large-scale recommender architecture (candidate generation, Pareto filtering, context policies). SPE-Ω captured as theoretical north star in `THE_ZOE_PROJECT_BIBLE.md`. |
| **Decision** | SPE and SPE-Ω are documented in `THE_ZOE_PROJECT_BIBLE.md` only. No engine code, no Janet whisper, no UI changes until core workflows are field-validated. |
| **Reasoning** | Current priority is stabilising Janet's core workflows. SPE is valuable but premature as a visible UI layer. |
| **Alternatives Considered** | **Implement Phase 1 now** — rejected; distracts from Pack Creation / donation / deliver field validation. **Do not document** — rejected; would lose design work. |
| **Status** | Accepted / Deferred |

### Entry screen Increment A (four verbs, no dashboard)

| Field | Content |
|-------|---------|
| **Decision** | Simplify entry screen to calm “What happened today?” with four primary verbs; move ops tools behind **Need something else?** |
| **Date** | 2026-06-25 |
| **Context** | Home headline matched storeroom-memory direction but the body behaved like an inventory dashboard (pack counts, LOW stock, nudges, full stock list). Fourth verb (stock correction) was buried in Admin. |
| **Decision** | Ship **Increment A** of the Recommended “Today loop” plan: primary surface shows We packed packs / A donation arrived / We delivered packs / I counted something again. Remove dashboard cards from entry. Relocate undo, stock levels view, backup, and analytics to discreet **Need something else?** Defer resume card, draft persistence, post-save loop, and today summary (Increment B). Render/CSS/navigation only — no business logic changes. |
| **Reasoning** | Aligns entry UX with DESIGN_PRINCIPLES without the regression risk of Increment B before field validation. Volunteers see verbs, not inventory intelligence, on open. |
| **Alternatives Considered** | **Conservative:** label tweaks only — rejected; dashboard contradiction remained. **Radical:** timeline-first, no home — rejected for Janet; deferred to Phase 2+. **Full Today loop (Increment B):** approved direction but explicitly deferred. |
| **Status** | Accepted |

### Pack Creation screen redesign (common extras on main screen)

| Field | Content |
|-------|---------|
| **Decision** | Move recipe optional toggles to the main Pack Creation screen; narrow “Add something different” to swaps, omissions, and unlisted extras only; remove admin footer from build/add-item views |
| **Date** | 2026-06-24 |
| **Context** | June user testing showed common extras (deo, tissues, wet wipes, hand cream) buried behind three taps in the add-item subflow. Analytics showed friction on `add-item-done-bottom` and admin distraction during packing. |
| **Decision** | Ship the **Recommended** option from the Pack Creation redesign plan: render/bind/CSS only — no changes to `commitBuild`, `checkBuild`, or stock logic. Remove `choice-optional` menu path (redirect legacy `addItemStep === "optional"` to main screen). Add `choice-extra` for unlisted custom extras. |
| **Reasoning** | Restores the quick multi-select happy path Janet/Judy need without repeating the rejected “Today's Changes” one-by-one pattern. Rare exceptions stay in a slimmer subflow. |
| **Alternatives Considered** | **Conservative:** copy/label tweaks only — extras still two taps away. **Radical:** wizard or one-item-per-screen — rejected; repeats failed Today's Changes UX. |
| **Status** | Accepted |

### Lead Product Engineer workflow

| Field | Content |
|-------|---------|
| **Decision** | Adopt Lead Product Engineer workflow with three-solution proposals, approval gate, and auto-commit |
| **Date** | 2025-06-25 |
| **Context** | AI agents were implementing requests without challenging assumptions or waiting for approval. The existing six-phase Lead Engineer workflow lacked formal solution comparison and a hard approval gate before coding. |
| **Decision** | Rename role to Lead Product Engineer. For features and non-trivial changes: challenge the request, propose Conservative / Recommended / Radical solutions with trade-offs, recommend one, and wait for approval before coding. For trivial fixes: short plan + approval. Auto-commit when Phases 3–5 complete (design review passed or trade-off documented). Codify in `.cursor/rules/lead-product-engineer.mdc`, `.cursor/rules.md`, and `docs/CURSOR_RULES.md`. |
| **Reasoning** | Volunteers depend on stable behaviour; order-taking agents risk regressions. Three options force deliberate trade-off thinking without the overhead of a full proposal log. Auto-commit improves velocity while design review and doc updates remain gates. |
| **Alternatives Considered** | **Conservative:** conversation-only adoption (no doc changes) — rejected because behaviour would not persist across sessions. **Radical:** separate workflow bible + mandatory proposal log in PRODUCT_DECISIONS — rejected as doc fatigue for a single-file volunteer app. |
| **Status** | Accepted |
