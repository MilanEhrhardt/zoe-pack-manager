# Product Decisions

> Decision log. Use the template below for each entry. Content to be added later.

---

## Decision Log Template

Copy this block for each new decision:

### [Decision title]

| Field | Content |
|-------|---------|
| **Decision** | <!-- TODO --> |
| **Date** | <!-- TODO --> |
| **Context** | <!-- TODO --> |
| **Decision** | <!-- TODO --> |
| **Reasoning** | <!-- TODO --> |
| **Alternatives Considered** | <!-- TODO --> |
| **Status** | <!-- TODO: e.g. Proposed / Accepted / Superseded / Rejected --> |

---

## Decisions

### Operational memory polish (Phase 3C.1)

| Field | Content |
|-------|---------|
| **Decision** | Small corrective patch to `operationalMemory` export only |
| **Date** | 2026-06-25 |
| **Context** | First AI Data Pack exports showed duplicate donation memory IDs, repeated evidence lines, Baby Pack config memory scored too low, and Deo optional copy overclaimed on insufficient evidence. |
| **Decision** | Use `donation_memory:{itemId}:{donationId}` for unique IDs; dedupe `evidence[]` in `omMakeMemory()`; apply `configFact` confidence floor (0.35) for Baby Pack unconfirmed; use cautious Deo copy unless status is `active` with moderate+ confidence. Model version `3C.1.1`. No other layer changes. |
| **Reasoning** | Keeps memory export trustworthy without widening scope or touching volunteer flows. |
| **Alternatives Considered** | **Aggregate same-day donations** — deferred; donationId is simpler. **Change belief engine** — out of scope. |
| **Status** | Accepted |

### Operational memory layer (Phase 3C, export only)

| Field | Content |
|-------|---------|
| **Decision** | Read-only operational memory in export and analytics summary only; no volunteer UI, no SPE, no persistence in Phase 3C |
| **Date** | 2026-06-25 |
| **Context** | Phase 3B beliefs answer "what do we currently believe?" at export time. Ops and future SPE need stable recall objects answering "what should the system remember as an ongoing fact?" — with `firstSeen`/`lastSeen`, bounded memory types, and cautious copy distinct from beliefs. |
| **Decision** | Add Phase 3C pipeline: `computeOperationalMemory(ctx)` consuming `itemConfidence`, `packingHabits`, `operationalIntelligence`, optional `beliefEngine`, and `synthetic`. Builders: stock, habit, recipe, donation (max 2), confidence, readiness memories. Export `operationalMemory` in AI Data Pack; analytics summary includes `operationalMemorySummary`. Memories derived at export from transaction history — not persisted across sessions. `readyForOperationalRecall: false` on synthetic data. Cautious copy — the system remembers, evidence suggests, observe only. No localStorage schema change. No changes to commit flows, stock math, recipes, render functions, or volunteer UI. |
| **Reasoning** | Separates recall scaffolding from epistemic beliefs and quantity measurements. Gives future layers a stable memory vocabulary without alarming Janet or overclaiming from sparse data. |
| **Alternatives Considered** | **Persisted memory store** — deferred to Phase 3D+. **Fold into belief engine** — rejected; beliefs and memories serve different questions. **Volunteer-facing memory** — rejected. |
| **Status** | Accepted |

### Belief engine framework (Phase 3B, export only)

