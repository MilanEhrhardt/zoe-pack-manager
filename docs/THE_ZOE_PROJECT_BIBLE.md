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

### Confidence Meter (future)

Build toward a simple **Confidence Meter** — a signal of how reliable stock feels on the shelf. Direction only; not yet implemented.

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

<!-- TODO: Add analytics strategy -->

## AI Roadmap

<!-- TODO: Add AI roadmap -->

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
