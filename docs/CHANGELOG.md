# Changelog

> Reverse chronological order (newest first). Content to be added later.

---

## [Unreleased]

### Changed

- Undo is now multi-level (previously single action only): `state.undoSnapshot` replaced by a bounded `state.undoStack` (last `UNDO_STACK_LIMIT` = 25 actions, LIFO); `beginTransaction()` pushes a pre-action snapshot, `undoLast()` pops one and restores `balances`/`readyPacks`/`transactions`; new `canUndo()` helper drives the home **Undo last action** button, which now stays available until the stack is empty; legacy single-slot saves migrate to the stack on load (`undoSnapshot` → `undoStack`)
- Interaction Episode Consolidation (Phase 3D.1): remove legacy batch `ui_exposure` screen snapshots (`analyticsTrackUIExposure`, `details.controlCount`, `details.controls[]`); Interaction Episodes are the canonical behavioural primitive; per-control exposure only; fix `interactionEpisodeId` on first-interaction events; `details_toggled` wired to episodes; episode complete adds `endedAt` and `visibleMs` alias; remove deprecated `ignoredControls` summary; `EPISODE_MODEL_VERSION` 3D.1.1; analytics schema 1.3.0; historical localStorage events not migrated

### Fixed

- Pack Creation stock math: optional-item substitutions no longer double-subtract the swapped-out item. `computeBuildStockPlan` removed the `insteadOf` packs in both the substitution loop and the optional de-dup step (Step 6), so swapping an *included optional* out of *some* packs under-deducted it (e.g. deo→panties in 2 of 3 packs deducted 0 deo instead of 1), silently overstating stock. Step 6 now de-dups only the substitute side; removed the now-dead `subPacksInstead` accumulator
- Pack Creation: the swap **“how many per pack”** field (`.sub-qty`) and the omission fields now refresh the build preview live. They were never wired into the build `refresh` path (only `.sub-packs` was), so editing per-pack quantity was ignored in the **“From the shelf”** preview (2 packs × 2 per pack showed `2 × …`, not `4 ×`); the value only reached the planner on Save. Wired `.sub-qty`, `.omit-item`, `.omit-packs`, `.omit-qty` into `refresh`-on-change, matching `.sub-packs`
- Interaction episodes: flush all active episodes with `completionReason: "export"` before Analytics JSON and AI Data Pack export so open episodes always have matching `interaction_episode_complete` events
- Interaction episodes: clamp `totalVisibleMs` and `visibleMs` to `<= durationMs`
- Exposure Tracking v1: per-control `ui_exposure` events now set top-level `view` to match `details.screen` via `viewOverride` on flush (fixes mismatched `view: "home"` / `details.screen: "build"` after navigation)
- Exposure Tracking v1: repair per-control `ui_exposure` lifecycle — stop flushing pending exposures on same-screen re-render (was resetting dwell before 750ms); preserve `visibleSince` across DOM handoff on re-render; defer observer bind via `requestAnimationFrame`; dedicated once global capture click listener; summary ignores legacy batch events (`details.controls[]`) and only aggregates events with `details.controlId`
- Operational memory (Phase 3C.1 polish): unique donation memory IDs via `donationId`; dedupe `evidence[]` in `omMakeMemory()`; Baby Pack unconfirmed memory confidence floor for config facts; cautious Deo optional copy when status is `insufficient_evidence` or `emerging`
- Operational intelligence (Phase 3A): rank `topThreeOperationalFacts` by operational importance (zero core items, readiness blockers, substitutions, production volume, largest donation enablement); classify donation lines into `corePackEnablement`, `optionalPackSupport`, and `substitutionSupport` with cautious estimate copy raise medium `confidenceBand` threshold to 0.55 so early evidence stays low; fix plural grammar (“Tissues were included”); title-case item names in insight copy; remove “occurred N occurrences” phrasing; unknown-cause copy reads “There is no clear explanation yet”; `possibleCauses` confidences sum exactly to 1.0 after rounding; full unfiltered insight list renamed to `allInsights` (export-only)
- Packing habit trend classification: replace misleading `unstable` label with evidence-based model — separate `trend` (too_early_to_tell, emerging, established, declining, stable) and `evidence` (too_early, early, sufficient) plus `trendReason`; distinguishes insufficient history from genuine directional change
- Packing habit trend `topThreeInsights`: aggressive filter excludes low-confidence one-off patterns (e.g. 1/10 vs 0/10); raw `trendRows` and full `allInsights` unchanged for admin analysis; low-count copy uses “may not mean anything yet” instead of “much more common”

### Added

- Headless stock-math regression test (`tests/stock-math.test.js`, run with `node tests/stock-math.test.js`, no dependencies): extracts `computeBuildStockPlan` and its helpers directly from the live HTML by brace-matching and asserts build-deduction scenarios (plain build, core/optional substitution, omissions, full swap, custom extras, `qtyPerPack` scaling) so the pack-creation stock path stays pinned
- Local static-server config (`.claude/launch.json`) for in-browser verification of the single-file app
- Interaction Episodes Foundation (Phase 3D): export-only behavioural layer grouping tracked-control analytics into coherent `interaction_episode_complete` events; active episode map keyed by screen + controlId; automatic `interactionEpisodeId` on related events via `analyticsTrack()`; summary `interactionEpisodeSummary` in AI Data Pack; 30s idle timeout; completion reasons clicked/hidden/navigation/timeout/blurred/cancelled; no volunteer UI, no SPE, no changes to Belief Engine or Operational Memory
- Exposure Tracking v1: IntersectionObserver-based per-control `ui_exposure` events for high-value controls (home verbs, pack creation, stock count); 750ms minimum visible duration; flush on viewport exit, screen change, or click; analytics summary `ignoredVisibleControls` (production default), `productionIgnoredVisibleControls`, `testerIgnoredVisibleControls`; admin export/backup/import tracked only when visible inside opened **Need something else?** (not footer admin on other screens); analytics schema 1.2.0; export-only, no volunteer UI changes
- Operational Memory Layer (Phase 3C): read-only `operationalMemory` in AI Data Pack — stable recall objects from `itemConfidence`, `packingHabits`, `operationalIntelligence`, and `beliefEngine`; memory types `stock_memory`, `habit_memory`, `recipe_memory`, `donation_memory`, `confidence_memory`, `readiness_memory`; `firstSeen`/`lastSeen` from transaction dates; `operationalMemorySummary` in analytics derived summary; derived at export time (not persisted); not SPE, not recommendations, not volunteer-facing
- Belief Engine Framework (Phase 3B): read-only `beliefEngine` in AI Data Pack — cautious export-only scaffolding for future reasoning from `itemConfidence`, `packingHabits`, and `operationalIntelligence`; belief types `item_balance`, `shortage`, `habit`, `recipe_alignment`, `readiness`; deterministic `confidenceProbability` with caps; actionability `observe_only` / `monitor` only in sandbox; `beliefEngineSummary` in analytics derived summary; not SPE, not recommendations, not volunteer-facing
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