| Field | Content |
|-------|---------|
| **Decision** | Read-only belief scaffolding in export and analytics summary only; no volunteer UI, no SPE, no recommendations in Phase 3B |
| **Date** | 2026-06-25 |
| **Context** | Phase 3A supplies quantity-weighted measurements and an `impactReadiness` gate. Before any operational impact judgements or SPE work, the codebase needs a stable place where future beliefs will live — with cautious copy, deterministic confidence, and explicit limitations. |
| **Decision** | Add Phase 3B pipeline: `computeBeliefEngine(ctx)` consuming `itemConfidence`, `packingHabits`, `operationalIntelligence`, and `synthetic: !!state.sampleData`. Builders: `computeItemBalanceBeliefs`, `computeShortageBeliefs`, `computeHabitBeliefs`, `computeRecipeAlignmentBeliefs`, `computeReadinessBeliefs`, plus `computeBeliefConfidence` and `beliefEngineSummaryConcise`. Export `beliefEngine` in AI Data Pack; analytics summary includes `beliefEngineSummary`. Default actionability `observe_only` or `monitor`; never `ready_for_review` when synthetic or `impactReadiness.readyForImpactJudgement` is false. `readyForRecommendations` false in sandbox. Cautious copy only — currently believe, evidence suggests, may, appears, monitor. No localStorage schema change. No changes to commit flows, stock math, recipes, render functions, or volunteer UI. |
| **Reasoning** | Defines structural framework for future reasoning without overclaiming from sparse or synthetic data. Keeps measurement (3A) separate from belief scaffolding (3B) and deferred impact judgements. |
| **Alternatives Considered** | **Evidence Fusion Engine** — deferred; user chose belief framework first. **Volunteer-facing beliefs** — rejected. **Persisted belief state** — rejected; schema change forbidden. **ready_for_review in sandbox** — rejected. |
| **Status** | Accepted |

### Operational intelligence foundation (Phase 3A, export only)

| Field | Content |
|-------|---------|
| **Decision** | Read-only operational measurement layer in export and analytics summary only; no volunteer UI in Phase 3A |
| **Date** | 2026-06-25 |
| **Context** | Packing Habits describe behavioural patterns; item confidence describes trust. Ops and future SPE need quantity-weighted operational facts — which habits consumed stock, which donations may have enabled packs, which recounts shifted confidence, which items carry risk — before any system can judge whether actions were “good” or “bad.” |
| **Decision** | Add Phase 3A pipeline: `computeOperationalIntelligence()` → sections `buildImpact`, `substitutionImpact`, `optionalImpact`, `donationImpact`, `recountImpact`, `stockRisk`, `impactReadiness`, `limitations`. Count packs via `tx.qty` and substitutions via `packCount` × `qtyPerPack`, not build-event counts. Default to production-only (`isTesterUser`); export `allMovements` where useful. Reuse `computeBuildStockPlan()` read-only for consumption. Cross-link packing habits where available. `impactReadiness` gates Phase 3B judgement. Cautious language only — may, appears, estimated, not enough evidence. No recommendations. Export `operationalIntelligence` in AI Data Pack; analytics summary includes `operationalIntelligenceSummary`. No localStorage schema change. No changes to commit flows, stock math, recipes, or volunteer UI. |
| **Reasoning** | Separates measurement from judgement. Gives Phase 3B Operational Impact Engine structured ingredients without alarming Janet or overclaiming from sparse/synthetic data. |
| **Alternatives Considered** | **Jump straight to Phase 3B recommendations** — rejected; insufficient epistemic foundation. **Persist operational state** — rejected; schema change forbidden. **Event-count metrics** — rejected; misrepresents qty-10 builds and packCount substitutions. |
| **Status** | Accepted |

### Evidence-based habit trend classification

| Field | Content |
|-------|---------|
| **Decision** | Replace `unstable`/directional sub-labels with `trend` + `evidence` + `trendReason` |
| **Date** | 2026-06-25 |
| **Context** | Phase 2 labelled low-sample changes (e.g. 1/10 → 3/10) as `unstable`, implying volunteer inconsistency when the dataset was simply too small. |
| **Decision** | `trend`: too_early_to_tell, emerging, established, declining, stable. `evidence`: too_early, early, sufficient. Add human `trendReason`. Remove `unstable`, `new`, `strengthening`, `weakening`, `disappearing` from export. Exclude `too_early_to_tell` from `topThreeInsights`. Raw `trendRows` remain unfiltered. |
| **Reasoning** | Separates “we don't yet know” from “behaviour appears to be emerging/established/declining.” Avoids blaming volunteers for insufficient data. |
| **Alternatives Considered** | **Single combined trend field** — rejected; user approved two-field model. **Keep unstable for flip-flops** — rejected; conflates concepts. |
| **Status** | Accepted |

### Packing habit trend insight noise filter

