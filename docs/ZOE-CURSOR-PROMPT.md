# Build The Zoe Project Pack Manager

You are building a single self-contained HTML file for **The Zoe Project**, a maternal/infant-care NPO in Cape Town (NPO 100-112, PBO 930052728). This prompt contains the **complete specification**. Do not reference external files, skills, or prior context. Implement exactly what is described here.

## Your deliverable

**One file:** `zoe-pack-manager.html` (or `index.html`)

- All HTML, CSS, and JavaScript inline in a single file
- Double-click to open in a browser — no install, no login, no internet, no server
- Data persists via `localStorage` (with Export/Import backup)
- Intended to live in a cloud-synced folder (OneDrive/Drive/Dropbox) on one shared storeroom laptop

When done, tell the user:
1. Mom Pack recipe is **confirmed**
2. Baby Pack recipe is a **draft** — they should confirm quantities with the volunteers (especially nappies per pack)
3. Low-stock thresholds in the config are **placeholder guesses** — easy to change in one place at the top of the file

---

## Who uses this (this dominates every choice)

Two volunteers, ~60 years old, on **one shared laptop** in the storeroom. They use WhatsApp and email and essentially nothing else.

- They are **not** afraid of the work; they **are** afraid of breaking the computer thing
- Success = they trust it and feel they **cannot damage it by mistyping**
- When in doubt: choose **harder-to-break** over more-capable
- A spreadsheet was explicitly rejected — formula cells, stray sorts, and dragged fills are silent catastrophes for these users

**Labour split (real and stable):**
- **Janet** (lead): loves handling baby clothes (gros, vests); hates blankets
- **Judy**: loves blankets (rolls them identically); hates handling clothes

Per-packer attribution is accountability, not policing. Never collapse Janet/Judy into one number.

---

## The three ideas that drive everything

### 1. PACK-FIRST (not inventory-first)

This is a **pack-assembly manager**. Inventory exists only so packs can exist.

The volunteer thinks: *"Today we built 4 Mom Packs"* — not *"I used 4 toothbrushes."*

She records **packs built**; stock movements are **derived automatically** from bill-of-materials (warehouse pattern: build Product A → deduct parts). This cuts data-entry ~80–90% versus their paper notebook.

**Dashboard hero answer** (visible within ~2 seconds of opening):

> **You can build 38 Baby Packs and 31 Mom Packs right now.**

Stock levels are secondary — shown below the fold, not as the headline.

### 2. CORE + OPTIONAL recipes (not fixed rigid lists)

A pack has two layers:

- **Locked core** — always in every pack, fixed quantity (almost always ×1), auto-decrements on every build. Only items that are genuinely always included AND real tracked stock.
- **Optional add-ins** — included per build via yes/no; decrement **only if ticked**. Varies by packer and surplus.

A rigid "decrement full recipe ×N" model is **WRONG** — it forces in absent items (negative deodorant) or omits opportunistic items (tissues when they have hundreds).

**Snack** is always included in Mom packs but is "make a plan" (sweets, lollipop) — record as included, **do NOT decrement** a snack stock item.

**Surplus nudge:** tissues and hand cream go in because of surplus — default optional ticks to YES when stock is high (mirror of low-stock alarm).

### 3. BUILD and DELIVER are separate (weeks apart)

Packs are assembled throughout the month and accumulate as a **"ready" stockpile**, then delivered in one batch on the **first Wednesday of the month**.

```
raw stock → packs assembled & waiting (ready count grows all month) → delivered in batch (destination + date)
```

- **Build** consumes stock (core always; optional if ticked) → increases **ready** count
- **Deliver** draws down **ready** count → records destination + date (impact reporting by-product)
- Delivery operates on packs built **earlier**, not what was just made

**Pre-assembled donated units** (retail nappy bags from Angel Network, Avo Packs, Lions Packs): log via Donation → deliver via **"Send Complete Units"** sub-flow on Deliver screen (decrements item stock directly, records destination — does NOT go through Build Packs or ready Mom/Baby counts).

---

## Eight non-negotiable UX constraints

