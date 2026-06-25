# zoe-pack-manager

The Zoe Project inventory and packing system.

Single-file offline app: open `zoe-pack-manager.html` in a browser. No install or server required. Data persists in the browser via localStorage.

## Documentation

| File | Purpose |
|------|---------|
| `docs/AI_CONTEXT.md` | Current project state for AI and developers (read first) |
| `docs/PRODUCT_DECISIONS.md` | Decision log — consult before UX/workflow changes |
| `docs/CURSOR_RULES.md` | Extended safe-change guidelines for AI agents |
| `docs/THE_ZOE_PROJECT_BIBLE.md` | Long-term product reference (table of contents) |
| `docs/DESIGN_PRINCIPLES.md` | Design and UX principles |
| `docs/USER_RESEARCH.md` | Interviews, testing, insights |
| `docs/CHANGELOG.md` | Shipped changes (newest first) |

## AI Development Workflow

Every coding session on this repository should follow this sequence:

```
Read AI_CONTEXT.md
        ↓
Read PRODUCT_DECISIONS.md (if relevant)
        ↓
Implement the requested feature
        ↓
Update CHANGELOG.md
        ↓
Commit
```

**Read `docs/AI_CONTEXT.md`** before making any code changes. It contains only the current state — not history or philosophy.

**Read `docs/PRODUCT_DECISIONS.md`** when the task touches UX, workflows, analytics, or anything that could contradict a prior decision.

**Implement** incrementally. Do not rewrite working business logic or remove analytics unless explicitly instructed. See `.cursor/rules.md` and `docs/CURSOR_RULES.md`.

**Update `docs/CHANGELOG.md`** with what changed, under the appropriate date or `[Unreleased]` section.

**Commit** when the user requests it, with a message that explains why.
