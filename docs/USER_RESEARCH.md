# User Research

> Raw notes, sessions, and quotes from Janet, Judy, Claire, and field observation. **Procedure:** see [`FIELD_VALIDATION.md`](FIELD_VALIDATION.md).

---

## Janet Interviews

<!-- Copy template below for each interview -->

<!--
### YYYY-MM-DD — [topic]

**Attendees:** Janet, [observer]

**Context:**

**Notes:**

**Quotes:**

**Follow-ups:**
-->

### 2026-06-26 — Stock counting, trust in the book, insurance valuation

**Attendees:** Janet, Milan (observer) — recorded interview

**Context:** Open conversation about how Janet manages stock counts and the running book.

**Notes:**
- Janet's opening, unprompted: she does not trust the running book and feels she ought to physically re-count everything — but in practice has not done a full recount "for ages." Lives with the uncertainty ("it might be wrong, you just don't know"), while rationalising it ("it's not the end of the world").
- She counts **opportunistically** when new stock arrives ("today I did the baby grows, the vests, the leggings… because Judy brought more from her car"). This is de facto cycle counting.
- **Insurance valuation:** the stock list goes to **Claire**, who **guesstimates total value** for insurance — e.g. counts boxes of nappies, values baby grows at ~R70 each. Annual total is "a few hundred thousand." The app does not support this at all.
- Counting effort is **uneven**: girls' jerseys are slow (high volume, many variants); baby grows / vests / leggings are quick (fewer, and "right there in the drawers"). Harder items sit "in piles" in black containers.
- **Janet–Judy division of labour by preference:** Janet handles clothes (loves it), Judy can't bear clothes but loves blankets (rolls them neatly, uniform sizes in boxes). "We make such a good team."

**Quotes:** see Quotes section.

**Follow-ups:**
- Insurance valuation identified as a real unmet need; solution **deferred** by Milan on 2026-06-26 (not rejected). Design is straightforward: per-item replacement-cost value × live quantities.
- Trust-in-the-book need maps to existing belief-state / VoI / calibration engines (admin-only, gated on real recount data). Getting the app into Janet's hands lets her opportunistic counts validate the model.

### 2026-06-26 — Donation categorisation, seasonal handling, pack matching

**Attendees:** Janet, Milan (observer) — recorded interview

**Context:** How donations are sorted, categorised, and handled seasonally.

