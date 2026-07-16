# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`

**Vision:** Decouple the board runtime from the demo shell so FlapEmu can be imported as a library and configured from JSON (`columns`, `presets`, `rows`, `ui`, etc.). The page shell should own chrome, routing, and fetch, while the board runtime remains reusable by other consumers.

## Current status

The branch has made meaningful progress toward a JSON-driven, component-style board runtime:

- The board can be mounted from a config object via `mountBoard(...)`.
- A generic data pipeline now prepares board config from raw JSON.
- Basic normalization and display-row selection logic are covered by tests.
- The demo shell in `main.js` and `board.html` now acts as a thin consumer of the board runtime.

## What is implemented

- JSON-driven board configuration with `columns`, `presets`, `rows`, and `ui`.
- Generic board-pipeline helpers for row filtering, sorting, and display selection.
- Initial test coverage for config normalization and core board behavior.

## Remaining gaps and issues

1. Library packaging is now available as a first slice.
   - `package.json` defines the package entrypoint and `flapemu/style.css` export.
   - `js/index.js` exposes `mountBoard`, `normalizeBoardConfig`, and the schema version.
   - The runtime normalizes incomplete top-level config before mounting.

2. Shell/runtime separation is only partially complete.
   - `main.js` now consumes the public package entrypoint; fetch, URL routing, status display, and auto-refresh remain shell-owned.
   - The demo HTML still contains product chrome and needs a more explicit host/runtime integration boundary.

3. The config contract needs stronger definition.
   - `normalizeBoardConfig` is currently a compatibility layer rather than a full schema contract.
   - Column kinds, preset structure, UI settings, and validation rules should be documented more explicitly.

4. Runtime hardening is still needed.
   - Consumer-facing examples and clearer error handling will be needed before the library story is considered complete.

## Recommended next steps

- Extract a documented host integration example so consumers can provide their own HTML, routing, and data loading without copying demo-shell code.
- Formalize the board config schema and validation rules.
- Expand the public API tests to cover real consumer usage and error cases.

## Definition of done

The roadmap can be considered implemented when:

- The runtime can be imported and mounted by a consumer outside this repository.
- The board can be embedded into an arbitrary host page with its own chrome and data source.
- The JSON config schema is documented and validated clearly.
- The demo remains functional while the library use case is also fully supported.