| Field | Content |
|-------|---------|
| **Decision** | Filter `topThreeInsights` aggressively; keep full raw `trendRows` in export |
| **Date** | 2026-06-25 |
| **Context** | Phase 2 `topThreeInsights` surfaced low-confidence one-off patterns (e.g. 1/10 vs 0/10) with misleading “much more common” copy. |
| **Decision** | `topThreeInsights` only includes insights where confidence is medium/high, OR recentCount ≥ 3, OR previousCount ≥ 3, OR \|deltaPercentage\| ≥ 30; explicitly excludes one-off patterns (recentCount ≤ 1 AND previousCount ≤ 1). Full `trends.trendRows` and `allInsights` arrays remain unfiltered in AI Data Pack. Low-count emerging/strengthening copy says “may not mean anything yet” instead of “much more common.” |
| **Reasoning** | Ops summary should highlight actionable patterns; Milan retains full technical data for analysis. |
| **Alternatives Considered** | **Filter all insights** — rejected; loses admin audit trail. **Raise window minimum to 25** — rejected; sandbox has insufficient history. |
| **Status** | Accepted |

### Packing habits behavioural trends (Phase 2 / 2.1, export only)

| Field | Content |
|-------|---------|
| **Decision** | Windowed habit trend analysis in export and analytics summary only; no volunteer UI in Phase 2 |
| **Date** | 2026-06-25 |
| **Context** | Phase 1 describes what habits exist. Ops and future SPE need to know whether behaviour is emerging, strengthening, stable, weakening, or disappearing — without Bayesian models, RL, or volunteer-facing dashboards. |
| **Decision** | Add Phase 2 pipeline after Phase 1: `deriveHistoricalHabitWindows` → `compareHabitWindows` → `computeHabitTrendClassification` → `computeHabitCauseProbabilities` → `buildTrendReason` → `generateHabitInsights` → `packingHabitTrendSummary`. Per packKey, compare non-overlapping recent/previous windows (25/25, else 20/20, else 10/10). Classify trends by percentage-point deltas. Probabilistic `possibleCauses` (stock shortage, recount discrepancy, seasonality, recipe change candidate, volunteer preference, unknown — 1–3 ranked, confidences sum to 1.0). `confidenceBand` + `confidenceProbability`; `insightQualityScore` for ranking; `belief` / `beliefPrevious` / `beliefDelta` (belief = confidenceProbability until Phase 3). Five-section human insights. Extend `packingHabits.observations` with trend fields; add `packingHabits.allInsights` (unfiltered export-only); analytics summary includes `packingHabitTrends`. Excludes Milan tester builds. Human language only. No localStorage schema change. No changes to stock math, recipes, or volunteer UI. |
| **Reasoning** | Smallest step from description to interpretation; deterministic and testable; feeds SPE recipe-importance and ops review without alarming Janet. Phase 2.1 improves epistemic honesty without changing volunteer workflows. |
| **Alternatives Considered** | **Fold trends into Phase 1 observations only** — rejected; loses insight narrative and summary counts. **Persist rolling habit state** — rejected; schema change forbidden. **Bayesian/RL models** — explicitly deferred to Phase 3. **Single winning cause** — rejected in 2.1; multiple hypotheses coexist with weighted confidence. |
| **Status** | Accepted |

### Packing habits intelligence (Phase 1, export only)

| Field | Content |
|-------|---------|
| **Decision** | Production-only packing habit observations in export and analytics summary only; no volunteer UI in Phase 1 |
| **Date** | 2026-06-25 |
| **Context** | Volunteers develop substitutions, usual optionals, custom extras, and omissions that may diverge from written recipes. This signal is buried in raw build transactions. SPE Phase 1 needs recipe-importance and habit signals without alarming Janet or changing stock math. |
| **Decision** | Add read-only pipeline: `extractPackingHabitEvents` → `computePackingHabitPatterns` → `generatePackingHabitObservations` → `packingHabitSummary`. Patterns: substitution pairs, optional usage, custom extras, omissions. Thresholds: min 5 production builds per pack, min 3 occurrences, min 40%. Export includes `packingHabits` in AI Data Pack; analytics summary includes `packingHabitsSummary`. Excludes Milan tester builds via `isTesterUser`. Human `volunteerText` with counts only — no “drift detected” language. No localStorage schema change. No changes to `commitBuild`, `computeBuildStockPlan`, or volunteer UI. |
| **Reasoning** | Mirrors item-confidence Increment A: testable read-model, ops-facing export, SPE-ready. Milan sandbox will show few observations until enough Janet/Judy builds exist — correct behaviour. |
| **Alternatives Considered** | **Extend existing `optionUsage`** — rejected; includes tester builds, no substitution detail, no thresholds. **Persist habit profiles in localStorage** — rejected; schema change forbidden. |
| **Status** | Accepted |

