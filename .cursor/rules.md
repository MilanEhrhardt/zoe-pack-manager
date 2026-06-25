# Zoe Pack Manager — Cursor Rules

Read this file at the start of every coding session. For fuller guidance, see `docs/CURSOR_RULES.md`.

---

## Before any code changes

1. **Always read `docs/AI_CONTEXT.md`** — it holds the current state of the project.
2. **Consult `docs/PRODUCT_DECISIONS.md`** before changing UX, workflows, or behaviour volunteers rely on.
3. Skim other `/docs` files when the task touches research, design, or long-term vision.

---

## Non-negotiable engineering rules

- **Never rewrite working business logic** unless explicitly instructed.
- **Never remove analytics instrumentation** (event tracking, export formats, control IDs).
- **Never simplify functionality** to achieve cleaner code.
- **Prefer incremental changes over rewrites** — especially for `zoe-pack-manager.html`.
- **Preserve backwards compatibility** wherever possible (saved data, volunteer habits, export consumers).
- **Explain trade-offs before major architectural changes** (new frameworks, split files, backend, build step).
- **Keep business logic separate from presentation** whenever possible (`render*` / `bind*` vs `commit*` / `check*`).
- **Preserve localStorage compatibility** — do not rename storage keys or change persisted shape without a migration plan.
- **Preserve the existing analytics schema** unless migration is explicitly requested and documented.

---

## During implementation

- Change the **smallest surface area** that satisfies the request.
- Do not replace the entire app file unless the user provides a reference and asks for a full swap.
- Do not remove validation, confirmation modals, undo, or admin/export paths without explicit approval.
- If you change instrumentation or storage, update `docs/PRODUCT_DECISIONS.md` and `docs/CHANGELOG.md`.

---

## Documentation maintenance (required)

**Never finish a coding session without reviewing whether documentation should be updated.** Documentation maintenance is part of every implementation task, not a separate follow-up.

Before ending the session:

1. **Review every code change** (`git diff` or equivalent).
2. **Classify impact** — does it affect product decisions, UX, architecture, user research, current project state, or the changelog?
3. **Update affected docs** using the matrix in `docs/CURSOR_RULES.md`.
4. **Keep updates concise.** Never invent user research. Never overwrite historical decisions — append to `PRODUCT_DECISIONS.md` and mark old entries `Superseded` if needed.
5. If no doc update is needed, **state briefly why** (e.g. internal comment only, no behaviour change).
6. **Repository is the single source of truth** — do not treat chat history as canonical.

**Minimum on shipped work:** update `docs/CHANGELOG.md` (newest first).

**Commit** only when the user asks; include doc updates in the same commit as code when possible.

---

## App constraints (do not break)

- Single-file, offline, double-click-to-open HTML app.
- No install step, no server, no bundler — unless the user explicitly approves a architecture change.
