# FlapEmu: Split-flap Display Emulator

<img width="1033" height="479" alt="image" src="https://github.com/user-attachments/assets/74419b16-5e89-466a-b655-5e4f4bd75761" />

Demo: [https://tyoubin.github.io/flapemu/](https://tyoubin.github.io/flapemu/)

## Overview

FlapEmu is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules.

FlapEmuは、駅や空港に設置されている反転フラップ式案内表示機（ソラリーボード）を模したエミュレーターです。定義済みデータソースから時刻表情報を動的に取得し、特徴的なフラップの回転動作を視覚的にシミュレートして描画します。

## Library Usage

```bash
npm install flapemu
```

```js
import { mountBoard } from 'flapemu';

const board = document.getElementById('board');
const config = {
  columns: [
    { key: 'time', kind: 'time', cssClass: 'col-time', header: { local: '時刻', en: 'Time' } },
    { key: 'destination', kind: 'word', cssClass: 'col-dest', presetKey: 'dests', sourceField: 'destination', header: { local: '行先', en: 'Destination' }, widthVar: '--col-dest-width' }
  ],
  presets: {
    dests: [{ local: '東京', en: 'TOKYO' }, { local: '大阪', en: 'OSAKA' }]
  },
  rows: [
    { depart_time: '09:00', destination: { local: '東京', en: 'TOKYO' } },
    { depart_time: '09:30', destination: { local: '大阪', en: 'OSAKA' } }
  ],
  ui: { mode: 'concourse', rows: 12 }
};

const instance = mountBoard(board, config);
// instance.updateBoard(presets, rows) — refresh display
// instance.destroyBoard() — teardown
```

The board renders into the given element. All visual configuration comes from the JSON — no URL params or JS-side chrome.

## File Structure

```text
/
├── index.html          # Portal page (demo selector)
├── board.html          # The main simulator view (The Board)
├── main.js             # Product shell for board.html (fetch, data, auto-refresh)
├── package.json        # npm package entry
├── js/                 # ES Modules
│   ├── flapemu.js      # Public entry point (mountBoard)
│   ├── board-pipeline.js # Generic data pipeline (domain-neutral)
│   ├── train-pipeline.js # Train-domain adapter wrapper
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

The hosted demo is a product shell (`main.js`) that demonstrates how to use the library in production. Visit `index.html` to select a board.

Only one URL parameter is used by the demo shell:
- **`?t=`** — Selects the JSON file from `timetable/`. Example: `board.html?t=demo` loads `timetable/demo.json`. Only `a-z`, `A-Z`, `0-9`, `_`, `-` are accepted.

All other display parameters (`rows`, `mode`, `track`, `cascade`, etc.) are specified inside the JSON file under `ui`.

## Data Structure

Timetable files use a v3 schema that fully defines the board:

```json
{
  "schema_version": 3,
  "meta": {
    "header": {
      "logo_url": "timetable/jt_orange.svg",
      "line_name": { "local": "東海道新幹線", "en": "Tokaido Shinkansen" },
      "for": { "local": "新大阪・博多方面", "en": "for Shin-Osaka & Hakata" }
    }
  },
  "ui": {
    "mode": "concourse",
    "rows": 12,
    "cascadeMs": 1000,
    "hiddenColumns": []
  },
  "columns": [
    { "key": "time", "kind": "time", "cssClass": "col-time", "header": { "local": "時刻", "en": "Time" } },
    { "key": "destination", "kind": "word", "cssClass": "col-dest", "presetKey": "dests", "sourceField": "destination", "header": { "local": "行先", "en": "Destination" }, "widthVar": "--col-dest-width" }
  ],
  "presets": {
    "types": [{ "local": "のぞみ", "en": "NOZOMI", "color": "#f39c12" }],
    "dests": [{ "local": "東京", "en": "TOKYO" }, { "local": "大阪", "en": "OSAKA" }],
    "remarks": [{ "local": "全車指定席", "en": "All Reserved" }]
  },
  "rows": [
    {
      "track_no": "14",
      "type": { "local": "のぞみ", "en": "NOZOMI" },
      "type_color_hex": "#f0df23",
      "type_text_color": "#000000",
      "train_no": "85",
      "depart_time": "09:47",
      "destination": { "local": "広島", "en": "Hiroshima" },
      "remarks": { "local": "自由席 1-3号車", "en": "Non-ReservedCarNo.1-3" },
      "stops_at": { "local": "新横浜・名古屋・京都・新大阪・岡山", "en": "Shin-Yokohama, Nagoya, Kyoto, Shin-Osaka, Okayama" }
    }
  ]
}
```

- `meta` is read by the product shell (demo pages) for the top bar — the board library ignores it.
- `ui` controls display parameters: mode, row count, cascade delay, hidden columns.
- `columns` defines each column's kind (`word`, `time`, `chars`), presets, and layout.
- `presets` provides the word pool for `word`-kind columns.
- `rows` is the schedule data — the board selects a time-appropriate window.

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

## Credits

*  `Shinkansen_jrc.svg`: KANAO22, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons
*  `JT_orange.svg` and `JU_orange.svg`: East Japan Railway Company, Public domain, via Wikimedia Commons
*  `JA_red.svg`: SEASONposter, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons

The distinctive shape of the Shinkansen train and other visual identifiers are the property of the respective (JR) companies. This project is developed solely for technical demonstration purposes and is not an official application or affiliated with any company.

## License
This project is licensed under the MIT License.
