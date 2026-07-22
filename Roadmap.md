# FlapEmu Roadmap

**Branch:** `roadmap/library-decoupling`

**Vision:** Decouple the board runtime from the demo shell so FlapEmu can be imported as a library and configured from JSON (`columns`, `presets`, `rows`, `ui`, etc.). The page shell should own chrome, routing, and fetch, while the board runtime remains reusable by other consumers.

## Current status

The branch has achieved the core library-decoupling goals:

- The board can be mounted from a config object via `mountBoard(...)`.
- A generic data pipeline now prepares board config from raw JSON.
- Config normalization, validation, preset shape, and cross-field references are all tested.
- `examples/host-integration.html` demonstrates a full lifecycle (mount, update, destroy, remount).
- DOM-level integration tests cover `mountBoard`, `updateBoard`, and `destroyBoard`.

## What is implemented

- JSON-driven board configuration with `columns`, `presets`, `rows`, and `ui`.
- Generic board-pipeline helpers for row filtering, sorting, and display selection.
- Config validation: schema version, column identity/kinds, top-level collections, UI window settings, preset item shape, and cross-field references (`presetKey`, `hiddenColumns`).
- Test coverage for config normalization, validation, preset validation, and DOM-side lifecycle.
- Host integration example with interactive lifecycle buttons (refresh/destroy/remount).

## Remaining gaps and issues

1. Library packaging is available as a first slice.
   - [x] `package.json` defines the package entrypoint and `flapemu/style.css` export.
   - [x] `js/index.js` exposes `mountBoard`, `normalizeBoardConfig`, `validateBoardConfig`, and the schema version.
   - [x] The runtime normalizes incomplete top-level config before mounting.

2. Shell/runtime separation is complete for single-board scenarios.
   - [x] `main.js` consumes the public package entrypoint; fetch, URL routing, status display, and auto-refresh remain shell-owned.
   - [x] `examples/host-integration.html` demonstrates a host-owned page that does not depend on `main.js`.

3. The config contract is well-defined.
   - [x] `validateBoardConfig` checks schema version, column identity/kinds, top-level collections, supported UI window settings.
   - [x] Column kinds, core UI settings, and validation behavior are documented in `README.md`.
   - [x] Preset item shape (items must be objects in arrays) is validated.
   - [x] Cross-field references (`presetKey` targets existing preset, `hiddenColumns` references real column keys) are validated.

4. Runtime hardening is partially complete.
   - [x] Consumer-facing example with lifecycle demos in `examples/host-integration.html`.
   - [x] DOM-side integration tests for `mountBoard`/`updateBoard`/`destroyBoard`.
   - [ ] TypeScript definitions for consumer autocompletion and type safety.
   - [ ] Early error boundaries in `mountBoard` for null/invalid container elements.

## Recommended next steps

- Add TypeScript type declarations (`index.d.ts`) with interfaces for `BoardConfig`, `ColumnConfig`, `PresetItem`, `UiConfig`, and `BoardInstance`.
- Add early-guard error handling in `mountBoard` for null/invalid containers or fatal validation failures.
- Consider richer CSS customisation via `ui` (e.g. `--font-family`, `--border-radius`).
- Add a browser-level integration test using Playwright (headless) to validate full rendering in a real DOM.

## Definition of done

The roadmap can be considered implemented when:

- [x] The runtime can be imported and mounted by a consumer outside this repository.
- [x] The board can be embedded into an arbitrary host page with its own chrome and data source.
- [x] The JSON config schema is documented and validated clearly.
- [x] The demo remains functional while the library use case is also fully supported.
