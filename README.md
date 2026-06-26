# zoe-pack-manager

The Zoe Project inventory and packing system.

Single-file offline app: open `zoe-pack-manager.html` in a browser. No install or server required. Data persists in the browser via localStorage.

**Tests:** `for f in tests/*.test.js; do node "$f"; done` (Node 22+). CI runs the same on push and PR.

## Documentation

| File | Purpose |
|------|---------|
| `docs/AI_CONTEXT.md` | Current project state for AI and developers (read first) |
| `docs/PRODUCT_DECISIONS.md` | Decision log — consult before UX/workflow changes |
| `docs/CURSOR_RULES.md` | Extended safe-change guidelines for AI agents |
| `docs/THE_ZOE_PROJECT_BIBLE.md` | Long-term product reference (table of contents) |
| `docs/DESIGN_PRINCIPLES.md` | Design and UX principles |
| `docs/DESIGN_REVIEW_CHECKLIST.md` | Pre-ship UI review gate |
| `docs/USER_RESEARCH.md` | Interviews, testing, insights |
| `docs/FIELD_VALIDATION.md` | Field session script, checklist, rubric for Janet/Judy validation |
| `docs/CHANGELOG.md` | Shipped changes (newest first) |

## AI Development Workflow

The AI agent acts as **Lead Software Engineer** for this project — thinking like a senior engineer and product designer, not simply executing instructions.

Every coding session follows six phases:

```
Phase 1 Understand
        ↓
Phase 2 Think (engineering plan — do not code yet)
        ↓
Phase 3 Implement
        ↓
Phase 4 Self Review
        ↓
Phase 5 Documentation
        ↓
Phase 6 Commit
```

**Phase 1 — Understand:** Read `docs/AI_CONTEXT.md` and `docs/CURSOR_RULES.md`. Add `DESIGN_PRINCIPLES.md` + `PRODUCT_DECISIONS.md` for UX tasks; `THE_ZOE_PROJECT_BIBLE.md` for product direction.

**Phase 2 — Think:** Short plan covering goal, risks, files, and alternatives. Complete before writing code.

**Phase 3 — Implement:** Small surgical changes. Preserve analytics, localStorage, business logic, backwards compatibility. See `.cursor/rules.md`.

**Phase 4 — Self Review:** Check complexity, duplication, workflow impact, simplicity.

**Phase 5 — Documentation:** Update affected docs per the matrix in `docs/CURSOR_RULES.md`. Minimum: `CHANGELOG.md` for shipped work.

**Phase 6 — Commit:** Only when implementation and documentation are complete and the user requests a commit.

Full detail: `.cursor/rules.md` and `docs/CURSOR_RULES.md`.
