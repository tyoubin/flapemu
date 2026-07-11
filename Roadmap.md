# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`  
**Vision:** Import FlapEmu as a library; configure a board from JSON (`columns`, `presets`, `rows`, `ui`). The page shell owns chrome, routing, and fetch.

---

## Done (do not re-litigate)

| Area | Status |
|------|--------|
| `TrainGroup` → `RowGroup`; generic column kinds | Done |
| `colorFields` instead of `keepTypeColors` | Done |
| v3 JSON board config (`normalizeBoardConfig`) | Done (passthrough) |
| Board owns only `.schedule-board` (`mountBoard`) | Done |
| Multi-domain demos: `demo`, `hongqiao`, `narita`, `coco` | Done |
| Editor / PWA removed | Done (intentional) |
| `package.json` + `js/flapemu.js` entry | Done |

---

## Remaining work (execute in order)

### Workstream A — Correctness (P0)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| A1 | Honor `ui.refreshMs` in demo shell (clamp e.g. 5s–300s, default 30s) | `main.js` | Interval follows JSON |
| A2 | Honor `ui.window.strategy`: `nextByTime` \| `static` | `board-pipeline.js`, `flapemu.js`, tests | Static boards show rows[0..n) without time seek |
| A3 | Blank-color checks use configured blank, not hard-coded `#202020` | `FlapUnit.js`, `data-logic.js` | Custom `ui.blankColor` works |
| A4 | Docs match code (v3-only; no false legacy; no `airport.js` / editor) | `README.md`, `GEMINI.md` | Docs review clean |

### Workstream B — Bilingual keys `main` / `alt` (P1)

Canonical bilingual object becomes `{ main, alt }` (replacing `{ local, en }`).

| # | Task | Files | Done when |
|---|------|-------|-----------|
| B1 | Core + transforms use `main` / `alt` | `config.js`, `FlapUnit.js`, `data-logic.js`, `record-transform.js`, `utils.js`, `board-pipeline.js`, `flapemu.js` | No `.local` / `.en` in JS for text cards |
| B2 | CSS classes `.main-text` / `.alt-text` (drop or dual-support old) | `style.css` | Layout still 72/28 |
| B3 | Convert all sample JSON | `timetable/*.json` | Grep clean of bilingual `local`/`en` |
| B4 | Tests + CSV helper | `tests/*`, `timetable_csv.py` | Tests green |
| B5 | Docs examples use `main` / `alt` | `README.md`, `GEMINI.md`, this file | Consistent |

**Note:** `ui.errorMessage` already uses `{ main, description }` — keep as overlay shape (not flap bilingual).

### Workstream C — Library cleanup (P2)

| # | Task | Files | Done when |
|---|------|-------|-----------|
| C1 | `flapemu.js` imports only generic pipeline (`extractFieldWords`) | `flapemu.js` | No train-pipeline import in library entry |
| C2 | Do not mutate caller `columns` (clone layout fields) | `flapemu.js` | Input config unchanged after mount |
| C3 | Drop `scheduleData` alias from generic returns | `board-pipeline.js`, `train-pipeline.js`, tests | Single name: `rows` |
| C4 | Optional: rename train helper names in tests only as needed | tests | Clear domain boundary |

### Workstream D — Polish (P3, later)

- Theme tokens in JSON (fonts, more colors)
- Stronger tests (`getColumnTarget`, colorFields, strategies)
- npm publish checklist (`exports`, CSS story)

---

## North star API

```js
import { mountBoard } from 'flapemu';

const instance = mountBoard(el, {
  columns: [/* ... */],
  presets: { /* ... */ },
  rows: [/* ... */],
  ui: {
    rows: 6,
    cascadeMs: 800,
    refreshMs: 30000,
    window: { strategy: 'nextByTime', timeField: 'depart_time' }
  }
});
// instance.updateBoard(presets, rows)
// instance.destroyBoard()
```

Bilingual text (after Workstream B):

```json
{ "main": "東京", "alt": "TOKYO" }
```

---

## Layer model

```text
Product shell (main.js, board.html chrome)
    ↓  { columns, presets, rows, ui }
Board library (flapemu.js → RowGroup → FlapUnit)
```

---

## Progress log

| Date | Change |
|------|--------|
| 2026-07-09 | Architecture Steps 1–4 landed on branch (prior agent work) |
| 2026-07-09 | Review: documented gaps A–C; this ordered plan |

*(Append a line when each workstream item lands.)*

---

## Regression checklist

```bash
node --test tests/*.mjs
# manual: python3 serve.py → :8086
# board.html?t=demo | hongqiao | narita | coco | __nonexistent__
```

---

## Non-goals

- Framework rewrite
- Changing flap mechanical feel unless requested
- Full visual editor before API keys (`main`/`alt`) and window/refresh are stable
- Silent reintroduction of v1/v2 without an explicit compat policy
