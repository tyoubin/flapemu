# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`  
**Vision:** People import FlapEmu as a library and configure a split-flap board from a JSON — column definitions, presets, row data, and UI tuning. The page shell owns everything else.

This document is the working plan. Keep it current as milestones land.

---

## North star

```text
import { mountBoard } from 'flapemu';

const board = mountBoard('#board', {
  columns: boardJson.columns,
  presets: boardJson.presets,
  rows: boardJson.rows,
  ui: boardJson.ui
});
```

The board owns only the schedule board. One config object defines it:

| Section | Responsibility |
|---------|----------------|
| `columns[]` | Headers, kinds (`chars` / `time` / `word`), fields, charsets, visibility, colors |
| `presets` | Word-flap spool catalogs |
| `rows` | Actual display records |
| `ui` | Board tuning: rows, cascade, refresh, mode, window strategy |

The page shell owns everything else — header, logo, top-bar, data fetching, URL routing.

**Principle:** Flaps know cards. Rows know columns. The page shell knows the domain.

---

## Target config shape

V3 is live. After Step 3, `meta` and `showTopBar` move to the page shell:

```json
{
  "schema_version": 3,
  "ui": {
    "rows": 6,
    "mode": "concourse",
    "cascadeMs": 800,
    "refreshMs": 30000,
    "window": { "strategy": "nextByTime", "timeField": "depart_time" }
  },
  "columns": [
    {
      "key": "time",
      "header": { "local": "時刻", "en": "Time" },
      "kind": "time",
      "field": "depart_time"
    },
    {
      "key": "dest",
      "header": { "local": "行先", "en": "Dest." },
      "kind": "word",
      "field": "destination",
      "preset": "dests"
    },
    {
      "key": "type",
      "header": { "local": "種別", "en": "Type" },
      "kind": "word",
      "field": "type",
      "preset": "types",
      "colorFields": {
        "background": "type_color_hex",
        "text": "type_text_color"
      }
    }
  ],
  "presets": {
    "dests": [],
    "types": []
  },
  "rows": []
}
```

---

## Layer model

```text
┌──────────────────────────────────────────────┐
│  Product shell                               │
│  main.js · airport.js · editor · PWA · demos │
│  owns: top-bar, header, logo, data fetching, │
│        URL routing, page chrome              │
├──────────────────────────────────────────────┤
│  Board shell (generic)                       │
│  RowGroup · columns · presets · rows │
│  cascade · schedule board rendering          │
│  owns: the .schedule-board div only          │
├──────────────────────────────────────────────┤
│  Core (library heart)                        │
│  FlapUnit · physical spool · flap CSS        │
└──────────────────────────────────────────────┘
```

| Layer | Owns | Receives from above |
|-------|------|---------------------|
| **Product shell** | Chrome, routing, data fetch, editor UI | URL, user input, filesystem |
| **Board shell** | `.schedule-board` — columns, presets, rows, timing | `{ columns, presets, rows, ui }` |
| **Core** | Flap DOM, spool state, flip animation | `(element, cards, kind)` |

---

## Milestone plan

### Step 0 — Plan (this branch)

- [x] Publish roadmap on `roadmap/library-decoupling`
- [ ] Align maintainers on milestone order and “done” criteria below

### Step 1 — Decouple & generic components

**Goal:** Train board becomes *one schema*, not the architecture. A second domain (e.g. airport) can render with the same path without touching `FlapUnit`.

| Task | Detail | Status |
|------|--------|--------|
| Rename domain language | `TrainGroup` → `RowGroup`; `.train-group` → `.row-group` (keep CSS dual-class during transition); `selectDisplayTrains` → `selectDisplayRows`; board APIs use `rows` / `records` | ✅ |
| Neutral column contract | Schema stays presentation-only: `key`, `header`, `kind`, `field`, units, charset, preset, width hints | ✅ |
| Generic color mapping | Replace `keepTypeColors` with `colorFields: { background, text }` (any word column) | ✅ |
| Generic `record-transform` | Single path for chars / time / word; no key-specific branches | ✅ |
| Split pipeline | Generic: bilingual helpers, take-N window, cascade hooks. Train adapter: track filter, sort by depart time, `nextByTime` strategy | ✅ |
| Soften layout CSS | Prefer `col-${key}` from schema; avoid new hard-coded mode×column hide rules; dual-support existing keys | ✅ |
| Proof schema | Second in-code schema (airport) renders via `airport.html` using `RowGroup` + generic pipeline | ✅ |

**Leave alone in Step 1:** `FlapUnit` / spool physics / flip CSS quality; full editor rewrite; npm publish; public URL breakage.

**Done when:**

1. Existing demos (`shinagawa`, `kumamoto`, `sendai`, modes, URL params) behave the same.
2. A non-train column schema renders without editing core flap code. — ✅ (`airport.html` renders via `RowGroup`, no core changes)
3. No train field names required inside `RowGroup` / `FlapUnit` — ✅ (`RowGroup` imports no train-specific names)

### Step 2 — Single JSON as source of truth ✅

**Goal:** Board config (columns + ui + meta + presets + rows) loads from one document. Code path no longer hard-codes JR columns.