### Item-level confidence (Increment A, export only)

| Field | Content |
|-------|---------|
| **Decision** | Deterministic per-item confidence in export and analytics summary only; no volunteer UI in Increment A |
| **Date** | 2026-06-25 |
| **Context** | Janet's core problem is trust in stock numbers, not arithmetic. DESIGN_PRINCIPLES and THE_ZOE_PROJECT_BIBLE call for a future Confidence Meter. SPE Phase 1 needs belief-state signals without volunteer-facing dashboards. |
| **Decision** | Add read-only `computeAllItemConfidence()` derived from transactions + item/recipe metadata. Each item gets `confidenceScore` (0–100), `confidenceBand`, `confidenceReason`, `recommendedAction`, and `volunteerLabel`. Export includes `volunteerConfidence` (excludes Milan tester builds) and `allMovementsConfidence`. Analytics summary includes `confidenceSummary`. Sample data caps volunteer scores at 79. No localStorage schema change. No UI on Home, Pack Creation, or Stock view yet. |
| **Reasoning** | Smallest safe foundation for SPE and ops analysis without changing stock math or alarming Janet. Split views keep tester pack deductions out of production confidence. |
| **Alternatives Considered** | **Recency-only labels** — rejected as too coarse. **Volunteer UI in Phase 1** — rejected; Increment B deferred until field validation. **Persisted belief state** — rejected; schema migration risk. |
| **Status** | Accepted |

### Interaction Episode Consolidation (Phase 3D.1)

| Field | Content |
|-------|---------|
| **Decision** | Remove legacy batch exposure; episodes canonical |
| **Date** | 2026-06-25 |
| **Context** | Phase 3D shipped episodes alongside legacy `analyticsTrackUIExposure()` batch snapshots (`details.controlCount`, `details.controls[]`). Redundant — future AI should reason from Interaction Episodes, not inventories of visible controls. |
| **Decision** | Delete `analyticsTrackUIExposure()`, `analyticsVisibleControls()`, `analyticsControlKey()`, and batch aggregation in `analyticsDerivedSummary()`. Remove deprecated `ignoredControls` summary (superseded by `ignoredVisibleControls` + `interactionEpisodeSummary`). Keep per-control `ui_exposure` only. Fix `interactionEpisodeId` attachment before episode observe/complete. Wire `details_toggled` to episodes via summary `target` meta. Episode complete adds `endedAt` and `visibleMs` alias. Flush active episodes with `completionReason: "export"` before Analytics JSON and AI Data Pack export. `EPISODE_MODEL_VERSION = 3D.1.1`, `ANALYTICS_SCHEMA_VERSION = 1.3.0`. Historical localStorage events not migrated — new sessions only. Export-only. No volunteer UI, intelligence layer, or localStorage schema changes. |
| **Reasoning** | Completes telemetry architecture refactor: Analytics Events → Interaction Episodes → future Behaviour Objects → AI. |
| **Alternatives Considered** | **Keep batch snapshots for backward compat** — rejected; redundant and confusing. **Migrate historical events** — rejected; out of scope. |
| **Status** | Accepted |

### Interaction Episodes Foundation (Phase 3D)