1. One self-contained HTML file; no install, login, internet, or server
2. Guided actions only — balances change via Donation / Build / Deliver / Stock Count / Send Complete Units — **never** a raw editable balance grid
3. Big, legible, calm; large tap targets; few choices per screen; readable by 60-year-old eyes on a storeroom laptop
4. Impossible to break by mistyping; invalid input rejected gently, never destructively
5. Confirm before every balance change, with a **plain-language summary**
6. **Undo last action** always available
7. Low stock: word **LOW** + red (never colour alone); suppressed for out-of-season seasonal items
8. Never silently go negative; block over-building with a clear message

---

## Screens (required structure)

Home asks **"What happened today?"** Keep it this simple — extra screens are a regression.

### 1. Dashboard / Home (read-only stats + action buttons)

**Top — hero line:**
`You can build [N] Baby Packs and [N] Mom Packs right now.`
Computed from locked cores and current stock (bottleneck item drives each number).

**Below hero:**
- **Packs ready:** Mom [N] · Baby [N] (accumulated monthly pile)
- **Low stock:** items below threshold — show item name + **LOW** in red; skip out-of-season seasonal items
- **Use-it-up nudges** (optional, subtle): e.g. "You have lots of Tissues — consider including in packs"

**Action buttons (large):**
- **Donation Arrived**
- **We Packed Packs**
- **Stock Count**
- **Deliver Packs** (prominent when ready > 0; always reachable via small link if zero)

**Footer (small):** Export Backup · Import · current month name (e.g. JUNE 2026)

### 2. Donation Arrived

- Donor name (free text, optional) — e.g. `"Huggies / Dianna"`, `"Angel Network Western Cape"`, `"Zaida"`
- Add one or more items with quantities
- One donor event can contain many items across categories — keep flow simple and quick
- For **packet items** (Pads): ask pack count AND pack size at entry (sizes vary: 8, 10, 12, 32)
- Optional free-text note per line (e.g. "mixed donation")
- Confirm summary → increments balances → records dated donor-attributed event
- **Do not** over-engineer category splitting or smart suggestions — counting/sorting is NOT a pain point for them

### 3. We Packed Packs

1. Choose pack type: **Mom Pack** or **Baby Pack**
2. Enter quantity built
3. Choose packer: **Janet** or **Judy**
4. Choose destination (clinic dropdown)
5. Show locked core preview: e.g. `"12 × Pads, 12 × Face Cloths, 12 × Soap, 12 × Toothbrush, 12 × Toothpaste"`
6. **"Did you include these extras?"** — yes/no toggles for optional add-ins
   - Surplus-driven (Tissues, Hand Cream): default YES when stock > 2× threshold
   - Snack: default YES, records included, **no stock decrement**
7. Confirm plain-language summary
8. On save: decrement consumed items, increase ready count for pack type
9. If any item would go negative: **block** with clear message listing what's short

**Baby Pack:** show banner: *"Baby Pack recipe is a draft — please confirm with the volunteers what goes in each pack."*

### 4. Deliver Packs

**Tab A — Assembled packs (ready pile):**
- Pack type, quantity, destination, date (default today)
- Draws down ready count
- Records delivery event for impact reporting

**Tab B — Complete donated units** (pre-assembled, not storeroom-built):
- Item picker limited to: Nappy Bags, Avo Packs, Lions Packs
- Quantity, destination, date
- Decrements item stock directly
- Records delivery event (no ready pack change)

Impact data is a quiet by-product for leadership — not extra steps for volunteers.

### 5. Stock Count

- Occasional, low-pressure, **one item at a time**
- Pick item (fast-path shortcuts at top: Baby Gro, Vest, Leggings — the easy drawer items)
- Enter physical count
- Optional reason (e.g. "counting correction")
- Re-anchors that one item's balance; records adjustment event
- **Never** corrupts or rewrites prior donation/build/delivery history
- **Do not** nag for monthly full reconciliation

### 6. Undo

- Reverts the **last** balance-changing action completely (stock, ready packs, event log)
- One level only is fine for v1

---

## Data model

### Config (editable — ONE block at top of JS)

