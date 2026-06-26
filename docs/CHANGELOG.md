# Changelog

> Reverse chronological order (newest first). Content to be added later.

---

## [Unreleased]

### Added

- Donation form spacing: item line card no longer butts against donor field or **Add another item**; extra padding and label gaps inside the bordered item card
- GitHub Actions workflow `tests.yml` — runs all headless `tests/*.test.js` on push (`main`, `feat/**`) and pull requests

- Field validation kit: `docs/FIELD_VALIDATION.md` (session script, observation checklist, pass/fail rubric); structured capture templates in `docs/USER_RESEARCH.md`
- Bible documentation pass: filled User Personas, Physical Workflow, Information Architecture, Screen Specifications, Inventory/Donation/Packing/Delivery logic, Rejected Ideas, Technical Architecture, and Glossary in `docs/THE_ZOE_PROJECT_BIBLE.md`
- Content-Security-Policy meta tag in `zoe-pack-manager.html` for defense-in-depth when hosted (`default-src 'self'`, inline script/style allowed, `connect-src 'none'`, `data:` images); comment documents equivalent server header for deploys including `frame-ancestors 'none'`

- njsscan CI now runs on all pull requests and on pushes to `feat/**` branches (not only `main`), so feature branches like `feat/belief-calibration` are scanned before merge
- Export hygiene note in admin tools (**Need something else?** / footer): inline warning that Backup and AI Data Pack files may include sensitive local data (donors, packers, clinics, transaction history, analytics); no export payload or volunteer flow changes
- Backup import hardening (M1): shared `normalizeImportedState()` for `loadState()` and file import — 10 MB file cap, transaction/donor/analytics/undo bounds, `undoSnapshot` migration; import validates before confirm and reports trim counts in analytics. Headless test `tests/backup-import.test.js`
- Session transaction-derived cache (M2): `sessionStockBeliefState()` and `sessionActivityStatsIndex()` cache full-log replay per session; invalidated on transaction commit, undo, import, and sample-data load; recount capture and exports reuse cache. Headless test `tests/session-tx-cache.test.js`

- Operational Reasoning Engine (Phase 4.0, export-only): new primary epistemic layer (`operationalReasoning`, `REASONING_MODEL_VERSION` 4.0) between Evidence Fusion and Belief Engine. Pipeline: `computeEvidenceFusion` → `computeOperationalReasoning` → `deriveBeliefsFromReasoning` → thin `computeBeliefEngine` wrapper → `operationalMemory`. Six reasoning types (`stock`, `habit`, `recipe`, `donation`, `confidence`, `readiness`) with generators (`item_constraint`, `substitution_cause`, `optional_item`, `recipe_alignment`, `donation_impact`, `inventory_confidence`, `workflow_friction`/`readiness_gate`). Reasoning objects export hypotheses (`normalizeProbabilities`, status leading/plausible/weak/contradicted/insufficient_evidence), `reasoningSteps`, `assumptions`, `counterfactuals`, `wouldChangeConclusion`, `nextBestEvidence`, `dependencyEdges`, top-level `dependencyGraph`, `reasoningMaturity`, `revisionLikelihood`, `stabilityScore`, `independentEvidenceSources`, `evidenceDiversityScore`. **Belief Engine** (`BE_MODEL_VERSION` 4.0) is now a compatibility projection with `compatibilityLayer: true`; beliefs carry `derivedFromReasoningId`, `leadingHypothesisId`, `wouldChangeMyMind`, `nextBestEvidence`. Donation/confidence reasoning-only — no new belief types. AI Data Pack exports full `operationalReasoning`; analytics summary adds `operationalReasoningSummary` only. `activeLearning: { enabled: false }`. Operational Memory: thin ctx + fix `belief.actionability` in `omFilterRedundantMemories`. Headless test `tests/operational-reasoning.test.js`. No volunteer UI, no transaction/localStorage schema changes.

- Evidence Freshness Layer (Phase 3E.1, export-only): shared evidence ageing model (`EVIDENCE_FRESHNESS_MODEL_VERSION` 3E.1) with deterministic bands (fresh/recent/ageing/stale/historical/unknown), half-life exponential weights (0.10–1.00), and `annotateEvidenceFreshness` helpers. Thin **Evidence Fusion** collector (`evidenceFusion`) normalizes evidence from operational intelligence, packing habits, item confidence, stock belief-state, config, and interaction episodes — each record carries `freshness` metadata and per-object `evidenceFreshnessSummary`. **Belief Engine** keeps raw `confidenceProbability` / `confidenceBand`; adds parallel `supportingEvidenceDetail` / `contradictingEvidenceDetail`, `evidenceFreshnessSummary`, `freshnessConfidenceModifier`, and `freshnessAdjustedConfidenceProbability`. **Operational Memory** exports `evidenceDetail` and `evidenceFreshnessSummary`; stale-only historical evidence downgrades status and caps confidence. Analytics summary includes `evidenceFusionSummary`. Headless test `tests/evidence-freshness.test.js`. No volunteer UI, no transaction/localStorage schema changes.

### Changed