| Field | Content |
|-------|---------|
| **Decision** | Export-only behavioural episode layer; no volunteer UI |
| **Date** | 2026-06-25 |
| **Context** | Raw analytics exports thousands of disconnected events (click, focus, blur, scroll, ui_exposure). Future AI must reconstruct behaviour manually. Need a coherent behavioural primitive between analytics events and higher intelligence layers. |
| **Decision** | Add Phase 3D Interaction Episodes: active episode map keyed by `screen` + `controlId` for tracked controls; episode lifecycle from visibility or first interaction through click/blur/navigation/hidden/timeout/cancelled; emit `interaction_episode_complete` on end; auto-attach `interactionEpisodeId` to related events via `analyticsTrack()` without modifying every emitter; `interactionEpisodeSummary` in analytics derived summary / AI Data Pack. `EPISODE_MODEL_VERSION = 3D.1`, `EPISODE_IDLE_TIMEOUT_MS = 30000`. Export-only. No changes to Packing Habits, Operational Intelligence, Belief Engine, Operational Memory, volunteer UI, commit flows, stock, recipes, or localStorage schema. |
| **Reasoning** | Episodes become the behavioural object future SPE and AI consume. Volunteers see nothing. Isolated from higher layers — episodes read from analytics instrumentation only. |
| **Alternatives Considered** | **New analytics event type only** — rejected; episodes need stateful lifecycle not one-shot events. **Persist episodes in localStorage** — rejected; schema migration risk. **Modify every emitter** — rejected; centralise via `analyticsTrack()`. |
| **Status** | Accepted |

### Exposure Tracking v1 (ignored visible controls)

| Field | Content |
|-------|---------|
| **Decision** | Per-control exposure analytics for high-value controls only; no volunteer UI |
| **Date** | 2026-06-25 |
| **Context** | Batch `ui_exposure` snapshots list visible controls but cannot distinguish dwell time or click outcome. Need “seen but not clicked” signal for usability analysis without contaminating data with admin utilities Janet is not expected to use. |
| **Decision** | Add `IntersectionObserver`-based per-control `ui_exposure` events (`controlId`, `label`, `visibleMs`, `clicked`, `screen`) with 750ms minimum dwell. Log on viewport exit, screen change, or click. High-value controls only. Admin export/backup/import tracked only when visible inside opened **Need something else?** on home. Summary: `ignoredVisibleControls` (production default), `productionIgnoredVisibleControls`, `testerIgnoredVisibleControls`. Phase 3D.1 removed legacy batch snapshots — per-control events only in new sessions. No localStorage schema migration. No stock/recipe/commit/volunteer workflow changes. |
| **Reasoning** | Measures meaningful ignored controls for Janet's daily path. IntersectionObserver naturally excludes collapsed admin. Production-default summary keeps Milan test sessions separable without deleting data. |
| **Alternatives Considered** | **Track all buttons** — rejected; noisy dataset. **Track footer admin everywhere** — rejected; contaminates volunteer usability signal. **Keep batch exposure indefinitely** — superseded by Phase 3D.1 episode consolidation. |
| **Status** | Accepted |

### Milan tester analytics separation

| Field | Content |
|-------|---------|
| **Decision** | Add Milan as packer option; tag tester sessions in analytics without deleting data |
| **Date** | 2026-06-25 |
| **Context** | Developer testing (Milan) polluted volunteer usability analysis. Full login/auth is out of scope. |
| **Decision** | Milan appears in the existing packer dropdown. `isTesterUser("Milan")` tags analytics events and AI Data Pack exports with `sessionUser`, `currentSelectedUser`, `isTesterSession`. Summary splits `productionVolunteerSessions`, `testerSessions`, `unknownSessions`. No passwords, accounts, or auth. Stock and pack logic unchanged. |
| **Reasoning** | Smallest safe separation: one extra dropdown name, additive analytics fields, future exports can exclude tester sessions. Janet/Judy workflow unchanged — no “admin login” language. |
| **Alternatives Considered** | **devMode toggle** — rejected for now; easy to forget. **Separate app build** — rejected; too heavy. **Delete tester analytics** — rejected; Milan needs history for debugging. |
| **Status** | Accepted |

### SPE is a future intelligence layer, not a Phase 1 UI feature

| Field | Content |
|-------|---------|
| **Decision** | Document SPE as future roadmap; do not implement yet |
| **Date** | 2026-06-25 |
| **Context** | Explored multi-objective recommendation systems inspired by large-scale recommender architecture (candidate generation, Pareto filtering, context policies). SPE-Ω captured as theoretical north star in `THE_ZOE_PROJECT_BIBLE.md`. |
| **Decision** | SPE and SPE-Ω are documented in `THE_ZOE_PROJECT_BIBLE.md` only. No engine code, no Janet whisper, no UI changes until core workflows are field-validated. |
| **Reasoning** | Current priority is stabilising Janet's core workflows. SPE is valuable but premature as a visible UI layer. |
| **Alternatives Considered** | **Implement Phase 1 now** — rejected; distracts from Pack Creation / donation / deliver field validation. **Do not document** — rejected; would lose design work. |
| **Status** | Accepted / Deferred |