| Task | Detail | Status |
|------|--------|--------|
| Define `schema_version: 3` (or next) | Formal board config schema + `normalizeBoardConfig` loader | ✅ |
| Loader | `normalizeBoardConfig(raw)` accepts v3 and maps legacy timetable v2/v1 → v3 | ✅ |
| Move columns into JSON | `TRAIN_COLUMN_DEFAULTS` in `data-normalize.js`; train demos ship as full board JSON | ✅ |
| UI from config | `rows`, `showTopBar`, `mode` from JSON; URL params remain overrides | ✅ |
| Window strategies | Config-driven: `nextByTime`, time field, filter fields | ✅ |
| Layout CSS from column keys | Airport column classes (`col-flight`, `col-airline`, etc.) moved into `style.css` | ✅ |
| Editor updated | v3 create/import/export; uses `timetable.rows` instead of `timetable.schedule` | ✅ |
| Legacy code stripped | `normalizeTimetable`, `COLUMN_SCHEMA`, `DISPLAY_MODE_PROFILES`, `DEFAULT_DISPLAY_MODE`, `getVisibleColumns`, `getDisplayModeProfile` removed | ✅ |
| Dead files removed | `airport-schema.js`, `airport-pipeline.js`, `tests/data-normalize.test.mjs` | ✅ |

**Done when:**

1. A single JSON file fully defines a board (no JS schema edit required). — ✅
2. Legacy timetable files still work via compatibility normalize. — ✅
3. At least two sample boards (train + one other domain) are JSON-only. — ✅ (`narita.json` is airport, `demo.json`/`shinagawa.json`/etc. are train)

### Step 3 — Board owns only the board

**Goal:** The board component renders a `.schedule-board` and nothing else. `meta` and `showTopBar` move to the product shell. URL params are not parsed by the board path.

| Task | Detail | Status |
|------|--------|--------|
| Strip `meta` from board config | `normalizeBoardConfig` stops returning `meta`; page shell fetches and renders its own header | ✅ |
| Strip `showTopBar` from `ui` | The board doesn't manage visibility of elements it doesn't own | ✅ |
| Deprecate visual editor | Manual JSON editing is no longer linked from index; machine generation is the intended path | ✅ |
| Strip URL params | Only `?t=` data-source pointer remains; `mode`, `rows`, `track` removed from main.js | ✅ |
| Remove top-bar DOM from `board.html` | Page shell adds its own header if desired; board.html becomes a minimal container | ✅ |
| Clean `style.css` of page-chrome rules | Keep only `.schedule-board` and column layout rules; move top-bar/header styles to product shell | ✅ |
| Update all timetable JSONs | `showTopBar` removed; `meta` is product-shell data, not board config | ✅ |

**Done when:**

1. `normalizeBoardConfig` returns only `{ schema_version, columns, presets, rows, ui }` — no `meta` or `showTopBar`. — ✅
2. No board JS file reads `window.location.search`. — ✅ (only `pwa.js` reads it, which is product shell)
3. The product shell (`main.js`, `airport.js`) owns all header, logo, and top-bar rendering. — ✅
4. All existing demos still render identically (chrome is provided by the page shell). — ✅

### Step 4 — Library surface

**Goal:** Third parties import the board as a module and mount it programmatically.

| Task | Detail | Status |
|------|--------|--------|
| Public API | `mountBoard(el, options)`, `updateBoard(rows)`, `destroyBoard()` | ⬜ |
| Package layout | `core/` + `board/` + optional CSS; zero-build usable | ⬜ |
| Export surface | Board shell and core only; no product-specific code | ⬜ |
| Docs | README section: install, minimal JSON, presets, custom columns | ⬜ |

**Done when:**

1. External consumer can `npm install flapemu` and render a board from `{ columns, presets, rows, ui }`.
2. Current hosted demo still works (product shell uses the same library).

### Step 5 — Product polish (optional / later)

- Board templates gallery (station, airport, bus, scoreboard)
- Theme tokens (bezel, flap speed, fonts) in JSON
- Stronger tests around transforms, window strategies
- Remove legacy `normalizeTimetable` v1/v2 upgrade paths (keep only `normalizeBoardConfig` v3)

---

Regression checklist (always):

- `board.html?t=shinagawa`
- `board.html?t=kumamoto`
- `board.html?t=sendai`
- `board.html?t=demo`
- `airport.html?t=narita`
- `node tests/board-config.test.mjs && node tests/train-pipeline.test.mjs && node tests/step1-rename.test.mjs`

---

## Non-goals (near term)

- Rebuild on a framework (React/Vue/etc.)
- Change mechanical flap feel (spool traversal, bezel, lighting) unless separately requested
- Force-breaking removal of legacy timetable JSON without a normalize path
- URL params as a board concern — they are product-shell only
- Full-featured visual editor — deprecated in favor of machine-generated JSON (see `timetable_csv.py`)

---

## Status

| Milestone | Status |
|-----------|--------|
| Step 0 — Roadmap | **Complete** |
| Step 1 — Decouple & generic components | **Complete** |
| Step 2 — Single JSON config | **Complete** |
| Step 3 — Board owns only the board | **Complete** |
| Step 4 — Library surface | Not started |
| Step 5 — Product polish | Not started |

---

## References

- Current architecture contracts: `GEMINI.md`
- User-facing behavior: `README.md`
- Key modules today: `js/FlapUnit.js`, `js/RowGroup.js`, `js/board-schema.js`, `js/board-pipeline.js`, `js/train-pipeline.js`, `js/record-transform.js`, `js/data-normalize.js`
