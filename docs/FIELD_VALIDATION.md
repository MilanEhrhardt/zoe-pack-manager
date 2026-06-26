# Field Validation Kit

> Use this kit **before, during, and after** sessions with Janet and Judy. Observations are captured in [`USER_RESEARCH.md`](USER_RESEARCH.md). UI changes must still pass [`DESIGN_REVIEW_CHECKLIST.md`](DESIGN_REVIEW_CHECKLIST.md) before ship.

**Current priority (see `AI_CONTEXT.md`):** validate Pack Creation first, then Donation and Deliver.

---

## Before the session

- [ ] Laptop is the storeroom machine (or identical setup)
- [ ] App opened via double-click (`zoe-pack-manager.html`) — not a dev server unless agreed
- [ ] **Sample data cleared** or fresh backup — use real storeroom data only if volunteers consent
- [ ] Milan selects **Janet** or **Judy** as packer (not Milan tester) when observing production flows
- [ ] Observer does not drive the mouse unless volunteer is stuck — watch first
- [ ] Phone/voice memo ready for quotes (ask permission to note exact words)

---

## Session script (suggested order)

### A. Pack creation (~15 min) — **priority**

1. Home → **We packed packs**
2. Build **3 Mom Packs**: include deodorant and tissues via main-screen toggles (no subflow)
3. Build **1 Mom Pack** with **Something was different**: swap one optional, leave one out, or add an unlisted extra
4. Read confirm summary aloud — volunteer says if it matches what they did
5. Save → check home hero / ready count feels right
6. **Undo last action** once — volunteer says if they trust it

**Watch for:** optional toggle clarity, live stock preview, subflow Done/back, confirm language, fear of breaking something.

### B. Donation arrived (~10 min)

1. Home → **A donation arrived**
2. One donor name (real or plausible), **two line items** (one packet item with pack size if possible)
3. Confirm → save

**Watch for:** donor field, quantity validation, multi-line flow, confirm summary accuracy.

### C. Deliver packs (~10 min)

1. Home → **We delivered packs**
2. Tab A: deliver **1 assembled** Mom Pack to a clinic
3. Tab B (if time): **Send complete units** — one pre-assembled item

**Watch for:** tab discovery, destination dropdown, quantity validation.

### D. Stock count (~5 min)

1. Home → **I counted something again** (or via Need something else? → stock levels path if that is how they find it)
2. Recount one item with optional reason

**Watch for:** calm tone, no nagging, confirm before save.

### E. Admin discoverability (~3 min, optional)

1. Home → **Need something else?**
2. Volunteer tries to find **Export Backup** without help

**Watch for:** can they find it; does wording scare them.

---

## Observation checklist (per session)

Copy a block into `USER_RESEARCH.md` → **User Testing Sessions**.

| Signal | Pack | Donate | Deliver | Stock | Admin |
|--------|------|--------|---------|-------|-------|
| Hesitated / asked for help | | | | | |
| Wrong screen / back button | | | | | |
| Confirm summary mismatch | | | | | |
| Validation error confusing | | | | | |
| Positive surprise / relief | | | | | |
| Language they did not understand | | | | | |

---

## Pass / fail rubric

**Pass** = volunteer completes the task without observer intervention and says the summary matched what they meant.

**Concern** = completed with help or mild confusion; note fix in Observations.

**Fail** = blocked, wrong data saved, or volunteer refuses to continue.

| Flow | Pass | Concern | Fail | Notes |
|------|------|---------|------|-------|
| Pack (common extras) | | | | |
| Pack (subflow exception) | | | | |
| Donation | | | | |
| Deliver assembled | | | | |
| Deliver complete units | | | | |
| Stock recount | | | | |
| Undo | | | | |
| Find backup export | | | | |

**Ship gate for UI changes:** both **Janet Test** and **Regression Test** in `DESIGN_REVIEW_CHECKLIST.md` must be **yes** after any fix.

---

## After the session

1. Fill **User Testing Sessions** in `USER_RESEARCH.md` (date, attendees, flows run)
2. Add **Quotes** (verbatim, attributed)
3. Add **Observations** (behaviour, not solutions)
4. Synthesize **Key Insights** (3–5 bullets max)
5. If Baby Pack recipe is still unconfirmed, note in session record
6. Export **AI Data Pack** only if Milan needs technical follow-up — not required for every session

---

## Open questions to resolve in the field

From `AI_CONTEXT.md`:

- Baby Pack recipe confirmation with volunteers
- Optimal placement of admin/export without interrupting packing
- Dedicated validation of donation and deliver flows (not exercised in pack-only sessions)
