# Changelog

> Reverse chronological order (newest first). Content to be added later.

---

## [Unreleased]

### Fixed

- Operational intelligence (Phase 3A): rank `topThreeOperationalFacts` by operational importance (zero core items, readiness blockers, substitutions, production volume, largest donation enablement); classify donation lines into `corePackEnablement`, `optionalPackSupport`, and `substitutionSupport` with cautious estimate copy raise medium `confidenceBand` threshold to 0.55 so early evidence stays low; fix plural grammar (“Tissues were included”); title-case item names in insight copy; remove “occurred N occurrences” phrasing; unknown-cause copy reads “There is no clear explanation yet”; `possibleCauses` confidences sum exactly to 1.0 after rounding; full unfiltered insight list renamed to `allInsights` (export-only)
- Packing habit trend classification: replace misleading `unstable` label with evidence-based model — separate `trend` (too_early_to_tell, emerging, established, declining, stable) and `evidence` (too_early, early, sufficient) plus `trendReason`; distinguishes insufficient history from genuine directional change
- Packing habit trend `topThreeInsights`: aggressive filter excludes low-confidence one-off patterns (e.g. 1/10 vs 0/10); raw `trendRows` and full `allInsights` unchanged for admin analysis; low-count copy uses “may not mean anything yet” instead of “much more common”

### Added

- Operational Intelligence Foundation (Phase 3A): read-only `operationalIntelligence` in AI Data Pack with quantity-weighted build, substitution, optional, donation, recount, and stock-risk measurements; `impactReadiness` gate; `limitations`; `operationalIntelligenceSummary` in analytics derived summary; production-only default with `allMovements` where useful; no recommendations — measurement foundation for Phase 3B
- Packing Habits behavioural trend refinement (Phase 2.1): probabilistic `possibleCauses` (1–3 hypotheses, confidences sum to 1.0) via `computeHabitCauseProbabilities`; evidence-driven `buildTrendReason`; `confidenceBand` + `confidenceProbability`; `insightQualityScore` for ranking; `belief` / `beliefPrevious` / `beliefDelta` (belief = confidenceProbability for now); five-section human insights; sort by quality score not trend alone; export-only
- Packing Habits behavioural trend intelligence (Phase 2): windowed comparison with evidence-based `trend` + `evidence` + `trendReason` (replaces unstable/strengthening/weakening model); probabilistic `possibleCauses`; `confidenceBand` + `confidenceProbability`; human insights in `packingHabits.insights`; `packingHabitTrends` in analytics summary; export-only, no volunteer UI
- Packing Habits Intelligence Engine (Phase 1): read-only `packingHabits` in AI Data Pack export with counted observations (substitutions, optional usage, custom extras, omissions) from production builds only; `packingHabitsSummary` in analytics derived summary; no volunteer UI
- Item-level confidence model (Increment A): read-only `itemConfidence` in AI Data Pack export with `volunteerConfidence` and `allMovementsConfidence` per item; `confidenceSummary` in analytics derived summary; no volunteer UI yet
- Milan as selectable packer identity with tester analytics separation (`isTesterUser`, session user fields on key analytics events, summary session breakdown, AI Data Pack `userContext`)
- Document Storeroom Prioritisation Engine (SPE) and SPE-Ω north star in `THE_ZOE_PROJECT_BIBLE.md`; deferral decision in `PRODUCT_DECISIONS.md`
- Pack Creation: **“Did you include these?”** section on main build screen with recipe optional Yes/No toggles (Mom and Baby packs)
- Pack Creation: `choice-extra` menu path for unlisted custom extras
- CSS for `.common-extras` and `.add-item-strip` on build screen
- Lead Product Engineer workflow (`.cursor/rules/lead-product-engineer.mdc`, `.cursor/rules.md`, `docs/CURSOR_RULES.md`) — three-solution proposals, approval gate, auto-commit
- Mandatory documentation maintenance protocol in `.cursor/rules.md`, `docs/CURSOR_RULES.md`, and `README.md`
- Documentation maintenance pointer in `docs/AI_CONTEXT.md`
- Lead Engineer six-phase workflow in `.cursor/rules.md`, `docs/CURSOR_RULES.md`, and `README.md` (superseded by Lead Product Engineer workflow)
- Design review checklist (`docs/DESIGN_REVIEW_CHECKLIST.md`)

### Fixed

- Analytics session classification: sessions use last-known `sessionUser` (not first-wins + stain); `analyticsSessionUser` no longer hydrates from persisted packer on page load; build view syncs packer to analytics when dropdown unchanged

### Changed

- Analytics schema 1.1.0: optional `sessionUser`, `currentSelectedUser`, `isTesterSession` on key events; summary includes `productionVolunteerSessions`, `testerSessions`, `unknownSessions`
- Entry screen (Increment A): four verb-first actions on primary surface; admin dashboard, low-stock cards, and stock list removed from entry; backup/analytics/undo/stock levels behind **Need something else?**
- Pack Creation: usage preview moved below optional toggles and renamed **“Stock this save will use”**
- Pack Creation: **“+ Something else happened”** subflow limited to swaps, omissions, and unlisted extras (removed `choice-optional` / duplicate toggle list)
- Pack Creation: admin footer removed from build and add-item views (export/backup on home **Need something else?**)
- Legacy `addItemStep === "optional"` redirects to main build screen for backwards compatibility
- `docs/AI_CONTEXT.md`: Janet and Judy both listed as primary users

### Fixed

- Common extras (deo, tissues, wet wipes, hand cream) no longer require three taps through the add-item menu

### Removed

- `choice-optional` (“We added something”) from add-item menu — common extras moved to main screen

---

## [YYYY-MM-DD]

<!-- TODO: Add release or milestone date -->

### Added

<!-- TODO -->

### Changed

<!-- TODO -->

### Fixed

<!-- TODO -->

### Removed

<!-- TODO -->

---

## Template (copy for new entries)

```markdown
## [YYYY-MM-DD]

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 
```
