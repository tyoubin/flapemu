# FlapEmu: Split-flap Display Emulator

https://github.com/user-attachments/assets/5fab661f-0162-4178-aec9-b20f25982a26

Demo: [https://tyoubin.github.io/flapemu/](https://tyoubin.github.io/flapemu/)

## Overview

FlapEmu is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules.

FlapEmuは、駅や空港に設置されている反転フラップ式案内表示機（ソラリーボード）を模したエミュレーターです。定義済みデータソースから時刻表情報を動的に取得し、特徴的なフラップの回転動作を視覚的にシミュレートして描画します。

## File Structure

```text
/
├── index.html          # Portal page (Station selector)
├── board.html          # The main simulator view (The Board)
├── editor.html         # Timetable Editor interface
├── main.js             # Entry point (Fetch loop, Layout)
├── js/                 # ES Modules
│   ├── config.js       # Configuration & Constants
│   ├── utils.js        # Helper functions
│   ├── data-logic.js   # Physical list logic
│   ├── FlapUnit.js     # Flap animation classes
│   └── TrainGroup.js   # Row management class
├── style.css           # Global styles
├── editor.css          # Editor-specific styles
├── editor.js           # Editor logic (CRUD, Import/Export)
├── timetable/          # JSON Data directory
└── README.md           # User facing documentation
```

## Features

*   **Realistic Flap Animation:** Smooth and authentic visual transitions for character and word changes.
*   **Configurable Timetables:** Easily switch between different schedules by modifying URL parameters or JSON data files.
*   **Dynamic Data Loading:** Automatically fetches/updates schedule and preset data.
*   **Timetable Editor:** Allows you to create and edit JSON timetable files with ease.

## Configuration

FlapEmu loads its timetable data from JSON data located in the `timetable/` directory.

### Switching Timetables

You can switch between different timetable files by appending a query parameter `t` to the URL. For example:

*   To load `timetable/demo.json` (default):
    `board.html`
*   To load `timetable/kumamoto.json`:
    `board.html?t=kumamoto`
*   To load `timetable/shinagawa.json`:
    `board.html?t=shinagawa`
*   To load `timetable/tohoku.json`:
    `board.html?t=tohoku`

### Configuring Row Count

You can customize the number of split-flap rows displayed on the board by adding the `rows` parameter.

*   To display 6 rows:
    `board.html?rows=6`
*   Combine with a timetable:
    `board.html?t=shinagawa&rows=10`

### Filtering by Track Number

You can filter the displayed trains to show only specific track numbers by using the `track` URL parameter. Multiple track numbers can be specified as a comma-separated list.

*   To show trains only for track 23:
    `board.html?track=23`
*   To show trains for tracks 23 and 24:
    `board.html?track=23,24`
*   Combine with other parameters:
    `board.html?t=shinagawa&rows=5&track=14,15`

### Display Modes

FlapEmu supports different display modes which can hide or show certain columns to optimize for various contexts (e.g., main concourse, gate area, platform). You can set the display mode using the `mode` URL parameter.

*   **`?mode=concourse` (Default):** Optimized for main hall displays. In this mode, the "Train Stops" column (displaying intermediate stops for a train) is hidden to provide a cleaner, high-level overview.
*   **`?mode=gate`:** Designed for ticket gate deployments. This mode hides the top navigation bar and the "Train Stops" column for a compact, focused display.
*   `?mode=platform`: (Future)

### Data Structure

The JSON timetable files follow a specific structure containing station metadata, presets, and a schedule. While you can edit these files manually, it is recommended to use the **Timetable Editor** for a more convenient experience.

```json
{
  "meta": {
    "header": {
      "logo_url": "timetable/jt_orange.svg",
      "line_name": { "local": "東海道新幹線", "en": "Tokaido Shinkansen" },
      "for": { "local": "新大阪・博多方面", "en": "for Shin-Osaka & Hakata" }
    }
  },
  "presets": {
    "types": [{ "local": "のぞみ", "en": "NOZOMI", "color": "#f39c12" }],
    "dests": [{ "local": "東京", "en": "TOKYO" },...],
    "remarks": [{ "local": "全車指定席", "en": "All Reserved" },...],
    "stops": [{ "local": "各駅停車", "en": "Stops at All Stations" },...]
  },
  "schedule": [
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
    },
  ]
}
```
*   **Key Note:** `color` applies to the card background. `textColor` applies to the font (default white).

## Timetable Editor

The editor (`editor.html`) provides a visual interface for creating/editing JSON timetables:

*   **Features**: Meta editing, preset management (types/dests/remarks/stops), schedule table with inline editing, color pickers, JSON import/export.
*   **Autosave**: Drafts saved to `localStorage` automatically.
*   **Preview**: Opens `board.html?preview=1` which reads data from `sessionStorage`.
*   **Export**: Downloads a `.json` file ready to place in `timetable/` directory.

## Development

Using `file:///` to open the files will not work because CORS policy. Use the provided Python development server which strictly disables browser caching via HTTP headers.

*   **Run Server**: `python3 serve.py`
*   **Port**: `8086`
*   **URL**: `http://localhost:8086/board.html?t=shinagawa`
*   **Mechanism**: Sends `Cache-Control: no-cache, no-store, must-revalidate` headers for all files.
*   `?preview=1`: **Preview Mode** - Loads timetable data from `sessionStorage` instead of fetching JSON. Used by the Timetable Editor's "Preview Board" feature.

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
