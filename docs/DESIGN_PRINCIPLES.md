# Design Principles

> How The Zoe Project Pack Manager should feel and behave. For vision and long-term direction, see `THE_ZOE_PROJECT_BIBLE.md`.

---

## Core Philosophy

- **The app is not an inventory system. It is the storeroom.** Volunteers should feel they have walked into the storeroom, not opened Excel.
- **The software follows the physical workflow**, not the database.
- **Optimise for confidence, not efficiency.** Janet should trust what she sees more than she should finish faster.
- **The app should feel like another volunteer in the room** — helpful, calm, present, never bossy.

---

## UX Principles

The product is organised around **four verbs**:

| Verb | Meaning |
|------|---------|
| **Packed packs** | Record what was built from recipe + extras |
| **A donation arrived** | Log incoming stock from donors |
| **I counted something again** | Physical recount / correction |
| **We delivered packs** | Packs or complete units sent to clinics |

- The main screen asks: **“What happened today?”**
- **No conventional dashboard for Janet.** Stock checks and admin exist, but daily use is verb-first.
- **One decision at a time.** No wizard overload; no one-item-per-screen for common extras.
- **Remember defaults over time:** last packer, usual destination, usual extras.
- **Know seasonal rhythm:** winter extras, summer extras, cotton beanies, blankets — the storeroom has a calendar; the app should learn it.
- **Build toward a future Confidence Meter** — a simple signal of how reliable stock counts feel, not a dashboard.

---

## Language

Volunteer-facing copy must **hide database concepts**:

- transactions
- sessions
- records
- inventory adjustments
- analytics
- schemas

**Celebrate people, not data.** Say “20 mothers now have packs ready,” not “20 transactions saved.”

Use plain human words: packed, donated, counted, delivered. Prefer verbs over nouns.

---

## Visual Design

Calm, dignified, low cognitive load. The storeroom is a place of care — the UI should match.

---

## Accessibility

Large touch targets, plain language, no assumed computer literacy. If it works for Janet and Judy, it works for the storeroom.

---

## Interaction Rules

- Physical workflow first: how many packs → what extras → save.
- Rare exceptions (swaps, omissions, unlisted extras) stay separate from the happy path.
- Admin, export, and analytics stay hidden unless deliberately opened — never interrupt packing.

---

## Things We Never Do

- Dashboards, charts, or table-heavy views for volunteers
- Transaction, session, or inventory jargon in volunteer UI
- Celebrating “records saved” or data volume
- Forcing volunteers to understand software concepts (copy/paste, files, schemas)
- Treating matching, care, or dignity as minor features

---

## Cultural Principles

**“We always have everything matching”** is a core cultural principle of The Zoe Project — not a nice-to-have.

Matching sets, thoughtful packing, care, and dignity belong in the product philosophy and must be preserved as the app evolves.
