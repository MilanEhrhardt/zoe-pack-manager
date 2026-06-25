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
