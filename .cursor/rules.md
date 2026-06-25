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

## After implementation

1. Update `docs/CHANGELOG.md` (newest first).
2. Update `docs/AI_CONTEXT.md` if priorities, problems, or architecture changed.
3. Commit only when the user asks; use clear commit messages focused on **why**.

---

## App constraints (do not break)

- Single-file, offline, double-click-to-open HTML app.
- No install step, no server, no bundler — unless the user explicitly approves a architecture change.
