# AI Context

> This document is intentionally short. It contains only the current state of the project. Historical decisions belong in PRODUCT_DECISIONS.md and long-term philosophy belongs in THE_ZOE_PROJECT_BIBLE.md.

---

## Project Summary

The Zoe Project Pack Manager is a local-first HTML application for The Zoe Project storeroom in Cape Town. It helps non-technical volunteers track stock, donations, packed packs, deliveries and corrections without using spreadsheets or manual books.

**Canonical app file:** `zoe-pack-manager.html` (single file, offline, double-click to open).

---

## Primary Users

**Janet** and **Judy** are both primary users — storeroom volunteers with very low technical confidence. Design for people who do not know how to copy and paste.

Both are the design anchor for simplicity and language. If it works for Janet and Judy, it works for the storeroom.

---

## Core Product Principle

The software follows the volunteer's physical workflow, not the database.

---

## Current Operating Model

One major manual stock take creates opening balances. After that, the system maintains stock by:

- adding donations
- deducting recipe items when packs are created
- deducting delivered ready packs
- allowing occasional stock corrections when something is recounted

---

## Main Workflows

Home screen actions volunteers use:

| Action | Purpose |
|--------|---------|
| **Packed packs** | Record packs built from recipe + optional extras |
| **A donation arrived** | Log incoming stock from donors |
| **We delivered packs** | Record packs or complete units sent to clinics |
| **I counted something again** | Stock correction / physical recount |
| View stock | Check balances when needed — not a daily dashboard |

### Packing

Build Mom Pack or Baby Pack: qty, packer, destination, optional toggles (deo, tissues, wet wipes, hand cream, etc.), and “add something different” for substitutions/extras when needed.

### Donations

Multi-line donation entry with donor, date, item, and quantity. Quantity validation is required.

### Deliveries

Assembled packs or complete donated units to clinic destinations.

### Stock Checking

Count one item at a time; optional reason for correction.

---

## UX Rules

- One decision at a time
- No dashboards for volunteers
- No charts for volunteers
- No tables for volunteers
- No transaction language
- No session language
- No inventory jargon
- No visible admin unless hidden
- Use plain human language
- Prefer verbs over nouns
- The app should feel like another volunteer in the room

---

## Current Important Product Decision

The previous experimental **"Today's Changes"** build was rejected because it broke the quick multi-select flow for common extra items like deodorant, tissues, wet wipes and hand cream.

The stable reference is the **analytics rollback add-items build** (originally `zoe-pack-manager-analytics-rollback-add-items.html`; now canonical as `zoe-pack-manager.html`). It includes local analytics instrumentation and the “+ Add something different” packing subflow.

---

## Current Priority

Restore and protect the stable packing flow before any new redesign work.

---

## Engineering Rules

- Preserve localStorage
- Preserve analytics exports
- Preserve undo
- Preserve donation logic
- Preserve delivery logic
- Preserve stock correction logic
- Do not rewrite the app from scratch
- Make small, controlled changes

See also `.cursor/rules.md` and `docs/CURSOR_RULES.md`.

---

## Current Architecture

- **Single file:** `zoe-pack-manager.html` — HTML, CSS, and JavaScript in one document
- **Persistence:** browser `localStorage` (auto-save on this computer)
- **Offline:** no server, install, or internet required for daily use
- **Analytics:** local event logging with JSON/CSV export for user-testing analysis (Mission Control dashboard reads exports)
- **Backup:** manual export/import from hidden admin area

---

## Current UX Problems

- **Add-item / “something different” subflow** caused friction in June 2024 user testing (hesitation, repeated clicks, abandoned builds) — improve carefully without removing the flow
- **Donation and deliver flows** were not exercised in the same test session — need dedicated validation
- **Admin/export controls** can distract during active packing if too prominent on build screen

---

## Deferred Ideas

- Major build-screen redesign (wizard, collapsed accordions) until stable flow is proven in the field
- “Today's Changes” style UX
- Dashboards, charts, or table-heavy views for volunteers

---

## Future AI Features

- Usability analysis from exported analytics / AI Data Pack
- Inventory intelligence and low-stock signals (ops-facing, not volunteer-facing)
- Forecasting and donor ask lists

*Not in scope until core volunteer flows are stable.*

---

## Open Questions

- Baby Pack recipe confirmation with volunteers
- Optimal placement of admin/export without interrupting packing
- Field testing of donation and deliver flows with Janet and Judy

---

## Active Experiments

None. Stabilisation phase — no active UX experiments on the canonical build.

---

## Latest Product Decisions

| Decision | Status |
|----------|--------|
| Reject “Today's Changes” build | **Rejected** — broke quick optional-item toggles |
| Canonical app = analytics rollback add-items build | **Accepted** — `zoe-pack-manager.html` |
| Documentation-first AI workflow | **Accepted** — read this file before coding |
| Redesign before stable packing proven | **Deferred** |

Full decision log: `docs/PRODUCT_DECISIONS.md` (to be populated).

---

## Documentation maintenance

At the end of every implementation session, review all code changes and update affected docs before finishing. See `.cursor/rules.md` and `docs/CURSOR_RULES.md` for the mandatory checklist and change → document matrix. The repository is the single source of truth.
