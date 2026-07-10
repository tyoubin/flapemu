# FlapEmu - Developer & Agent Documentation

**Audience:** maintainers and AI coding agents.
Read `README.md` first for user-facing behavior, then this file for internal contracts and guardrails.

This project is intentionally simple: pure HTML/CSS/JavaScript, no framework, no build step.
Preserve skeuomorphic quality and mechanical behavior when making changes.

---

## Core Principles

1. Keep the mechanical illusion intact (spool traversal, card thickness pulse, bezel shadow, lighting).
2. Keep architecture data-driven and centralized (schema/config/pipeline/normalize modules).
3. Do not introduce frameworks or toolchains unless explicitly requested.
4. Prefer small, local changes; preserve existing visual behavior unless requested.

---

## Architecture Map (Single Sources of Truth)

### 1. Board Schema (`js/board-schema.js`)
Defines:
* Display mode profiles (`concourse`, `gate`, `platform`):
  * `defaultRows`
  * `showTopBar`
  * `hiddenColumns`
* `COLUMN_SCHEMA` for all board columns:
  * labels
  * source fields
  * column type (`chars`, `time`, `word`)
  * `colorFields` on word columns — generic `{ background, text }` field references replace `keepTypeColors`

If a column or mode behavior changes, update this file first.

### 2. Runtime Config (`js/config.js`)
Defines:
* URL parsing/sanitization (`t`, `mode`, `rows`, `track`, `profile`)
* Runtime profile presets (`default`, `kiosk`, `mobile`, `debug`)
* Clamped runtime tuning parameters:
  * `refresh`, `cascade`, `fallback`
  * `layoutMul`, `layoutPad`
  * `capPad`, `capMin`, `capMax`

Do not hardcode timing/capacity/layout constants in feature code.

### 3. Board Data Pipeline (`js/board-pipeline.js`)
Defines generic (domain-neutral) data flow helpers:
* normalize + prepare (`prepareBoardData(raw)`)
* display window selection (`selectDisplayRows(data, n, timeField, now)`)
* field sort (`sortByField(data, field)`)
* field word extraction (`extractFieldWords(data, field)`)

No train-specific field names are hardcoded here. Domain adapters (`js/train-pipeline.js`) supply field names and compose operations.

### 3b. Train Pipeline Adapter (`js/train-pipeline.js`)
Train-domain wrapper over the generic pipeline:
* `applyTrackFilter(data, tracks)` — filters by `track_no`
* `sortScheduleByDepartTime(data)` — sorts by `depart_time`
* `selectDisplayTrains(data, n, now)` — wraps `selectDisplayRows` with `timeField='depart_time'`
* `prepareTrainBoardData(raw, filterTracks)` — normalize + filter + sort in one call

Add new adapters (e.g. airport, bus) without touching core flap code.

### 4. Record Transforms (`js/record-transform.js`)
Defines schema-driven record transforms used by `RowGroup`:
* word actuals extraction (`buildActualWordMap`)
* per-column target payload mapping (`getColumnTarget`)

Keep `RowGroup` focused on rendering/updating controls, not field mapping logic.

### 5. Data Normalization (`js/data-normalize.js`)
Defines canonical schema and compatibility behavior:
* `CURRENT_SCHEMA_VERSION = 2`
* `createEmptyTimetable()`
* `normalizeTimetable(raw)`

Board (`main.js`) relies on normalization.
If new schema fields are added, update this module first.

### 6. Physical Spool Logic (`js/data-logic.js`, `js/FlapUnit.js`)
* Word flaps must traverse physical list index-by-index (`pointer -> targetPointer`), not jump.
* `animationend` drives step chaining.
* Fallback timeout is configurable via `FLAP_ANIMATION_FALLBACK_MS`.
* Word flap target lookup uses cached local->index mapping; update map whenever list mutates.

---

## Runtime Flow

1. `main.js` reads config from `js/config.js`.
2. Header row is generated from visible columns in schema (`renderHeaderRow()`).
3. Timetable JSON is fetched (or preview data loaded), then prepared via pipeline.
4. `RowGroup` instances are created from visible schema columns.
5. Updates run sequentially with configurable cascade delay (`CASCADE_DELAY_MS`).
6. Auto-refresh runs with overlap protection and pauses when tab is hidden.

---

## Data Compatibility Contract

Canonical export format is object-based with `schema_version`.
Normalization also accepts:
* root array schedule format (legacy)
* alias fields in schedule entries:
  * `track` -> `track_no`
  * `no` -> `train_no`
  * `time` -> `depart_time`
  * `dest` / `to` -> `destination`
  * `remark` / `note` -> `remarks`
  * `stop` / `stops` -> `stops_at`
  * `train_type` / `kind` -> `type`
  * `type_color` -> `type_color_hex`
  * `type_text_color_hex` -> `type_text_color`

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
* `sw.js`: timetable JSON must remain network-only (to preserve stale-data error realism).
* `sw.js` uses scope-aware precache URLs and cache cleanup on `activate`.
* If app shell files change, bump service worker cache name and include new shell assets.

---

## Editing Rules for Future AI Agents

1. For column or mode changes:
   1. Update `js/board-schema.js`.
   2. Ensure `style.css` has compatible `col-*` layout rules.
   3. Ensure `RowGroup` and header rendering still align.
2. For timing/layout/capacity changes:
   1. Update `js/config.js`.
   2. Respect runtime profile defaults before URL overrides.
   3. Consume values from config, do not duplicate magic numbers.
3. For timetable format changes:
   1. Update `js/data-normalize.js`.
   2. Validate board-config tests still pass.
4. For schedule selection/filtering behavior, update `js/board-pipeline.js` first, or `js/train-pipeline.js` if train-specific.
5. Do not rebuild board rows each update cycle; only update flap targets and physical lists.

---

## Current Performance Notes

* `rows` is clamped to `1..30`.
* Mode defaults:
  * `concourse`: 12
  * `gate`: 4
  * `platform`: 3
* Very high `rows`, very large spool capacities, or very small refresh intervals can degrade mobile performance.
* `profile=mobile` is the safer baseline for lower-end devices.

---

## Quick Regression Checklist

1. `board.html?t=shinagawa`
2. `board.html?t=kumamoto`
3. `board.html?t=sendai`
4. `board.html?t=demo`
5. `airport.html?t=narita`
6. `board.html?t=foobar` (error overlay behavior)
7. `node tests/board-config.test.mjs && node tests/train-pipeline.test.mjs && node tests/step1-rename.test.mjs`

---

Keep this file current when architecture contracts change. If behavior changes but this file does not, future AI edits become high-risk.
