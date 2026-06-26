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

## Current north-star direction

The app is evolving from a basic local inventory tracker into a **storeroom memory system**. Phase 1 still keeps the running-stock model: opening stock + donations − packed recipe items − deliveries ± corrections. The UX should increasingly feel like a calm companion that follows Janet’s physical workflow.

See `docs/THE_ZOE_PROJECT_BIBLE.md` and `docs/DESIGN_PRINCIPLES.md`.

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
| **We packed packs** | Record packs built from recipe + optional extras |
| **A donation arrived** | Log incoming stock from donors |
| **We delivered packs** | Record packs or complete units sent to clinics |
| **I counted something again** | Stock correction / physical recount |
| **Need something else?** | Undo, view stock levels, backup, analytics (not daily use) |

### Packing

Build Mom Pack or Baby Pack: qty, packer, destination, then **“Did you include these?”** Yes/No toggles for recipe optionals (deo, tissues, wet wipes, hand cream, etc.) on the main screen. **“+ Something else happened”** opens a slim subflow for swaps, items left out, or unlisted extras only.

### Donations

Multi-line donation entry with donor, date, item, and quantity. Quantity validation is required.

### Deliveries

Assembled packs or complete donated units to clinic destinations.

### Stock Checking

Count one item at a time; optional reason for correction.

---

## UX Rules

See `docs/DESIGN_PRINCIPLES.md` for the full storeroom-memory direction. In short:

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

The canonical app is `zoe-pack-manager.html`. Pack Creation now shows common optional toggles on the main screen (June 2026 redesign). The add-item subflow is reserved for swaps, omissions, and unlisted extras.

---

## Current Priority

