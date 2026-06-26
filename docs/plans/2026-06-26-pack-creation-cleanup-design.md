# Pack Creation Cleanup — Design

**Date:** 2026-06-26  
**Status:** Implemented  
**Audience:** Janet & Judy (volunteers), Milan (testing)

## Problem

Pack Creation had become a patchwork: a widened two-column layout with a bolt-on shelf rail (Now/After table), while the left column still used stacked form cards and an exceptions accordion. Three visual dialects on one screen — half-hearted compared to the polished Home verb flow.

## Decisions

| Topic | Decision |
|-------|----------|
| Layout | Single centered column (~760px), Home-matching gradient surface |
| Shelf rail | **Removed** — no inventory table on this screen |
| Stock feedback | **Inline on optional toggles** only; shortage panel above Save when save is blocked |
| Pack type | Mom / Baby **tap cards**, not dropdown |
| Pack count | Hero field, centered, large type |
| Metadata | One grouped strip: who packed, going to, date |
| Exceptions | Home-style disclosure: **+ Something else happened?** |
| Save | Full-width **Save packs** at bottom |

## Flow

1. Pick Mom or Baby Pack (tap cards)
2. Enter how many packs (hero number)
3. Who packed / going to / date (one strip)
4. Extras in each pack? — Yes/No with inline shelf hints
5. Optional: swaps, left out, extras (collapsed)
6. Save packs

## Inline stock hints

- **Yes + short:** `Only 3 on the shelf — you need 20`
- **Yes + OK (qty entered):** `42 on the shelf`
- **No + zero stock:** `None on the shelf`

## Not in scope

- Home bottom stock strip
- Wizard / one-item-per-screen
- New stock math

## Success criteria

- One intentional design language, continuous with Home
- Janet completes happy path top-to-bottom without a side panel
- Stock problems on the item she is deciding about, plus clear save block

## Validation

Run FIELD_VALIDATION with Janet/Judy per `docs/FIELD_VALIDATION.md` after deploy.
