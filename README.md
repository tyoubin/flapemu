# FlapEmu: Split-flap Display Emulator

<img width="1033" height="479" alt="image" src="https://github.com/user-attachments/assets/74419b16-5e89-466a-b655-5e4f4bd75761" />

Demo: [https://tyoubin.github.io/flapemu/](https://tyoubin.github.io/flapemu/)

## Overview

FlapEmu is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules.

## Library Usage

```js
import { mountBoard } from 'flapemu';
import 'flapemu/style.css';

const board = document.getElementById('board');
const config = {
  columns: [
    { key: 'time', kind: 'time', cssClass: 'col-time', header: { main: '時刻', alt: 'Time' } },
    { key: 'destination', kind: 'word', cssClass: 'col-dest', presetKey: 'dests', sourceField: 'destination', header: { main: '行先', alt: 'Destination' }, widthVar: '--col-dest-width' }
  ],
  presets: {
    dests: [{ main: '東京', alt: 'TOKYO' }, { main: '大阪', alt: 'OSAKA' }]
  },
  rows: [
    { depart_time: '09:00', destination: { main: '東京', alt: 'TOKYO' } },
    { depart_time: '09:30', destination: { main: '大阪', alt: 'OSAKA' } }
  ],
  ui: { mode: 'concourse', rows: 12 }
};

const instance = mountBoard(board, config);
// instance.updateBoard(presets, rows) — refresh display
// instance.destroyBoard() — teardown
```

The board renders into the given element. All visual configuration comes from the JSON — no URL params or JS-side chrome.

### Package usage

The package entry point exports `mountBoard`, `normalizeBoardConfig`, and
`BOARD_CONFIG_VERSION`. The runtime normalizes missing top-level fields
(`columns`, `presets`, `rows`, and `ui`) before mounting. Import
`flapemu/style.css` in the host application to include the default board
styles.

## File Structure

```text
/
├── index.html          # Portal page (demo selector)
├── board.html          # The main simulator view (The Board)
├── main.js             # Product shell consumer (fetch, URL, auto-refresh)
├── js/                 # ES Modules
│   ├── board-pipeline.js # Generic data pipeline (domain-neutral)
│   ├── board-schema.js   # Charset helpers
│   ├── config.js       # Board constants
│   ├── data-logic.js   # Physical list logic
│   ├── data-normalize.js # Schema compatibility + normalization
│   ├── index.js        # Public package entry point
│   ├── flapemu.js      # Board runtime (mountBoard)
│   ├── FlapUnit.js     # Flap animation classes
│   ├── record-transform.js # Column target/data transforms
│   ├── RowGroup.js     # Row management class
│   ├── utils.js        # Helper functions
│   ├── config.js       # Board constants
│   ├── data-logic.js   # Physical list logic
│   ├── data-normalize.js # Schema compatibility + normalization
│   ├── FlapUnit.js     # Flap animation classes
│   ├── record-transform.js # Column target/data transforms
│   ├── RowGroup.js     # Row management class
│   ├── utils.js        # Helper functions
├── style.css           # Global styles
├── tests/              # Node-based compatibility tests
├── timetable/          # JSON Data directory
└── README.md           # User facing documentation
```

## Demo Boards

The hosted demo is a product shell (`main.js`) that demonstrates how to use the library in production. It imports the public package entry point and owns fetching, URL routing, status display, and auto-refresh. Visit `index.html` to select a board.

Only one URL parameter is used by the demo shell:
- **`?t=`** — Selects the JSON file from `timetable/`. Example: `board.html?t=demo` loads `timetable/demo.json`. Only `a-z`, `A-Z`, `0-9`, `_`, `-` are accepted.

## Features

* **Realistic Flap Animation:** Smooth and authentic visual transitions for character and word changes.
* **JSON-Driven:** A single JSON file fully defines the board — columns, presets, rows, and UI settings.
* **Dynamic Data Loading:** Automatically fetches/updates schedule data with configurable refresh interval.

## Development

Using `file:///` to open the files will not work because CORS policy. Use the provided Python development server which strictly disables browser caching via HTTP headers.

* **Run Server**: `python3 serve.py`
* **Port**: `8086`
* **URL**: `http://localhost:8086/board.html?t=demo`
* **Mechanism**: Sends `Cache-Control: no-cache, no-store, must-revalidate` headers for all files.

## Deployment & Production

When deploying this project for actual use (e.g., Kiosk Mode in a station), **caching must be disabled** to ensure the timetable is always up-to-date.

1.  **Meta Tags**: The application includes `<meta>` tags to discourage caching.
2.  **Server Configuration (Recommended)**: Configure your web server (Nginx, Apache, Netlify, etc.) to send strict cache headers (e.g., `Cache-Control: no-store, no-cache, must-revalidate`).

## License
This project is licensed under the MIT License.