Field-validate the redesigned Pack Creation flow with Janet and Judy; then donation and deliver flows. **Kit:** `docs/FIELD_VALIDATION.md` · **Capture:** `docs/USER_RESEARCH.md`

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
- **Analytics:** local event logging with JSON/CSV export for user-testing analysis (Mission Control dashboard reads exports). Key events record `sessionUser`, `currentSelectedUser`, and `isTesterSession`. Summary splits sessions into production volunteer, tester, and unknown. **Interaction Episodes (Phase 3D / 3D.1):** canonical behavioural layer — tracked-control events carry `interactionEpisodeId`; `interaction_episode_complete` on episode end; `interactionEpisodeSummary` in export. **Exposure Tracking v1:** per-control `ui_exposure` only (`details.controlId`, `visibleMs`, `clicked`) — no batch screen snapshots in new sessions. Summary `ignoredVisibleControls` (production default). **Milan** is a tester identity.
- **Item confidence (Increment A):** deterministic read-only trust scores per stock item in AI Data Pack export and analytics summary only — `volunteerConfidence` excludes Milan tester builds; `allMovementsConfidence` includes all. No volunteer UI yet. See `PRODUCT_DECISIONS.md`.
- **Packing habits (Phase 1):** read-only habit pattern observations from production build transactions in AI Data Pack (`packingHabits`) and analytics summary (`packingHabitsSummary`). Excludes Milan tester builds. Thresholded counted sentences only — no volunteer UI. See `PRODUCT_DECISIONS.md`.
- **Packing habits trends (Phase 2 / 2.1):** windowed behavioural change analysis with separate `trend` and `evidence` fields plus evidence-driven `trendReason`; probabilistic `possibleCauses` (1–3, sum to 1.0); `confidenceBand` + `confidenceProbability`; `insightQualityScore`; `belief` / `beliefPrevious` / `beliefDelta`; analytics `packingHabitTrends` (filtered `topThreeInsights` sorted by quality score; unfiltered `allInsights` and raw `trendRows` in export). Export-only. See `PRODUCT_DECISIONS.md`.
- **Operational intelligence (Phase 3A):** read-only quantity-weighted operational measurements in AI Data Pack (`operationalIntelligence`) and analytics summary (`operationalIntelligenceSummary`) — build impact, substitution impact, optional impact, donation impact, recount impact, stock risk, impact readiness, limitations. Uses `tx.qty` and substitution `packCount`/`qtyPerPack`, not event counts. No recommendations; prepares Phase 3B belief framework. Export-only. See `PRODUCT_DECISIONS.md`.
- **Belief engine (Phase 3B):** read-only belief scaffolding in AI Data Pack (`beliefEngine`) and analytics summary (`beliefEngineSummary`) — consumes item confidence, packing habits, and operational intelligence; belief types for balance, shortage, habit, recipe alignment, and readiness; deterministic confidence with caps; `observe_only` / `monitor` actionability in sandbox; `readyForRecommendations: false` on synthetic data. Not SPE, not recommendations, not volunteer-facing. Export-only. See `PRODUCT_DECISIONS.md`.
- **Operational memory (Phase 3C):** read-only memory recall layer in AI Data Pack (`operationalMemory`) and analytics summary (`operationalMemorySummary`) — consolidates repeated signals into stable memory objects with `firstSeen`/`lastSeen`; memory types for stock, habit, recipe, donation, confidence, and readiness; derived at export time (not persisted). Phase 3C.1 polish: unique donation IDs, deduped evidence, config-fact confidence floor, cautious optional-habit copy. Not SPE, not recommendations, not volunteer-facing. Export-only. See `PRODUCT_DECISIONS.md`.
- **Evidence freshness (Phase 3E):** export-only calibration layer — evidence carries `freshness` metadata (band + current-relevance weight) via shared helpers and thin **Evidence Fusion** (`evidenceFusion`). Older evidence is retained but weighted lower for belief confidence modifiers and memory status. Beliefs and memories export `evidenceFreshnessSummary`. Not SPE, not volunteer-facing. See `PRODUCT_DECISIONS.md`.
- **Operational reasoning (Phase 4):** export-only primary epistemic layer — `computeOperationalReasoning` synthesizes six reasoning types with explicit hypotheses from fused evidence; `deriveBeliefsFromReasoning` projects lightweight beliefs for backward compatibility (`beliefEngine`, `BE_MODEL_VERSION` 4.0, `compatibilityLayer: true`). Full `operationalReasoning` in AI Data Pack; analytics `operationalReasoningSummary` only. Donation/confidence reasoning-only (no new belief types). `activeLearning: { enabled: false }`. Not SPE, not volunteer-facing. See `PRODUCT_DECISIONS.md`.
- **Stock belief-state (`bs.1`):** probabilistic shelf model. `computeStockBeliefState` replays the log propagating uncertainty so each item is a distribution `(μ, σ²)` — recounts collapse variance, donations/builds grow it, never-counted items start wide; μ tracks the running balance exactly. Confidence = `P(|true − μ| ≤ tolerance)` (same tolerance as `rc.1`, so the two are unified); stock-out risk = `P(true < threshold)` via normal CDF. Exported as `stockBeliefState` (AI Data Pack) and `stockBeliefSummary` (analytics). Principled core for future SPE-Ω; sits alongside the heuristic confidence/belief layers (does not replace them yet). Export-only, no volunteer UI.
- **Recount calibration (feedback loop, `rc.2`):** read-only loop that scores both the item-confidence model and the belief-state against ground truth. `commitRecount` stamps `tx.prediction` (believed qty + confidence, **and** the belief-state interval `μ ± 2σ`) before applying the count. Derived `recountCalibration` (AI Data Pack) and `recountCalibrationSummary` (analytics) report within-tolerance rate, signed-error bias, Brier score, per-recount verdicts (`confident_correct`/`overconfident`/`flagged_correctly`/`false_alarm`), and a `beliefCalibration` block — 95% interval coverage, mean `z`, mean `z²` (variance fit), and a `well_calibrated`/`overconfident`/`underconfident` verdict. Synthetic captures excluded; ≥8 real recounts to leave `provisional`. Export-only, no volunteer UI. First measurement of whether the intelligence is correct.
- **Value of Information (`voi.1`):** ranks the single most useful next count from the belief-state. `computeCountPriorities` scores each item `voiScore = (1 − confidenceProbability) × relevance`, where relevance rewards core recipe items, stock-out likelihood, and the binding per-pack bottleneck, discounted out of season. Confidently-known items score ~0. Exported as `countPriorities` (ranked + single `topPick` with a whisper-ready message) and `countPrioritiesSummary` (analytics). The bounded form of the future SPE "one whisper" — top pick only, never a list. Export-only, no volunteer UI.
- **Exposure tracking (v1):** per-control `ui_exposure` only in new sessions (`details.controlId`, `visibleMs`, `clicked`); `ignoredVisibleControls` summary. Admin utilities tracked only inside opened **Need something else?** No volunteer UI. See `PRODUCT_DECISIONS.md`.
- **Interaction episodes (Phase 3D / 3D.1):** canonical behavioural layer — `interaction_episode_complete` events; `interactionEpisodeId` on tracked-control analytics; `interactionEpisodeSummary` in export. Episode completion reasons include clicked, hidden, navigation, timeout, blurred, cancelled, and **export** (flush before Analytics JSON / AI Data Pack export). Phase 3D.1 removed legacy batch exposure snapshots.
- **Backup:** manual export/import from hidden admin area
- **Packers:** Janet, Judy (volunteers); Milan (tester — analytics tagged `isTesterSession` when selected)

