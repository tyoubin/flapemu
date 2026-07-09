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

Not frozen — evolves with Step 2. Shows the intended contract:

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
| Soften layout CSS | Prefer `col-${key}` from schema; avoid new hard-coded mode×column hide rules; dual-support existing keys | |
| Proof schema | Second in-code schema (airport or bus) renders via same `RowGroup` path | |

**Leave alone in Step 1:** `FlapUnit` / spool physics / flip CSS quality; full editor rewrite; npm publish; public URL breakage.

**Done when:**

1. Existing demos (`shinagawa`, `kumamoto`, `sendai`, modes, URL params) behave the same.
2. A non-train column schema renders without editing core flap code.
3. No train field names required inside `RowGroup` / `FlapUnit` — ✅ (`RowGroup` imports no train-specific names)

### Step 2 — Single JSON as source of truth

**Goal:** Board config (columns + ui + meta + presets + rows) loads from one document. Code path no longer hard-codes JR columns.

| Task | Detail |
|------|--------|
| Define `schema_version: 3` (or next) | Formal board config schema + validation |
| Loader | `normalizeBoardConfig(raw)` accepts v3 and maps legacy timetable v2 → v3 for demos |
| Move columns into JSON | Current `COLUMN_SCHEMA` becomes data; train demos ship as full board JSON |
| UI from config | `rows`, visibility, top bar defaults from JSON; URL params remain overrides for kiosk tuning |
| Window strategies | Config-driven: `static`, `nextByTime`, optional filter fields |
| Layout | Generate or document layout CSS from column keys / width vars |

**Done when:**

1. A single JSON file fully defines a board (no JS schema edit required).
2. Legacy timetable files still work via compatibility normalize.
3. At least two sample boards (train + one other domain) are JSON-only.

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

## Step 1 work order (implementation sequence)

Use this as the PR stack order when executing Step 1:

1. **Rename** `TrainGroup` → `RowGroup` (+ CSS dual class, update `sw.js` precache if needed).
2. **Generalize colors** in schema + `record-transform.js` (`colorFields`).
3. **Neutral pipeline API** + thin `train-pipeline` (or adapter) preserving current filter/sort/window behavior.
4. **Proof second schema** in code (airport/bus), optional demo page or query flag.
5. **Docs** — update `GEMINI.md` / README architecture map; tick Step 1 checkboxes here.

Regression checklist (always):

- `board.html?t=shinagawa&mode=concourse`
- `board.html?t=kumamoto&mode=gate`
- `board.html?t=sendai&mode=platform`
- `board.html?t=shinagawa&refresh=10000&cascade=200`
- `board.html?t=shinagawa&profile=mobile`
- `node tests/data-normalize.test.mjs`

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
| Step 1 — Decouple & generic components | **In progress** (5/7 tasks done; CSS soften + proof schema remain) |
| Step 2 — Single JSON config | Not started |
| Step 3 — Library surface | Not started |
| Step 4 — Product polish | Not started |

---

## References

- Current architecture contracts: `GEMINI.md`
- User-facing behavior: `README.md`
- Key modules today: `js/FlapUnit.js`, `js/TrainGroup.js`, `js/board-schema.js`, `js/board-pipeline.js`, `js/record-transform.js`, `js/data-normalize.js`
