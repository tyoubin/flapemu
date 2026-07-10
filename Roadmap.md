# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`  
**Vision:** People import FlapEmu as a library and configure a full split-flap board from **one JSON** — metadata, column definitions, UI visibility, presets, and row data.

This document is the working plan. Keep it current as milestones land.

---

## North star

```text
import { mountBoard } from 'flapemu';

mountBoard('#board', {
  // or: await fetch('my-board.json').then(r => r.json())
  config: boardJson
});
```

One config object (or file) owns:

| Section | Responsibility |
|---------|----------------|
| `meta` | Header, logo, titles (local / en) |
| `ui` | Rows, cascade, refresh, top bar, modes |
| `columns[]` | Headers, kinds (`chars` / `time` / `word`), fields, charsets, visibility, colors |
| `presets` | Word-flap spool catalogs |
| `rows` | Actual display records |

**Principle:** Flaps know cards. Rows know columns. The app (or JSON) knows the domain.

---

## Target config shape (illustrative)

V3 is live — used by all timetable JSONs. Shows the contract:

```json
{
  "schema_version": 3,
  "meta": {
    "header": {
      "logo_url": "logo.svg",
      "title": { "local": "成田空港", "en": "Narita Airport" },
      "subtitle": { "local": "国際線出発", "en": "International Departures" }
    }
  },
  "ui": {
    "rows": 6,
    "showTopBar": true,
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
      "field": "depart_time",
      "visible": true
    },
    {
      "key": "dest",
      "header": { "local": "行先", "en": "Dest." },
      "kind": "word",
      "field": "destination",
      "preset": "dests",
      "visible": true
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
      },
      "visible": true
    }
  ],
  "presets": {
    "dests": [],
    "types": []
  },
  "rows": []
}
```

Today this is split across hard-coded schema (`js/board-schema.js`), URL params (`js/config.js`), and timetable JSON. The roadmap collapses that into one document.

---

## Layer model

```text
┌──────────────────────────────────────────────┐
│  Product shell                               │
│  main.js · editor · PWA · demos              │
│  (train-specific adapters during migration)  │
├──────────────────────────────────────────────┤
│  Board shell (generic)                       │
│  RowGroup · schema · transforms · layout     │
│  cascade · header from columns               │
├──────────────────────────────────────────────┤
│  Core (library heart)                        │
│  FlapUnit · physical spool · flap CSS        │
└──────────────────────────────────────────────┘
```

| Layer | Knows about | Must not know about |
|-------|-------------|---------------------|
| **Core** | Cards, pointers, spool capacity, flip animation | Trains, tracks, columns, JSON schema |
| **Board shell** | Columns, kinds, presets, rows, UI flags | JR field names as hard requirements |
| **Product / adapter** | Train aliases, editor CRUD, station demos | Flap DOM internals |

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

### Step 3 — Library surface

**Goal:** Third parties import FlapEmu and mount a board programmatically.

| Task | Detail |
|------|--------|
| Public API | e.g. `mountBoard(el, options)`, `updateBoard(rows)`, `destroyBoard()` |
| Package layout | `core/` + `board/` + optional CSS entry; no framework, keep ES modules |
| Docs | README section: install, minimal JSON, custom columns, presets |
| Distribution | npm and/or CDN-friendly build (decide later; keep zero-build usable if possible) |

**Done when:**

1. External consumer can depend on the package and render a board from JSON only.
2. Current hosted demo still works (product shell uses the same library).

### Step 4 — Product polish (optional / later)

- Generic or schema-aware **editor** (not train-only tables)
- Board templates gallery (station, airport, bus, scoreboard)
- Theme tokens (bezel, flap speed, fonts) in JSON
- Stronger tests around normalize, transforms, window strategies

---

Regression checklist (always):

- `board.html?t=shinagawa&mode=concourse`
- `board.html?t=kumamoto&mode=gate`
- `board.html?t=sendai&mode=platform`
- `board.html?t=shinagawa&refresh=10000&cascade=200`
- `board.html?t=shinagawa&profile=mobile`
- `node tests/board-config.test.mjs && node tests/train-pipeline.test.mjs && node tests/step1-rename.test.mjs`

---

## Non-goals (near term)

- Rebuild on a framework (React/Vue/etc.)
- Change mechanical flap feel (spool traversal, bezel, lighting) unless separately requested
- Force-breaking removal of legacy timetable JSON without a normalize path
- Full multi-domain editor before Step 2 schema is stable

---

## Status

| Milestone | Status |
|-----------|--------|
| Step 0 — Roadmap | **Complete** |
| Step 1 — Decouple & generic components | **Complete** |
| Step 2 — Single JSON config | **Complete** |
| Step 3 — Library surface | Not started |
| Step 4 — Product polish | Not started |

---

## References

- Current architecture contracts: `GEMINI.md`
- User-facing behavior: `README.md`
- Key modules today: `js/FlapUnit.js`, `js/RowGroup.js`, `js/board-schema.js`, `js/board-pipeline.js`, `js/train-pipeline.js`, `js/record-transform.js`, `js/data-normalize.js`
