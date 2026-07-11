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
| `train-pipeline.js` deleted (consumer owns domain logic) | Done |

---

## Remaining work (execute in order)

### ✅ Workstream A — Correctness (P0)

All done: `ui.refreshMs` clamping, `window.strategy`, blank-color configurability, docs match code.

### ✅ Workstream B — Bilingual keys `main` / `alt` (P1)

All done: `local`/`en` → `main`/`alt` across JS, CSS, JSON, tests, CSV, and docs.

**Note:** `ui.errorMessage` uses `{ main, description }` — overlay shape, not flap bilingual.

### ✅ Workstream C — Library cleanup (P2)

All done: generic pipeline import in `flapemu.js`, column cloning, no `scheduleData` alias, test data consistency.

### ✅ Workstream D — Polish (P3)

All done: font/char JSON config (`charFontSize`, `mainFontSize`, `altFontSize`, `charWidth`, `charHeight`); 15 new unit tests for `getColumnTarget`, `colorFields`, `buildActualWordMap`, and window strategy edge cases.

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
| 2026-07-11 | Workstream A done (refreshMs, window strategy, blank-color, docs) |
| 2026-07-11 | Workstream B done (local/en → main/alt across entire codebase) |
| 2026-07-11 | Workstream C done (library cleanup, C1–C4) |
| 2026-07-11 | Deleted `train-pipeline.js` — consumer owns domain logic before JSON creation |
| 2026-07-11 | Workstream D: font/char JSON config; unit tests for getColumnTarget, colorFields, strategies |

*(Append a line when each workstream item lands.)*

---

## Regression checklist

```bash
node tests/board-config.test.mjs && node tests/unit.test.mjs && node tests/step1-rename.test.mjs
# manual: python3 serve.py → :8086
# board.html?t=demo | hongqiao | narita | coco | __nonexistent__
```