```javascript
const PACKERS = ["Janet", "Judy"];

const CLINICS = ["Retreat", "Mowbray", "Gugulethu", "Mitchell's Plain", "Zimbabwe"];

// Each item: { id, name, category, unit: "each"|"packet", packSize?, threshold, seasonal?, season?, gender?, value? }
// seasonal items: suppress low-stock alarms when out of season
// value: reserved for v2 insurance — no UI in v1

const ITEMS = [ /* see full seed list below */ ];

const RECIPES = {
  momPack: {
    confirmed: true,
    core: [
      { itemId: "pads", qty: 1 },
      { itemId: "face-cloths", qty: 1 },
      { itemId: "soap-moms", qty: 1 },
      { itemId: "toothbrush", qty: 1 },
      { itemId: "toothpaste", qty: 1 }
    ],
    optional: [
      { itemId: "snacks", decrement: false, label: "Snack (make a plan — not tracked)" },
      { itemId: "deo", decrement: true },
      { itemId: "panties", decrement: true },
      { itemId: "breast-pads", decrement: true },
      { itemId: "tissues", decrement: true, surplusDriven: true },
      { itemId: "hand-cream", decrement: true, surplusDriven: true, defaultOff: true }
    ]
  },
  babyPack: {
    confirmed: false, // DRAFT — show confirmation banner
    core: [
      { itemId: "baby-gro", qty: 1 },
      { itemId: "vest", qty: 1 },
      { itemId: "nappies", qty: 5 }, // DRAFT — book suggests 4-8; confirm with user
      { itemId: "baby-soap", qty: 1 },
      { itemId: "face-cloth-baby", qty: 1 }
    ],
    optional: [
      { itemId: "receiving", decrement: true },
      { itemId: "wet-wipes", decrement: true },
      { itemId: "knitted-blanket", decrement: true },
      { itemId: "cotton-hat", decrement: true },
      { itemId: "socks", decrement: true },
      { itemId: "matching-knit-set", decrement: false, label: "Matching knit set (colour — assistive only)" }
    ]
  }
};

// Pre-assembled units deliverable without build step
const COMPLETE_UNIT_ITEMS = ["nappy-bags", "avo-packs", "lions-packs"];
```

### Runtime state (localStorage key e.g. `zoePackManager_v1`)

```javascript
{
  balances: { [itemId]: number },      // running balance per item
  readyPacks: { momPack: number, babyPack: number },
  transactions: [                      // append-only audit log
    { id, type, date, ...payload }
  ],
  lastUndo: { ... } | null              // snapshot for undo
}
```

### Transaction types

| Type | Effect |
|------|--------|
| `donation` | +balances; optional donor; lines[{itemId, qty, packSize?}] |
| `build` | −core −ticked optional; +readyPacks; packer, destination, optionalIncluded[] |
| `deliver` | −readyPacks OR −complete unit item stock; destination, date |
| `recount` | re-anchor one item; oldQty, newQty, reason? |
| `undo` | reverses previous transaction |

**Rules:**
- Running balance is continuous — no monthly reset
- Blank field ≠ zero; never treat a packet as 1 unit
- Categories are permissive — record user's choice, never validate or auto-correct
- Recount re-anchors one item without deleting prior events
- Recipes describe **future** packs only — never rewrite history

### Pack-buildable count algorithm

For each pack type, `buildable = min(floor(stock[item] / recipeQty))` across all **core** items. Show this number on dashboard.

---

## Full seed item list

Thresholds are **placeholder guesses** — editable in config. Use volunteers' vocabulary for display names.

### Baby Clothes (`each`)

| Name | Threshold | Notes |
|------|-----------|-------|
| Baby Gro | 15 | fast stock-count |
| Vest | 20 | fast stock-count |
| Socks | 15 | |
| Cotton Hat | 10 | |
| Leggings | 15 | fast stock-count |
| Fleece Gro | 15 | |
| Shorts | 10 | |
| T-Shirts | 10 | |
| Dress | 8 | |
| Skirt | 8 | |
| Preemie | 8 | |
| Bits 'n Bobs | 5 | |
| Jerseys | 20 | hard to count — many |
| Mother Teresa | 8 | sleeveless jersey over baby gro |
| Knit Legs | 8 | |
| Knit Gro | 8 | |
| Xmas | 5 | |
| 0–3 Extra | 15 | |
| 3–6 Extra | 15 | |
| 6–9 Extra | 15 | added from interview |
| Boy Summer Extra | 10 | seasonal: summer, boy |
| Girl Summer Extra | 10 | seasonal: summer, girl |
| Neutral Summer Extra | 10 | seasonal: summer, neutral |
| Boy Winter Extra | 10 | seasonal: winter, boy |
| Girl Winter Extra | 10 | seasonal: winter, girl |
| Neutral Winter Extra | 10 | seasonal: winter, neutral |
| Cotton Beanies | 10 | seasonal: summer |
| Thick Jerseys | 10 | seasonal: winter |

