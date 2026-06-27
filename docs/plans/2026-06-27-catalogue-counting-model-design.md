# Design — Catalogue & counting model

**Date:** 2026-06-27
**Status:** Approved. Built incrementally, section by section (Section 1 first).
**Source:** Field research with Janet (storeroom), 27 June 2026.

## Problem

The catalogue and counting model don't match how the storeroom actually
organises and counts stock:

- **Gender colour-coding** — clothes/toys live in green (neutral) / pink (girls)
  / blue (boys) boxes within *one* category. They record the **total only**;
  per-gender counting is "too time-consuming." The coloured boxes are a physical
  convenience used at pack time.
- **Items they refuse to count** — booties and beanies ("just so many"); they
  guess a number when Claire asks.
- **Taxonomy gaps** — Octopuses deserve their own group (Tracey uses them for
  antenatal classes; they represent the umbilical cord); Plush is separate and
  rarely used (too big); an "Odds n Ends" drawer holds uncategorised bits;
  jerseys are no longer gender-split because Claire's costing is gender-blind.

## Decisions

### Gender / colour — deliberately NOT modelled (non-feature)

The app only ever holds a **total**, so it cannot know girls-vs-boys, and
**no downstream consumer cares** (Claire's costing is gender-blind — that is
*why* they stopped splitting jerseys). A "grab the pink box" hint would only
tell the volunteer something they already know while standing at the boxes —
noise with no consumer. Colour-coding stays a **physical-world habit**; the app
ignores it. Recorded here so it is not re-proposed.

### Rough-estimate items — Approach A: "rough" is a property of the item

"Too many to count" is a permanent trait of an item (booties, beanies), not a
per-count decision. So tracking mode lives on the item:

- Each item has `tracking`: `"exact"` (default) or `"rough"`.
- A rough item's count prompt softens ("Roughly how many? A guess is fine") and
  the saved recount is auto-stamped `estimate: true` — **no extra tap**.
- Stock views render rough items approximately (`~50`, quiet *rough* label).
- **Honest intelligence:** an `estimate` recount does not collapse belief-state
  variance (a guess is not ground truth), and the recount calibration loop
  excludes estimates from ground-truth scoring (as it already excludes synthetic
  captures).

Rejected: per-count "this was a guess" toggle (burdens every count; item never
"knows" it's untracked). Deferred: item-default + per-count override (YAGNI).

### Taxonomy — add known groups as config

Add **Octopuses** and **Odds n Ends** to the category list and the add-item
group picker. Plush stays its own item; jerseys stay one gender-blind item. No
new mechanics.

## Build order (incremental)

1. **Section 1 — Data model** *(built first).*
   - `tracking` property on items via the existing `item(...)` extra.
   - Known-rough built-ins pre-marked `tracking:"rough"` (Cotton Beanies; booties
     when added). New v1 need is covered by pre-mark + new-item choice; a general
     "edit existing item's mode" toggle is a deferred fast-follow.
   - Custom items carry `tracking` in their `state.customItems` definition.
   - `state.itemTracking = { [itemId]: "rough"|"exact" }` override map — the
     single source for changing any item's mode without editing source. Resolved
     by `itemTrackingMode(itemId)` / `isRoughItem(itemId)` (override → item config
     → default "exact"); writer `setItemTracking`. No mutation of shared base
     item objects (avoids cross-state leaks).
   - Persisted/defaulted/validated in `freshState` + `normalizeImportedState`.
2. **Section 2 — Counting & display** — gentle prompt for rough items; auto-stamp
   `estimate`; approximate display.
3. **Section 3 — Honest intelligence** — estimate recounts keep variance wide;
   excluded from calibration ground-truth.
4. **Section 4 — Taxonomy config** — Octopuses, Odds n Ends categories.

## Non-goals

- No gender/colour in the app (physical habit only).
- No per-build deduction changes, no recipe changes, no new pages.
- Section 1 is data-model only: no visible behaviour change until Section 2
  consumes `isRoughItem`.
