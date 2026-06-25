# Changelog

> Reverse chronological order (newest first). Content to be added later.

---

## [Unreleased]

### Added

- Pack Creation: **“Did you include these?”** section on main build screen with recipe optional Yes/No toggles (Mom and Baby packs)
- Pack Creation: `choice-extra` menu path for unlisted custom extras
- CSS for `.common-extras` and `.add-item-strip` on build screen
- Lead Product Engineer workflow (`.cursor/rules/lead-product-engineer.mdc`, `.cursor/rules.md`, `docs/CURSOR_RULES.md`) — three-solution proposals, approval gate, auto-commit
- Mandatory documentation maintenance protocol in `.cursor/rules.md`, `docs/CURSOR_RULES.md`, and `README.md`
- Documentation maintenance pointer in `docs/AI_CONTEXT.md`
- Lead Engineer six-phase workflow in `.cursor/rules.md`, `docs/CURSOR_RULES.md`, and `README.md` (superseded by Lead Product Engineer workflow)
- Design review checklist (`docs/DESIGN_REVIEW_CHECKLIST.md`)

### Changed

- Pack Creation: usage preview moved below optional toggles and renamed **“Stock this save will use”**
- Pack Creation: **“+ Something else happened”** subflow limited to swaps, omissions, and unlisted extras (removed `choice-optional` / duplicate toggle list)
- Pack Creation: admin footer removed from build and add-item views (export remains on home)
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