### Toys (`each`) — from ledger, not in original data.md

| Name | Threshold |
|------|-----------|
| Knitted | 15 |
| Plush | 10 |
| Misc. | 5 |

### Baby Products

| Name | Unit | Threshold | Notes |
|------|------|-----------|-------|
| Aqueous | each | 5 | |
| Bum | each | 5 | book says "Bum" not "Bum cream" |
| Baby Oil | each | 5 | |
| Baby Wash small | each | 5 | |
| Baby Wash large | each | 5 | |
| Baby Soap | each | 10 | |
| Powder | each | 5 | |
| Samples | each | 5 | |
| Wet Wipes | each | 8 | often arrive in packs |
| Vaseline | each | 5 | |
| Face Cloth | each | 10 | baby products category |
| Bibs | each | 10 | |
| Nappies | each | 40 | high-volume; packet entry at donation |
| Pack Bags | each | 10 | legacy book item — **do not** require separate logging when using Build Packs |

### Blankets (`each`)

Knitted (20), Fleece (10), Receiving (15), Sleep Sac (8), Quilts (5), Other (5)

### Miscellaneous (`each`)

| Name | Threshold | Notes |
|------|-----------|-------|
| Nappy Bags | 10 | complete unit; may deliver without build |
| Toiletry Bags | 10 | |
| Moms Socks | 10 | |
| Pumps | 3 | |
| Avo Packs | 5 | complete unit |
| Lions Packs | 5 | complete unit |

### Moms

| Name | Unit | Threshold | Notes |
|------|------|-----------|-------|
| Breast Pads | each | 20 | often in packs |
| Body Lotion | each | 8 | |
| Body Wash | each | 10 | |
| Cotton Wool | each | 8 | |
| Deo | each | 15 | |
| Face Cloths | each | 10 | moms category (separate from baby Face Cloth) |
| Pads | packet, packSize 12 | 20 | ask pack size at donation (8/10/12/32) |
| Panties | each | 15 | |
| Shampoo | each | 8 | |
| Snacks | each | 15 | not decremented on Mom pack build |
| Soap | each | 15 | |
| Toothbrush | each | 20 | book: T/Brush |
| Toothpaste | each | 15 | book: T/Paste |
| Tissues | each | 10 | surplus-driven |
| Tiny Lip Vaseline | each | 10 | |
| Hand Cream | each | 10 | surplus-driven; add if not in moms list — optional recipe only |

---

## Persistence

- In-memory JS state is source of truth during session
- Persist to `localStorage` inside **try/catch** — silently no-op if unavailable; never crash UI
- **Export Backup:** download JSON file
- **Import:** restore from JSON file (confirm before overwrite)
- Tell user in plain language: *"Your work saves automatically on this computer. Use Export Backup to save a copy somewhere safe."* — do not mention localStorage

---

## Visual design

**Feel:** "A clean printed form, but alive" — calm, warm, plain, trustworthy.

- **Not:** clinical, trendy, busy, default Bootstrap
- Generous whitespace, large click targets, one clear primary action per screen
- Plain-word buttons: "Donation Arrived", "We Packed Packs", "Stock Count" — no jargon
- Colour sparingly: calm neutral base (warm off-white/cream background, soft charcoal text)
- **Red reserved exclusively for LOW** stock warnings
- Soft dignified maternal feel — legibility and calm always win over decoration
- Desktop-first (shared laptop); responsive enough for tablet

Suggested palette (adjust if needed):
- Background: `#F7F4F0`
- Text: `#2C2C2C`
- Primary button: `#5B7B6A` (muted sage green)
- LOW alert: `#C0392B` with word "LOW" always visible

---

## Why this design (context for you — implement faithfully)

### Paper book failures (March ledger — 8 pages)

Their notebook is a monthly IN/OUT flow ledger with **no carry-forward column**. The real stock lives on the shelf. The tool's running balance fixes this.

