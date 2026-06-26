# The Zoe Project Bible

> Table of contents only. Content to be added later.

## Table of Contents

1. [Vision](#vision)
2. [Mission](#mission)
3. [Product Philosophy](#product-philosophy)
4. [Design Principles](#design-principles)
5. [User Personas](#user-personas)
6. [User Research](#user-research)
7. [Current Physical Workflow](#current-physical-workflow)
8. [Information Architecture](#information-architecture)
9. [Screen Specifications](#screen-specifications)
10. [Inventory Logic](#inventory-logic)
11. [Donation Logic](#donation-logic)
12. [Packing Logic](#packing-logic)
13. [Delivery Logic](#delivery-logic)
14. [Analytics Strategy](#analytics-strategy)
15. [AI Roadmap](#ai-roadmap)
16. [Future Vision](#future-vision)
17. [Rejected Ideas](#rejected-ideas)
18. [Technical Architecture](#technical-architecture)
19. [Glossary](#glossary)

---

## Vision

The Zoe Project Pack Manager is evolving into a **storeroom memory system** — software that holds what volunteers already know (who packed, what arrived, what went out, what the shelf actually holds) without feeling like software.

Volunteers should feel they have **walked into the storeroom**, not opened a spreadsheet.

## Mission

Support **Janet** and **Judy** — and every storeroom volunteer — doing real packing, receiving, counting, and delivery work with **dignity, care, and confidence**.

## Product Philosophy

### The storeroom, not inventory software

The app is not an inventory system. It **is** the storeroom. Optimise for volunteer confidence, not back-office efficiency.

### Four verbs

Everything volunteers do maps to four plain actions:

1. **Packed packs**
2. **A donation arrived**
3. **I counted something again**
4. **We delivered packs**

The home screen asks **“What happened today?”** There is no conventional dashboard for Janet.

### Memory, not ledger

Over time the app should remember:

- last packer
- usual destination
- usual extras
- seasonal rhythm (winter extras, summer extras, cotton beanies, blankets)

### Cultural core

**“We always have everything matching”** is central to The Zoe Project — not a minor feature.

Matching, care, dignity, and thoughtful packing are part of the product philosophy and must be preserved as the tool grows.

### Celebrate people, not data

Say “20 mothers now have packs ready,” not “20 transactions saved.” Hide database concepts (transactions, sessions, records, inventory adjustments, analytics, schemas) from volunteer-facing experience.

### Confidence Meter (Phase 1 — export only)

**Increment A (shipped):** A deterministic **item-level confidence** read-model computes trust scores from recount recency, movements since last count, donations, pack deductions (via `computeBuildStockPlan`), substitutions/omissions, and recipe role. Exported in AI Data Pack as `itemConfidence` with split `volunteerConfidence` / `allMovementsConfidence`. Analytics summary includes `confidenceSummary`. Janet sees nothing new yet.

**Increment B (deferred):** Calm human phrase on Stock view when an item is selected — no scores, no blocking.

See [`docs/PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md).

### Packing Habits Intelligence Engine (Phase 1 — export only)

**Phase 1 (shipped):** A read-only pipeline over **production build transactions** (tester builds excluded) surfaces counted habit observations: substitutions, optional inclusions, custom extras, and omissions. Each observation includes human `volunteerText` with counts (e.g. “Deodorant was included in 8 of the last 10 Mom Packs”), confidence band, and ops `recommendation`. Exported in AI Data Pack as `packingHabits`; analytics summary includes `packingHabitsSummary`. Janet sees nothing new yet. Feeds future SPE **recipe importance** signals.

**Phase 2 (shipped):** Compares **non-overlapping recent and previous windows** of production builds per pack type (25/20/10 builds). Exports separate **`trend`** (too_early_to_tell, emerging, established, declining, stable) and **`evidence`** (too_early, early, sufficient) plus evidence-driven **`trendReason`** — never `unstable`. Adds probabilistic **`possibleCauses`** (1–3 hypotheses with confidences summing to 1.0), **`confidenceBand`** + **`confidenceProbability`**, **`insightQualityScore`**, and **`belief`** / **`beliefPrevious`** / **`beliefDelta`** (belief = confidenceProbability until Phase 3 Bayesian updates). Human `allInsights` use five-section copy (headline, facts, interpretation, explanation, action). Analytics summary includes `packingHabitTrends` with quality-ranked `topThreeInsights`. Still export-only — Janet sees nothing new.

**Phase 2.1 (shipped):** Refines Phase 2 epistemic honesty — replaces single `likelyCause` with scored cause probabilities, number-driven explanations, and quality-based insight ordering. No volunteer workflow changes.

### Operational Intelligence Foundation (Phase 3A — export only)

**Phase 3A (shipped):** A read-only **operational measurement layer** derives quantity-weighted facts from existing transactions: build impact (packs created via `tx.qty`), substitution impact (`packCount` × `qtyPerPack`), optional impact, donation enablement estimates, recount variance effects, item-level stock risk, and an `impactReadiness` gate for Phase 3B. Exported as `operationalIntelligence` in AI Data Pack; analytics summary includes `operationalIntelligenceSummary`. Production-only default; Milan tester builds excluded from primary measurements. **Does not make recommendations** — prepares the belief engine framework (Phase 3B). Janet sees nothing new.

### Belief Engine Framework (Phase 3B — export only)

**Phase 3B (shipped):** A read-only **belief scaffolding layer** consumes `itemConfidence`, `packingHabits`, and `operationalIntelligence` to export structured `beliefs` with types (`item_balance`, `shortage`, `habit`, `recipe_alignment`, `readiness`), deterministic `confidenceProbability` with caps, supporting/contradicting evidence, and actionability (`observe_only`, `monitor`; no `ready_for_review` on synthetic data or when impact readiness is false). Exported as `beliefEngine` in AI Data Pack; analytics summary includes `beliefEngineSummary`. **Not SPE, not recommendations, not volunteer-facing** — defines where future reasoning will live while staying cautious. Janet sees nothing new.

### Operational Memory Layer (Phase 3C — export only)

**Phase 3C (shipped):** A read-only **operational memory layer** consolidates repeated signals from upstream layers into stable recall objects with `memoryId`, `memoryType`, `status`, `firstSeen`/`lastSeen`, and cautious reasoning ("the system remembers…"). Memory types: `stock_memory`, `habit_memory`, `recipe_memory`, `donation_memory`, `confidence_memory`, `readiness_memory`. Exported as `operationalMemory` in AI Data Pack; analytics summary includes `operationalMemorySummary`. Memories are **derived at export time** from transaction history — not persisted across sessions. **Not SPE, not recommendations, not volunteer-facing.** Janet sees nothing new.

**Phase 3C.1 (shipped):** Polish patch — unique donation memory IDs (`donationId`), deduped evidence arrays, config-fact confidence floor for Baby Pack unconfirmed, cautious Deo optional copy on early evidence.

### Exposure Tracking (v1 — analytics only)

**Exposure Tracking v1 (shipped):** `IntersectionObserver` per-control `ui_exposure` events for high-value volunteer controls. Minimum 750ms visible dwell. Per-control events carry `details.controlId`, `visibleMs`, and `clicked`. Analytics summary includes `ignoredVisibleControls`. Admin utilities tracked only when visible inside opened **Need something else?** on home. **Janet sees nothing new.**

### Interaction Episodes (Phase 3D — export only)

**Phase 3D (shipped):** A read-only **behavioural episode layer** groups tracked-control analytics into coherent `interaction_episode_complete` events. Active episodes keyed by `screen` + `controlId` accumulate visibility, hovers, clicks, focus, blur, and changes. Related raw events auto-carry `interactionEpisodeId`. Episode ends on click, blur, navigation, hidden, timeout, cancel, or **export flush** before Analytics JSON / AI Data Pack export. Analytics summary includes `interactionEpisodeSummary`. **Future AI should consume episodes rather than raw analytics events.** Not SPE, not recommendations, not volunteer-facing. **Janet sees nothing new.**

**Phase 3D.1 (shipped):** Consolidation — removed legacy batch `ui_exposure` screen snapshots (`details.controlCount`, `details.controls[]`). Interaction Episodes are the canonical behavioural primitive. Per-control exposure only in new sessions. Deprecated `ignoredControls` summary removed.

See [`docs/PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md).

## Design Principles

See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) for the full design contract used before shipping UI changes.

## User Personas

<!-- TODO: Add user personas -->

## User Research

<!-- TODO: Add user research summary (see also USER_RESEARCH.md) -->

## Current Physical Workflow

<!-- TODO: Add current physical workflow -->

## Information Architecture

<!-- TODO: Add information architecture -->

## Screen Specifications

<!-- TODO: Add screen specifications -->

## Inventory Logic

<!-- TODO: Add inventory logic -->

## Donation Logic

<!-- TODO: Add donation logic -->

## Packing Logic

<!-- TODO: Add packing logic -->

## Delivery Logic

<!-- TODO: Add delivery logic -->

## Analytics Strategy

Local-first analytics in the browser: screen flow, form friction, errors, scroll depth, and export-only intelligence layers in the AI Data Pack. Volunteers are never shown analytics UI beyond discreet admin export behind **Need something else?**

**Exposure Tracking v1:** High-value controls carry `data-track-exposure` attributes. `IntersectionObserver` logs per-control `ui_exposure` events when a control is visible for at least 750ms, then leaves the viewport, the screen changes, or the control is clicked. Per-control events use `details.controlId`, `visibleMs`, and `clicked`. Export summary `ignoredVisibleControls` surfaces controls that were seen but not clicked. Admin utilities tracked only when visible inside opened **Need something else?**

**Interaction Episodes (Phase 3D / 3D.1):** Canonical behavioural layer. Analytics Events → Interaction Episodes → future Behaviour Objects → AI. Stateful episodes per tracked control produce `interaction_episode_complete` export events; raw events on tracked controls carry `interactionEpisodeId`. Phase 3D.1 removed legacy batch exposure snapshots — new sessions emit per-control exposure only.

**Tester separation:** Milan packer sessions tagged `isTesterSession`; raw events retained; production-default summaries for volunteer usability analysis.

See [`docs/PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md) and [`docs/AI_CONTEXT.md`](AI_CONTEXT.md).

## AI Roadmap

### Storeroom Prioritisation Engine (SPE)

The **Storeroom Prioritisation Engine** is a future **multi-objective recommendation layer**. Its job is to suggest what action may be most useful next for a volunteer or administrator — not to optimise inventory, and not to replace human judgment in the storeroom.

**What SPE is**

- A decision-support layer that evaluates competing objectives simultaneously and recommends a single best next action when appropriate
- Inspired by large-scale recommender architecture: **candidate generation → multi-objective evaluation → Pareto filtering → context policy selection → guardrails**
- A companion to the four verbs, not a replacement for them

**What SPE is not**

- An inventory optimiser or stock dashboard
- A weighted score shown to volunteers
- A wizard that forces one path through the app

**Product constraints (non-negotiable)**

- **Must not replace the four core verbs** — We packed packs / A donation arrived / I counted something again / We delivered packs remain the spine of daily use
- **Must never become a dashboard for Janet** — no charts, tables, LOW flags, or inventory jargon on the volunteer surface
- **Optimise for confidence before throughput** — see Design Principles and the future Confidence Meter

**Surfaces**

| Audience | Experience |
|----------|------------|
| **Janet / Judy** | Begin **invisible**. Eventually: at most **one calm whisper** (dismissible, never blocking). Example tone: *"Good morning for Mom Packs — you have everything you need."* Silence is a valid output when uncertain. |
| **Milan / Admin** | Full **recommendation slate** — Pareto non-dominated actions, objective profiles, and rationale. Consumed via export / Mission Control, not on Janet's entry screen. |

**Objectives SPE evaluates** (independently, not as one weighted score)

- Confidence improvement
- Packing impact (mothers and clinics served)
- Stock-out risk (ops-facing; guardrails only for volunteers)
- Volunteer effort required
- Seasonal relevance
- Recipe importance
- Historical correction rate
- Donation uncertainty
- Matching quality ("we always have everything matching")

**Phased rollout**

| Phase | Scope |
|-------|-------|
| **Phase 1** | Engine runs invisibly; recommendations appear in AI Data Pack / ops export only. No Janet UI. |
| **Phase 2** | Confidence Meter + optional single whisper after field validation; outcome telemetry. |
| **Phase 3** | Cross-install learning; richer ops briefs (donor asks, clinic-aware priorities). Janet surface stays one whisper maximum. |

**Status:** Documented roadmap only — **not implemented**. See [`docs/PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md).

### SPE-Ω (theoretical north star)

**SPE-Ω** is the theoretical maximum intelligence architecture for the Zoe Project — a north star for long-term design, **not a build target for Phase 1**.

Where SPE uses multi-objective ranking with context policies, SPE-Ω reframes the storeroom as a **partially observed system**:

- Shelf quantities are **beliefs** (distributions with uncertainty), not assumed truth
- Actions are **interventions** on a causal model of donations → packing → delivery → mission impact
- Recommendations come from **counterfactual planning** over expected futures, with **distributionally robust** selection when data is sparse
- A **constitutional layer** enforces Janet invariants above all optimisation: one whisper max, four verbs sacred, silence when confidence is low

The same **presentation firewall** applies: Janet sees companion language; Milan sees Pareto slates, uncertainty, and causal rationale.

SPE-Ω is explicitly **deferred** beyond SPE Phase 1–3. It requires belief-state instrumentation, recommendation outcome logging, and enough real volunteer sessions to avoid optimising on seed or developer test data.

## Future Vision

### Phase 1 (current)

Running-stock model on one shared laptop:

**opening stock + donations − packed recipe items − deliveries ± corrections**

UX improvements (common extras on main pack screen, calm language, hidden admin) align with storeroom-memory direction without changing this math.

### Phase 2 and beyond

Richer **storeroom memory**: smarter defaults, seasonal awareness, confidence signals — while keeping the volunteer experience calm and verb-first.

The app should increasingly feel like a **companion that follows Janet’s physical workflow**, not a system volunteers must learn.

## Rejected Ideas

<!-- TODO: Add rejected ideas -->

## Technical Architecture

<!-- TODO: Add technical architecture -->

## Glossary

<!-- TODO: Add glossary terms and definitions -->