**Notes:**
- Counting and categorising are **not** pain points for Janet ("I don't mind doing it at all… I don't have a worst part"). The only thing that upsets her is **dirty** donations.
- Genuine categorisation ambiguity exists but is resolved by judgment: a knitted sleeveless item was debated as vest vs. sleeveless jersey, resolved by function (on the baby's skin/under = vest; worn over = "Mother Teresa" sleeveless jersey).
- **Gender (boy/girl/neutral) calls are subjective and friendly-contested** — Janet is "more lenient," Judy stricter ("absolutely not, that's girls"). They take pride in these judgments.
- **Over-supply:** "an extraordinary amount of stuff… we can't use all of it." Judy takes oversized items home and sorts by boy/girl, summer/winter, and age band (0–3, 3–6, 6–9 months).
- **Seasonal "extras"** (summer/winter, by gender) are a real category; base baby grows are not seasonal. Thick jerseys = winter, thin/cotton beanies = summer. Seasonal stock kept ~6 months on the top shelf; release timed by **projecting baby age → size → season fit** ("born in September only fits in December… wouldn't give it in August").
- **Matching is intentional craft:** "we always have everything matching" — jersey, beanie, booties coordinated by colour.

**Quotes:** see Quotes section.

**Follow-ups:**
- Categorisation / season / gender / matching are **craft, not problems** — do not automate. App's existing season awareness (`isOutOfSeason`, surplus nudges) already covers the software-relevant part.

---

## Judy Interviews

<!--
### YYYY-MM-DD — [topic]

**Attendees:** Judy, [observer]

**Context:**

**Notes:**

**Quotes:**

**Follow-ups:**
-->

*(No interviews logged yet.)*

---

## Claire Interviews

<!--
### YYYY-MM-DD — [topic]

**Attendees:** Claire, [observer]

**Context:**

**Notes:**
-->

*(No interviews logged yet.)*

---

## User Testing Sessions

<!--
### Session YYYY-MM-DD

| Field | Value |
|-------|--------|
| **Date** | |
| **Volunteer(s)** | Janet / Judy |
| **Observer** | |
| **App version** | git commit or “main @ date” |
| **Data** | fresh / production backup / sample (avoid sample for production conclusions) |
| **Flows run** | Pack / Donate / Deliver / Stock / Admin |

#### Rubric (from FIELD_VALIDATION.md)

| Flow | Pass | Concern | Fail | Notes |
|------|------|---------|------|-------|
| Pack (common extras) | | | | |
| Pack (subflow) | | | | |
| Donation | | | | |
| Deliver assembled | | | | |
| Deliver complete units | | | | |
| Stock recount | | | | |
| Undo | | | | |
| Find backup export | | | | |

#### Checklist signals

| Signal | Pack | Donate | Deliver | Stock | Admin |
|--------|------|--------|---------|-------|-------|
| Hesitated / asked for help | | | | | |
| Wrong screen / back button | | | | | |
| Confirm summary mismatch | | | | | |
| Validation error confusing | | | | | |
| Positive surprise / relief | | | | | |
| Language not understood | | | | | |

#### Summary

**What worked:**

**What blocked them:**

**Design review:** Janet Test yes/no · Regression Test yes/no
-->

*(No sessions logged yet.)*

---

## Observations

<!-- Dated bullets: behaviour seen in the storeroom, not feature requests -->

- 2026-06-26 — Janet counts incrementally as new stock arrives (e.g. when Judy brings more from her car), rather than doing periodic full counts. This is, in effect, cycle counting.
- 2026-06-26 — Seasonal "extras" are stored ~6 months on the top shelf; timing of release is judged by projecting a baby's age forward to when a size will fit and what season that will be.
- 2026-06-26 — Tricky categorisation is resolved by garment function (worn on-skin/under vs. over), not by label; gender classification is subjective and routinely (amicably) disagreed on.
- 2026-06-26 — Storage format affects countability: items "in piles" in black containers are harder to count than items neatly in drawers.

---

## Quotes

<!-- Verbatim, attributed: “…” — Janet, YYYY-MM-DD -->

- “I don't trust my accounting. The book. I feel I have to re-count everything physically.” — Janet, 2026-06-26
- “No, I haven't done it for ages. It might be wrong… you just don't know. It's not the end of the world.” — Janet, 2026-06-26
- “I give the stock list to Claire with the numbers and then she guesstimates. It's also for insurance… how much we've got… it comes to a lot every year… a few hundred thousand.” — Janet, 2026-06-26
- “The easiest is the baby grows, leggings, the vests… girls' jerseys, that's difficult to count. Not difficult, just takes longer because there are so many.” — Janet, 2026-06-26
- “Funny we make such a good team. Judy can't bear handling the clothes… she loves doing the blankets. I love looking at the clothes.” — Janet, 2026-06-26
- “I don't mind doing it at all. I don't have a worst part of that job — unless the stuff's dirty, then that upsets me.” — Janet, 2026-06-26
- “We always disagree on what can be a neutral gender.” — Janet, 2026-06-26
- “We've put far too much thought… we always have everything matching. The jersey and the beanie and the booties… colour-wise.” — Janet, 2026-06-26

---

## Key Insights

<!-- Synthesized after 1+ sessions; max 5 bullets until more data -->

*From two Janet interviews, 2026-06-26 (recorded conversations, not app-testing sessions):*

1. **Janet's core anxiety is trust in the running book, not the mechanics of counting.** She recounts opportunistically but not systematically, and lives with "it might be wrong, you just don't know." This is exactly what the belief-state / "count this next" (VoI) / recount-calibration engines address — currently admin-only and gated on real recount data. Getting the app into her hands lets her own counts validate the model and eventually earn a single calm reassurance for her.
2. **Insurance valuation is a real unmet need.** Claire manually guesstimates total stock value (~R few hundred thousand/yr) from quantities × unit value. The app has no value concept. Correct basis for insurance is **replacement cost** (not fair-market/resale value); SA NPO practice expects the methodology to be disclosed with the figure. Solution **deferred** 2026-06-26.
3. **Categorisation, boy/girl/neutral and season judgments, and colour-matching are craft Janet is proud of — not pain points. Do not automate them.** The only genuine upset is dirty donations.
4. **Counting effort is uneven** (girls' jerseys slow; baby grows/vests/leggings quick) and worsened by piled black-container storage. The only useful software lever here is prioritisation (which count is worth the time) — i.e. VoI — not automating the count itself.
5. **Janet and Judy divide labour by preference** (Janet = clothes, Judy = blankets + oversized seasonal sorting) and it works well. Don't disrupt this.