---

## Current UX Problems

- **Add-item subflow** — slimmed to exceptions only (swaps, omissions, unlisted extras); monitor June-style friction on Done/back navigation
- **Donation and deliver flows** were not exercised in the same test session — need dedicated validation
- **Admin/export on home** — moved behind **Need something else?**; confirm volunteers can still find backup when needed

---

## Deferred Ideas

- **Storeroom Prioritisation Engine (SPE):** future multi-objective decision layer; not currently implemented (see `THE_ZOE_PROJECT_BIBLE.md` → AI Roadmap)
- Major build-screen wizard or collapsed accordions
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

None. Pack Creation redesign shipped (render-only); awaiting volunteer field validation.

---

## Latest Product Decisions

| Decision | Status |
|----------|--------|
| Reject “Today's Changes” build | **Rejected** — broke quick optional-item toggles |
| Canonical app = `zoe-pack-manager.html` | **Accepted** |
| Pack Creation: common extras on main screen | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Entry screen Increment A (four verbs, no dashboard) | **Accepted** — Increment B (Today loop) deferred |
| SPE documented, implementation deferred | **Deferred** — see `PRODUCT_DECISIONS.md` |
| Milan tester analytics separation | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Item-level confidence (Increment A, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Packing habits intelligence (Phase 1, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Packing habits behavioural trends (Phase 2, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Operational intelligence foundation (Phase 3A, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Belief engine framework (Phase 3B, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Operational memory layer (Phase 3C, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Operational memory polish (Phase 3C.1) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Interaction episodes foundation (Phase 3D, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Interaction episode consolidation (Phase 3D.1, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Evidence freshness layer (Phase 3E, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Operational reasoning engine (Phase 4, export only) | **Accepted** — see `PRODUCT_DECISIONS.md` |
| Documentation-first AI workflow | **Accepted** — read this file before coding |
| Lead Engineer six-phase workflow | **Superseded** — see Lead Product Engineer workflow |
| Lead Product Engineer workflow | **Accepted** — three-solution proposals, approval gate, auto-commit; see `.cursor/rules.md` |

Full decision log: `docs/PRODUCT_DECISIONS.md`.

---

## Documentation maintenance

Every implementation session follows the **Lead Product Engineer workflow** (`.cursor/rules.md`): Understand → Think (propose solutions, wait for approval) → Implement → Self Review → Documentation → Auto-commit. Phase 5 requires reviewing all code changes and updating affected docs before finishing. See `docs/CURSOR_RULES.md` for the change → document matrix. The repository is the single source of truth.