- Packing habit trend windows prefer **calendar comparison** (last 90 days vs previous 90 days per pack type) with count-based fallback when a date window is too sparse; denominators use actual builds in each window; `windowsSummary` exports `windowMode`, `windowDays`, and date spans
- Item confidence movement scoring is **unit-weighted**: `totalMovements` sums pack deductions and donation units since last recount, not one tick per build touch; scoring thresholds and reason copy adjusted accordingly (`buildTouchCount` unchanged for volunteer view)
- Operational memory **deduplication**: memory ctx reads `stockBeliefState` and `recountCalibration` first; habit memories suppressed when trend evidence is `too_early`; weak stock/confidence memories dropped when belief-state or calibration already covers the signal; subject-level dedupe before top-10 cap
- Recount Calibration now also scores the belief-state's *uncertainty*, not just point estimates (`rc.2`): `commitRecount` additionally captures the belief-state interval `μ ± 2σ` (`tx.prediction.belief`) before the count. The calibration then computes the standardized error `z = (actual − μ)/σ` per recount and a `beliefCalibration` block — 95% interval coverage (target ~0.95), mean `z` (bias), mean `z²` (variance fit; ~1 ideal, ≫1 = intervals too narrow/overconfident, ≪1 = too wide/underconfident), and a `well_calibrated`/`overconfident`/`underconfident`/`provisional` verdict — plus a `beliefHeadline` in the analytics summary. Closes Idea 1 ↔ Idea 2: the belief-state's variances become measurable against ground truth. Backward compatible (older `rc.1` recounts simply lack a belief interval and are excluded from belief scoring)
- Undo is now multi-level (previously single action only): `state.undoSnapshot` replaced by a bounded `state.undoStack` (last `UNDO_STACK_LIMIT` = 25 actions, LIFO); `beginTransaction()` pushes a pre-action snapshot, `undoLast()` pops one and restores `balances`/`readyPacks`/`transactions`; new `canUndo()` helper drives the home **Undo last action** button, which now stays available until the stack is empty; legacy single-slot saves migrate to the stack on load (`undoSnapshot` → `undoStack`)
- Interaction Episode Consolidation (Phase 3D.1): remove legacy batch `ui_exposure` screen snapshots (`analyticsTrackUIExposure`, `details.controlCount`, `details.controls[]`); Interaction Episodes are the canonical behavioural primitive; per-control exposure only; fix `interactionEpisodeId` on first-interaction events; `details_toggled` wired to episodes; episode complete adds `endedAt` and `visibleMs` alias; remove deprecated `ignoredControls` summary; `EPISODE_MODEL_VERSION` 3D.1.1; analytics schema 1.3.0; historical localStorage events not migrated

### Fixed

- Confirm modal XSS hardening (L2): `showConfirmModal()` no longer injects hand-built HTML strings. Summaries use an allowlisted `confirmHtml()` builder (`summarySpec` → escaped text, `<p>`, `<strong>`, `<ul>/<li>`, `<br>`, vetted `style` only); `formatBuildPreview` escapes all dynamic item names. Headless test `tests/confirm-modal.test.js`.
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

- Stock Belief-State (`bs.1`, export-only): the shelf is modelled as a *belief*, not a number. `computeStockBeliefState` replays the transaction log propagating uncertainty — each item carries a distribution `(mean μ, variance σ²)`: recounts collapse variance to ground truth, donations grow it (`(relSd·units)² + base`), builds/complete-unit deliveries grow it slightly (precise deductions), and never-counted items start at high variance. The mean μ tracks the running balance exactly (verified). **Confidence and risk are read off the distribution instead of hand-tuned:** confidence = `P(|true − μ| ≤ tolerance)` using the *same* tolerance the recount calibration loop (`rc.1`) scores against — so the model's self-assessed correctness and the loop that measures it are unified by construction; stock-out risk = `P(true < threshold)` and `zeroProbability = P(true < 0.5)` via a standard-normal CDF (Abramowitz-Stegun erf). Exported as `stockBeliefState` (per-item beliefs + tunable `parameters`) in AI Data Pack and `stockBeliefSummary` (band counts, mean confidence, least-confident items, highest stock-out risk) in analytics summary. First principled core for the future SPE-Ω belief-state; sits alongside (does not yet replace) the heuristic confidence/belief layers. No volunteer UI. Headless test `tests/stock-belief-state.test.js`
- Recount Calibration feedback loop (`rc.1`, export-only): every recount is ground truth, so `commitRecount` now captures what the item-confidence model believed the shelf held (`tx.prediction`: predicted qty, confidence band/probability, reason, movements/days since last count) just before the count overwrites it. Derived `recountCalibration` in AI Data Pack and `recountCalibrationSummary` in analytics summary score the model against reality: within-tolerance rate (±2 units or ±10%), signed-error bias, Brier score, and a four-way verdict per recount — `confident_correct`, `overconfident`, `flagged_correctly`, `false_alarm` — plus `overconfidenceRate`, `catchRate`, `falseAlarmRate`, per-band breakdown, and a recent `trackRecord`. Synthetic/sample captures are excluded from rates; `readyForCalibration` gates on ≥8 real recounts. First layer in the app that measures whether the intelligence is *right*. No volunteer UI. Headless test `tests/recount-calibration.test.js`
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
