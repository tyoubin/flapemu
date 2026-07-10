# FlapEmu - Developer & Agent Documentation

**Audience:** maintainers and AI coding agents.
Read `README.md` first for user-facing behavior, then this file for internal contracts and guardrails.

This project is intentionally simple: pure HTML/CSS/JavaScript, no framework, no build step.
Preserve skeuomorphic quality and mechanical behavior when making changes.

---

## Core Principles

1. Keep the mechanical illusion intact (spool traversal, card thickness pulse, bezel shadow, lighting).
2. Keep architecture data-driven and centralized (normalize/pipeline/library modules).
3. Do not introduce frameworks or toolchains unless explicitly requested.
4. Prefer small, local changes; preserve existing visual behavior unless requested.

---

## Architecture Map (Layered)

### Module Dependency Order
```
config.js (constants) → data-normalize.js → board-pipeline.js → train-pipeline.js → flapemu.js (public entry)
                                                                       RowGroup.js → FlapUnit.js
                                                                    record-transform.js
                                                                         data-logic.js
                                                                    utils.js
```

### 1. Public Entry (`js/flapemu.js`)
Single export: `mountBoard(el, config)`. The board library entry point.
- Accepts a normalized v3 config object `{ columns, presets, rows, ui }`
- Creates DOM (header row, rows container) inside `el`
- Calculates dynamic column widths
- Instantiates `RowGroup` instances
- Runs cascade animation on initial display
- Returns `{ updateBoard(presets, rows), destroyBoard() }`

The library owns zero chrome — no top bar, no meta, no URL parsing.

### 2. Product Shells (`main.js`, `airport.js`)
Thin consumers of the library:
- Fetch JSON from a URL or hardcoded path
- Normalize via pipeline (`prepareTrainBoardData` or `prepareBoardData`)
- Call `mountBoard()` on first load, `instance.updateBoard()` on refresh
- Render top-bar from `json.meta.header` (product shell concern)
- Handle auto-refresh, visibility, error overlays

Only `?t=` is parsed by the demo shell for JSON selection. All other display parameters come from JSON `ui`.

### 3. Domain Pipeline (`js/board-pipeline.js`)
Generic (domain-neutral) data flow helpers:
- `prepareBoardData(raw)` — normalize + return `{ presets, rows, columns, ui }`
- `selectDisplayRows(data, n, timeField, now)` — time-window selection
- `sortByField(data, field)` — field sort
- `extractFieldWords(data, field)` — word extraction

No train/airport-specific field names hardcoded here.

### 4. Train Pipeline Adapter (`js/train-pipeline.js`)
Train-domain wrapper:
- `applyTrackFilter(data, tracks)` — filter by `track_no`
- `sortScheduleByDepartTime(data)` — sort by `depart_time`
- `selectDisplayTrains(data, n, now)` — wraps `selectDisplayRows` with `timeField='depart_time'`
- `prepareTrainBoardData(raw, filterTracks)` — normalize + filter + sort in one call

### 5. Data Normalization (`js/data-normalize.js`)
Canonical schema and backward compatibility:
- `BOARD_CONFIG_VERSION = 3`
- `normalizeBoardConfig(raw)` — accepts v1/v2/v3, outputs v3
- `createEmptyBoardConfig()` — returns minimal v3 config
- `TRAIN_COLUMN_DEFAULTS` — default columns for v2 upgrade path

### 6. Record Transforms (`js/record-transform.js`)
Schema-driven transforms used by `RowGroup`:
- `buildActualWordMap(columns, rows)` — word actuals extraction
- `getColumnTarget(column, record)` — per-column target payload mapping

### 7. Physical Spool Logic (`js/data-logic.js`, `js/FlapUnit.js`)
- Word flaps traverse physical list index-by-index (`pointer → targetPointer`), not jump.
- `animationend` drives step chaining.
- Fallback timeout is configurable via `FLAP_ANIMATION_FALLBACK_MS`.
- Word flap target lookup uses cached local→index mapping; update map whenever list mutates.

### 8. Runtime Config (`js/config.js`)
Hardcoded constants only — no URL parsing, no runtime profiles:
- `BLANK_DATA`, `FLAP_ANIMATION_FALLBACK_MS`, `LAYOUT_WIDTH_MULTIPLIER`, `LAYOUT_WIDTH_PADDING`, `WORD_CAPACITY_CONFIG`

---

## Runtime Flow

1. Product shell (`main.js`) reads `?t=` to select JSON source, fetches it.
2. Pipeline normalizes JSON → `{ presets, rows, columns, ui }`.
3. First call: `mountBoard(el, config)` → creates DOM, RowGroups, cascades display.
4. Subsequent calls (auto-refresh): `instance.updateBoard(presets, rows)` → updates physical lists, re-selects display window, cascades.
5. Auto-refresh runs with overlap protection and pauses when tab is hidden.

---

## Data Compatibility Contract

Canonical format is v3 object with `schema_version: 3`.
Normalization also accepts:
- Array root (legacy schedule-only format)
- `schedule` as alias for `rows`
- Alias fields in rows:
  - `track` → `track_no`
  - `no` → `train_no`
  - `time` → `depart_time`
  - `dest` / `to` → `destination`
  - `remark` / `note` → `remarks`
  - `stop` / `stops` → `stops_at`
  - `train_type` / `kind` → `type`
  - `type_color` → `type_color_hex`
  - `type_text_color_hex` → `type_text_color`
- String bilingual fields converted to `{ local, en }`

When adding new aliases or schema versions, keep normalization backward-compatible.

---

## CSS / Visual Constraints

1. Keep `.local-text` / `.en-text` split at 72% / 28% (optical centering for CJK).
2. Preserve:
   * `.flap-unit::before` inset bezel shadow
   * thickness pulse (`.flap-unit.flipping::after`)
   * lighting keyframes for matt card reflection
3. Keep header/row class alignment strategy intact (`col-*` classes shared).
4. Mobile scaling (`--scale-factor`) exists to preserve flap proportions.

---

## PWA / Cache Constraints

* `js/pwa.js`: dynamic manifest uses current URL for installable deep-link behavior.
* `sw.js`: timetable JSON must remain network-only.
* If app shell files change, bump service worker cache name and include new shell assets.

---

## Editing Rules for Future AI Agents

1. For column or mode changes:
   1. Update `js/data-normalize.js` (defaults) and `js/train-pipeline.js` (if train-specific).
   2. Ensure `style.css` has compatible `col-*` layout rules.
   3. Ensure `RowGroup` and header rendering still align.
2. For timing/layout/capacity changes:
   1. Update `js/config.js`.
   2. Consume values from config, do not duplicate magic numbers.
3. For timetable format changes:
   1. Update `js/data-normalize.js`.
   2. Validate board-config tests still pass.
4. For schedule selection/filtering behavior, update `js/board-pipeline.js` first, or `js/train-pipeline.js` if train-specific.
5. Do not rebuild board rows each update cycle; only update flap targets and physical lists.
6. The library (`js/flapemu.js`) must stay product-shell agnostic — no chrome, no URL parsing, no meta rendering.

---

## Quick Regression Checklist

1. `board.html?t=shinagawa`
2. `board.html?t=kumamoto`
3. `board.html?t=sendai`
4. `board.html?t=demo`
5. `airport.html`
6. `board.html?t=__nonexistent__` (error overlay behavior)
7. `node tests/board-config.test.mjs && node tests/train-pipeline.test.mjs && node tests/step1-rename.test.mjs`

---

Keep this file current when architecture contracts change. If behavior changes but this file does not, future AI edits become high-risk.
