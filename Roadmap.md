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

1. Library packaging is not complete yet.
   - There is no package entrypoint or package metadata that makes `import { mountBoard } from 'flapemu'` work in practice.
   - The current workspace can still run the demo app, but it is not yet a consumable library package.

2. Shell/runtime separation is only partially complete.
   - The demo shell still carries page-specific assumptions and app chrome.
   - The board runtime is closer to reusable, but it still depends on the existing demo structure for full end-to-end behavior.

3. The config contract needs stronger definition.
   - `normalizeBoardConfig` is currently a compatibility layer rather than a full schema contract.
   - Column kinds, preset structure, UI settings, and validation rules should be documented more explicitly.

4. Runtime hardening is still needed.
   - Consumer-facing examples and clearer error handling will be needed before the library story is considered complete.

## Recommended next steps

- Add package metadata and exports so the board runtime can be imported as a library.
- Separate the board runtime from the product shell more cleanly so consumers can provide their own HTML, routing, and data loading.
- Formalize the board config schema and validation rules.
- Expand the public API tests to cover real consumer usage and error cases.

## Definition of done

The roadmap can be considered implemented when:

- The runtime can be imported and mounted by a consumer outside this repository.
- The board can be embedded into an arbitrary host page with its own chrome and data source.
- The JSON config schema is documented and validated clearly.
- The demo remains functional while the library use case is also fully supported.
