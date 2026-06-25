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