### Entry screen Increment A (four verbs, no dashboard)

| Field | Content |
|-------|---------|
| **Decision** | Simplify entry screen to calm “What happened today?” with four primary verbs; move ops tools behind **Need something else?** |
| **Date** | 2026-06-25 |
| **Context** | Home headline matched storeroom-memory direction but the body behaved like an inventory dashboard (pack counts, LOW stock, nudges, full stock list). Fourth verb (stock correction) was buried in Admin. |
| **Decision** | Ship **Increment A** of the Recommended “Today loop” plan: primary surface shows We packed packs / A donation arrived / We delivered packs / I counted something again. Remove dashboard cards from entry. Relocate undo, stock levels view, backup, and analytics to discreet **Need something else?** Defer resume card, draft persistence, post-save loop, and today summary (Increment B). Render/CSS/navigation only — no business logic changes. |
| **Reasoning** | Aligns entry UX with DESIGN_PRINCIPLES without the regression risk of Increment B before field validation. Volunteers see verbs, not inventory intelligence, on open. |
| **Alternatives Considered** | **Conservative:** label tweaks only — rejected; dashboard contradiction remained. **Radical:** timeline-first, no home — rejected for Janet; deferred to Phase 2+. **Full Today loop (Increment B):** approved direction but explicitly deferred. |
| **Status** | Accepted |

### Pack Creation screen redesign (common extras on main screen)

| Field | Content |
|-------|---------|
| **Decision** | Move recipe optional toggles to the main Pack Creation screen; narrow “Add something different” to swaps, omissions, and unlisted extras only; remove admin footer from build/add-item views |
| **Date** | 2026-06-24 |
| **Context** | June user testing showed common extras (deo, tissues, wet wipes, hand cream) buried behind three taps in the add-item subflow. Analytics showed friction on `add-item-done-bottom` and admin distraction during packing. |
| **Decision** | Ship the **Recommended** option from the Pack Creation redesign plan: render/bind/CSS only — no changes to `commitBuild`, `checkBuild`, or stock logic. Remove `choice-optional` menu path (redirect legacy `addItemStep === "optional"` to main screen). Add `choice-extra` for unlisted custom extras. |
| **Reasoning** | Restores the quick multi-select happy path Janet/Judy need without repeating the rejected “Today's Changes” one-by-one pattern. Rare exceptions stay in a slimmer subflow. |
| **Alternatives Considered** | **Conservative:** copy/label tweaks only — extras still two taps away. **Radical:** wizard or one-item-per-screen — rejected; repeats failed Today's Changes UX. |
| **Status** | Accepted |

### Lead Product Engineer workflow

| Field | Content |
|-------|---------|
| **Decision** | Adopt Lead Product Engineer workflow with three-solution proposals, approval gate, and auto-commit |
| **Date** | 2025-06-25 |
| **Context** | AI agents were implementing requests without challenging assumptions or waiting for approval. The existing six-phase Lead Engineer workflow lacked formal solution comparison and a hard approval gate before coding. |
| **Decision** | Rename role to Lead Product Engineer. For features and non-trivial changes: challenge the request, propose Conservative / Recommended / Radical solutions with trade-offs, recommend one, and wait for approval before coding. For trivial fixes: short plan + approval. Auto-commit when Phases 3–5 complete (design review passed or trade-off documented). Codify in `.cursor/rules/lead-product-engineer.mdc`, `.cursor/rules.md`, and `docs/CURSOR_RULES.md`. |
| **Reasoning** | Volunteers depend on stable behaviour; order-taking agents risk regressions. Three options force deliberate trade-off thinking without the overhead of a full proposal log. Auto-commit improves velocity while design review and doc updates remain gates. |
| **Alternatives Considered** | **Conservative:** conversation-only adoption (no doc changes) — rejected because behaviour would not persist across sessions. **Radical:** separate workflow bible + mandatory proposal log in PRODUCT_DECISIONS — rejected as doc fatigue for a single-file volunteer app. |
| **Status** | Accepted |