- Tallies are comma-separated batches hand-summed (errors common: Baby Oil `3,1` → total `3`)
- Pads IN: `14 pkts × 12 ; 3 pkts × 32...` with **no total computed**
- OUT pages split **Janet** and **Judy** — Judy Moms shows walls of 20s (~20 identical Mom packs/batch)
- **Pack BAGS** on Baby Products OUT ≈ completed baby packs (validates pack-first)
- Destination notes only in margins: "Retreat got an Xtra 8 packs!"

### Mom's words (interview)

- *"I don't trust my accounting. The book."* but *"haven't done it for ages… not the end of the world"* → running balance + drift tolerance, no nagging
- Mixed donations: *"I don't mind doing it at all"* → keep donation simple
- *"We always have everything matching"* (colour) → assistive optional tick, not colour engine
- Easy counts: baby gros, vests, leggings in drawers; hard: jerseys

### Instagram (delivery context)

- **Retreat, Mowbray:** Mother's Day nappy bags (Angel Network) — complete units, bedside handoff
- **Retreat Maternity Unit:** teal fabric bags (assembled packs) + bulk knitted beanies
- **Zimbabwe:** mixed Mom hygiene + baby clothes/knits — use Mom/Baby templates with Zimbabwe destination
- **Dianna / Huggies:** bulk nappy donation — donor attribution example

---

## Maintenance (document in HTML comment at top of config block)

### Add/remove item
Edit `ITEMS` array. Removing: delete item and recipe references (warn in comment, don't crash).

### Change pack recipe
Edit `RECIPES` — move items between `core` and `optional`. Affects future packs only.

### Add clinic
Add name to `CLINICS` array.

### Mark seasonal / change threshold / rename packer
Per-item flags in `ITEMS`; packer rename preserves history under old name in transactions.

---

## What NOT to build (regression guards)

- Do not revert to inventory-first UI
- Do not make pack recipes rigid fixed lists
- Do not add accounts, passwords, logins, or server dependency
- Do not expose raw editable balance grid
- Do not enforce or "correct" categories
- Do not raise low-stock alarms on out-of-season seasonal items
- Do not nag for monthly full reconciliation
- Do not let balances silently go negative
- Do not treat packet as 1 or blank as zero
- Do not collapse Janet/Judy
- Do not remove Undo, confirm summaries, or Export backup
- Do not build v2 insurance valuation UI (keep optional `value` field in item model only)
- Do not build colour-matching engine for knit sets
- Do not require logging Pack Bags separately when building baby packs via Build Packs

---

## Acceptance tests (verify before finishing)

1. **Build 12 Mom Packs (Judy)** with Deo ticked → stock decrements correctly; 12 ready Mom packs; packer recorded as Judy
2. **Angel Network Western Cape** donates 12 Nappy Bags → deliver 12 to Retreat via Complete Units tab → Nappy Bags stock −12, delivery event logged, ready Mom/Baby unchanged
3. **Zaida donated 245 mixed items** — one donation event, donor "Zaida", lines across Baby Gro + Fleece Gro + Vest → all in one event, balances increment
4. **Recount Baby Gro** from 47 to 52 → balance updates; prior donation/build events intact in log
5. **Undo last entry** → reverts stock and ready packs to prior state
6. **Deliver 20 Mom packs to Mowbray** → ready Mom −20; delivery event with destination Mowbray and date
7. **Snack ticked on Mom pack build** → snack "included" recorded; Snacks stock **unchanged**
8. **Try to build 100 Mom packs with only 5 Pads** → blocked with clear message, no negative balance
9. **Boy Winter Extra at 3 in summer** → no LOW alarm (seasonal suppress)
10. **Export then Import** → data restores correctly

---

## Build procedure

1. Create single HTML file with inline CSS and JS
2. Put ALL config (PACKERS, CLINICS, ITEMS, RECIPES) in one clearly commented block at top of `<script>`
3. Implement all screens and transaction logic
4. Seed initial balances to zero (or sensible demo zeros — user will enter real stock via donations/recounts)
5. Test all acceptance scenarios
6. Add brief HTML comment at top of file explaining: double-click to open, Export for backup, edit config block for maintenance

**File name:** `zoe-pack-manager.html`

Build it now. Produce the complete working file.
