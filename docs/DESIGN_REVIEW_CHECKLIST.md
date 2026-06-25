# Design Review Checklist

> Use this document **before shipping any UI change**. It complements Phase 4 — Self Review in `.cursor/rules.md`.

Complete every lens that applies. For UI changes, all seven sections are required.

---

## 1. Janet Test

Primary users are Janet and Judy — volunteers with very low technical confidence.

- [ ] Can a 65-year-old volunteer understand this without explanation?
- [ ] Is there only one obvious next action?
- [ ] Are we asking her to understand software concepts?

---

## 2. Workflow Test

The software follows the volunteer's physical workflow, not the database.

- [ ] Does this match the real physical workflow?
- [ ] Are packing, donations, deliveries and stock corrections kept distinct?
- [ ] Did we accidentally merge tasks that happen separately in the storeroom?

---

## 3. Simplicity Test

- [ ] Can anything be removed?
- [ ] Are there duplicate actions?
- [ ] Are there unnecessary sidebars, dashboards, tables, filters or menus?

---

## 4. Business Logic Test

- [ ] Did we preserve stock deduction logic?
- [ ] Did we preserve donations?
- [ ] Did we preserve deliveries?
- [ ] Did we preserve corrections?
- [ ] Did we preserve analytics?

---

## 5. Regression Test

The stable build must keep the quick common-extras flow intact.

- [ ] Does the stable common-extras flow still work?
- [ ] Can users still add deodorant, tissues, wet wipes and hand cream quickly?
- [ ] Are rare exceptions still separate from normal packing?

---

## 6. Language Test

- [ ] No transaction language
- [ ] No session language
- [ ] No inventory jargon
- [ ] Human wording used: packed, donated, counted, delivered

---

## 7. Final Gate

Before committing any UI change, explicitly state in the session summary:

```
Passes Janet Test: yes/no
Passes Regression Test: yes/no
```

If either answer is **no**, do not commit the UI change until resolved or the user explicitly accepts the trade-off (document in `docs/PRODUCT_DECISIONS.md`).
