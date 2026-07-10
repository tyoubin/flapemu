# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`  
**Vision:** People import FlapEmu as a library and configure a split-flap board from JSON — columns, presets, rows, and UI tuning. The page shell owns chrome, routing, and data fetch.

This document is the working plan. Keep it current as milestones land.

**Last verified:** 2026-07-09 (branch review vs `main`, tests run, sample JSONs parsed).

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

| Section | Responsibility |
|---------|----------------|
| `columns[]` | Headers, kinds (`chars` / `time` / `word`), fields, charsets, visibility, colors, layout hints |
| `presets` | Word-flap spool catalogs |
| `rows` | Actual display records |
| `ui` | Board tuning: rows, cascade, mode, hidden columns, window strategy, flap speed, gaps, error copy |

The page shell owns everything else — header, logo, top-bar, data fetching, URL routing.

**Principle:** Flaps know cards. Rows know columns. The page shell knows the domain.

**Bilingual text (planned canonical keys):** `{ main, alt }` — not yet implemented. Runtime and samples still use `{ local, en }`. See [Open work](#open-work-post-review).

---

## Target config shape (as implemented today)

```json
{
  "schema_version": 3,
  "ui": {
    "rows": 6,
    "mode": "concourse",
    "cascadeMs": 800,
    "refreshMs": 30000,
    "hiddenColumns": [],
    "window": { "strategy": "nextByTime", "timeField": "depart_time" },
    "errorMessage": {
      "main": "…",
      "description": "…"
    }
  },
  "columns": [
    {
      "key": "time",
      "header": { "local": "時刻", "en": "Time" },
      "kind": "time",
      "sourceField": "depart_time"
    },
    {
      "key": "dest",
      "header": { "local": "行先", "en": "Dest." },
      "kind": "word",
      "sourceField": "destination",
      "presetKey": "dests",
      "widthVar": "--col-dest-width"
    },
    {
      "key": "type",
      "header": { "local": "種別", "en": "Type" },
      "kind": "word",
      "sourceField": "type",
      "presetKey": "types",
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

Notes:

- Canonical bilingual keys are still **`local` / `en`** in columns, presets, and rows.
- `errorMessage` already uses **`main` / `description`** (product-shell overlay only).
- Column data path uses **`sourceField`** + **`presetKey`** (not `field` / `preset`).
- Layout is largely **inline styles** from the library (`kind`, `unitCount`, `fullWidth`, `widthVar`, `textAlign`), not hard-coded train column CSS.

---

## Layer model (current tree)

```text
┌──────────────────────────────────────────────┐
│  Product shell                               │
│  main.js · index.html · board.html chrome    │
│  owns: top-bar placeholder, fetch, ?t=,      │
│        auto-refresh, error overlay           │
├──────────────────────────────────────────────┤
│  Board shell (library)                       │
│  flapemu.js → RowGroup · record-transform    │
│  owns: .schedule-board contents only         │
├──────────────────────────────────────────────┤
│  Pipelines                                   │
│  board-pipeline.js (generic)                 │
│  train-pipeline.js (sort/filter helpers)     │
├──────────────────────────────────────────────┤
│  Core                                        │
│  FlapUnit · data-logic · flap CSS            │
└──────────────────────────────────────────────┘
```

| Layer | Owns | Must not own |
|-------|------|--------------|
| **Product shell** | Chrome, `?t=`, fetch, error UI, refresh timer | Flap DOM internals |
| **Board shell** | Header row of columns, rows, cascade, widths | Top bar, URL parsing |
| **Core** | Card flip, spool list | Domain field names |

Public package entry: `package.json` → `js/flapemu.js` (`mountBoard`).

---

## Milestone status (verified)

### Step 0 — Plan

- [x] Publish roadmap on `roadmap/library-decoupling`

### Step 1 — Decouple & generic components — **Complete (with residual naming debt)**

| Task | Status | Evidence |
|------|--------|----------|
| `TrainGroup` → `RowGroup`, neutral row APIs | ✅ | `js/RowGroup.js`, CSS `.row-group` |
| Neutral column contract in JSON | ✅ | Sample boards define own `columns[]` |
| `keepTypeColors` → `colorFields` | ✅ | `record-transform.js` + demo columns |
| Generic `record-transform` | ✅ | Kind-based path; `sourceField \|\| key` fallback |
| Split pipeline | ✅ | `board-pipeline.js` + `train-pipeline.js` |
| Soften layout CSS | ✅ | Inline layout styles; demos not tied to JR-only CSS |
| Proof multi-domain boards | ✅ | `demo`, `hongqiao`, `narita`, `coco` via same shell |

### Step 2 — Single JSON as source of truth — **Mostly complete**

| Task | Status | Notes |
|------|--------|-------|
| `schema_version: 3` + `normalizeBoardConfig` | ✅ | Thin passthrough only |
| Columns / ui / presets / rows in JSON | ✅ | Live samples |
| Window / cascade / rows from JSON | ⚠️ | `timeField` used; `strategy` not honored; see open work |
| Multi-domain samples | ✅ | Train, Chinese HSR, airport, shop order board |
| Legacy v1/v2 normalize | ❌ | **Removed.** Docs that claim legacy aliases still work are wrong |
| Visual editor v3 | ❌ | **Deleted** (intentional; not “updated”) |

### Step 3 — Board owns only the board — **Complete (demo shell is thin)**

| Task | Status | Notes |
|------|--------|-------|
| Board config without `meta` / top-bar ownership | ✅ | Shell has static chrome in `board.html` |
| URL params stripped from board path | ✅ | Only demo shell reads `?t=` |
| PWA / service worker | ✅ removed | Consumers own installability |
| Editor removed | ✅ | Manual / machine-generated JSON path |

### Step 4 — Library surface — **Usable, not polished**

| Task | Status | Notes |
|------|--------|-------|
| `mountBoard` / `updateBoard` / `destroyBoard` | ✅ | Returned from `mountBoard` |
| `package.json` zero-build entry | ✅ | `"main": "js/flapemu.js"` |
| README library section | ⚠️ | Partially stale (legacy claims, sample `meta`) |
| Clean export boundary | ⚠️ | `flapemu.js` imports `extractScheduleWords` from **train-pipeline** |

### Step 5 — Polish / remaining product work — **Not done**

See [Open work](#open-work-post-review).

---

## Demo boards (current)

| Query | File | Domain |
|-------|------|--------|
| `board.html?t=demo` | `timetable/demo.json` | Full train board |
| `board.html?t=hongqiao` | `timetable/hongqiao.json` | Shanghai Hongqiao-style |
| `board.html?t=narita` | `timetable/narita.json` | Airport departures |
| `board.html?t=coco` | `timetable/coco.json` | Order / pickup board |
| `board.html?t=__nonexistent__` | — | Error overlay |

Removed from tree (do not document as live): `shinagawa`, `kumamoto`, `sendai`, `editor.*`, `airport.html` / `airport.js`, PWA (`sw.js`, `manifest.json`, `pwa.js`).

---

## Verification report (2026-07-09)

### What was checked

1. **Diff scope vs `main`:** ~38 paths; large rewrite toward library + v3 JSON.
2. **Unit tests:**
   ```text
   node --test tests/*.mjs
   → board-config, step1-rename, train-pipeline — all pass
   ```
3. **Sample JSON parse:** `demo`, `hongqiao`, `narita`, `coco` all `schema_version: 3` and parse cleanly.
4. **Architecture spot-check:** `mountBoard`, `RowGroup`, `colorFields`, multi-demo `index.html` links.

### Verdict

The other agent **did deliver the architectural arc** of Steps 1–4: generic rows, JSON-defined columns, multi-domain demos, and a real `mountBoard` entry point. Tests that exist pass.

However, **the previous Roadmap overstated completeness**, and **docs disagree with code** in several places. Treat Steps 2–4 as “shipped shape, needs cleanup,” not “done forever.”

### Issues found (severity)

#### Bugs / incorrect behavior

1. **`ui.refreshMs` ignored by demo shell**  
   - File: `main.js` (hardcoded `30000`)  
   - JSON fields like `refreshMs` on demo/narita have no effect.

2. **`ui.window.strategy` ignored**  
   - File: `js/flapemu.js`  
   - Only `ui.window.timeField` is read; selection always uses next-by-time logic in `selectDisplayRows`. A `static` (or other) strategy cannot be configured despite appearing in JSON.

3. **Custom blank color vs hard-coded dark check**  
   - File: `js/FlapUnit.js` compares `data.color !== "#202020"`  
   - Custom `ui.blankColor` can still be treated as “has color” inconsistently with spool blanks.

#### Design / API debt

4. **Bilingual keys still `local` / `en`**  
   - User request: rename to **`main` / `alt`**.  
   - Not implemented in core, samples, or tests (only `errorMessage.main` exists).

5. **Library depends on train-named helper**  
   - `js/flapemu.js` imports `extractScheduleWords` from `train-pipeline.js`.  
   - Should use `extractFieldWords` from `board-pipeline.js` (or rename adapters).

6. **`normalizeBoardConfig` is passthrough-only**  
   - No column schema defaults, no bilingual coercion, no `schedule`→`rows` alias, no unknown-field policy.  
   - README still claims full legacy alias mapping — **false**.

7. **`mountBoard` mutates input column objects**  
   - Assigns `col.cssClass` / `col.inlineStyle` in place; surprising for library consumers.

8. **Naming leftovers**  
   - `scheduleData` aliases, `selectDisplayTrains`, `prepareTrainBoardData` still mixed into APIs used by the generic path.

#### Docs drift

9. **README** claims legacy v1/v2 normalize and still shows `meta` in the “board JSON” sample.  
10. **GEMINI.md** still references `airport.js`, outdated config surface.  
11. **Earlier Roadmap** marked editor “updated,” legacy “working,” and airport HTML demos live — none of that matches the tree now.

### Residual risk

- No browser/e2e smoke in CI; visual regression of flap animation not automated.  
- Large timetable (`demo.json` ~378 rows) + cascade still untested for performance under `node`.  
- 11 local commits not yet on `origin` at last check — push when ready so the remote matches review.

---

## Open work (post-review)

Priority order for continuing on this branch:

### P0 — Correctness / honesty

- [ ] Honor `ui.refreshMs` in `main.js` (with sensible clamp/default).
- [ ] Honor `ui.window.strategy` (`nextByTime` | `static` at minimum); document contract.
- [ ] Fix blank-color comparison to use configured blank color, not literal `#202020`.
- [ ] Fix README / GEMINI to match v3-only reality (remove false legacy claims).

### P1 — User-requested naming

- [ ] Rename bilingual text keys **`local` → `main`**, **`en` → `alt`** across:
  - Core: `FlapUnit`, `data-logic`, `config.makeBlankData`, `record-transform`, `utils.getCap`, CSS classes (`.main-text` / `.alt-text`, dual-class optional during transition)
  - Samples: all `timetable/*.json`
  - Tests + README / GEMINI / this roadmap’s examples
- [ ] Decide error overlay shape: keep `errorMessage.main` / `description`, or align to `main` / `alt` only.

### P2 — Library cleanup

- [ ] Stop importing train-pipeline from `flapemu.js`; keep train adapter optional for shells that need track filter.
- [ ] Avoid mutating caller’s `columns` array (clone or assign styles on DOM only).
- [ ] Trim `scheduleData` / `selectDisplayTrains` naming from generic paths.
- [ ] Expand unit tests: `getColumnTarget` + `colorFields`, window strategies, bilingual key behavior.

### P3 — Product polish

- [ ] Theme tokens in JSON (fonts, flap speed already partial via `flapAnimationMs`).
- [ ] Optional npm publish checklist (package files field, exports map, CSS import story).
- [ ] Optional schema-aware JSON editor later (explicitly out of scope until API stable).

---

## Regression checklist

```text
# Unit
node --test tests/*.mjs

# Manual (python3 serve.py → :8086)
board.html?t=demo
board.html?t=hongqiao
board.html?t=narita
board.html?t=coco
board.html?t=__nonexistent__
```

---

## Non-goals (near term)

- Rebuild on a framework (React/Vue/etc.)
- Change mechanical flap feel unless separately requested
- URL params as a board concern (product shell only)
- Full visual editor before bilingual keys + window/refresh contracts are stable
- Reintroducing silent legacy timetable formats without an explicit compat policy

---

## Status summary

| Milestone | Status |
|-----------|--------|
| Step 0 — Roadmap | **Complete** |
| Step 1 — Decouple & generic components | **Complete** (naming debt remains) |
| Step 2 — Single JSON config | **Mostly complete** (strategy/refresh/docs gaps) |
| Step 3 — Board owns only the board | **Complete** |
| Step 4 — Library surface | **Usable / needs cleanup** |
| Step 5 — Polish + `main`/`alt` rename | **Open** (see open work) |

---

## References

- Architecture contracts: `GEMINI.md` (partially stale — update with P0 docs pass)
- User-facing docs: `README.md` (partially stale)
- Public entry: `js/flapemu.js`
- Core: `js/FlapUnit.js`, `js/data-logic.js`, `js/RowGroup.js`
- Pipelines: `js/board-pipeline.js`, `js/train-pipeline.js`
- Normalize: `js/data-normalize.js`
- Demo shell: `main.js`, `board.html`, `index.html`
- Samples: `timetable/{demo,hongqiao,narita,coco}.json`
