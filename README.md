# FlapEmu: Split-flap Display Emulator

<img width="1033" height="479" alt="image" src="https://github.com/user-attachments/assets/74419b16-5e89-466a-b655-5e4f4bd75761" />

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
│   ├── TrainGroup.js   # Row management class
│   └── pwa.js          # PWA & Dynamic Manifest logic
├── style.css           # Global styles
├── editor.css          # Editor-specific styles
├── editor.js           # Editor logic (CRUD, Import/Export)
├── timetable/          # JSON Data directory
├── sw.js               # Service Worker
├── manifest.json       # Web App Manifest
├── icon.png            # App Icon
└── README.md           # User facing documentation
```

## Features

*   **Realistic Flap Animation:** Smooth and authentic visual transitions for character and word changes.
*   **Configurable:** Easily customize the appearance and behavior by URL parameters.
*   **Dynamic Data Loading:** Automatically fetches/updates schedule and preset data.
*   **Timetable Editor:** Allows you to create and edit JSON timetable files with ease.
*   **PWA Support:** Installable on home screen for full-screen "kiosk" mode. Supports dynamic shortcuts that preserve specific board configurations.

## Configuration

FlapEmu loads its timetable data from JSON data located in the `timetable/` directory.

### URL Parameters

The behavior and appearance of FlapEmu can be customized using URL query parameters in `board.html`.

*   **`t` (Timetable Source):** Specifies the JSON file to load from the `timetable/` directory.
    *   Example: `board.html?t=shinagawa` (loads `timetable/shinagawa.json`)
*   **`rows` (Row Count):** Sets the number of split-flap rows to display.
    *   Example: `board.html?rows=6`
*   **`track` (Track Filter):** Filters trains to show only specific track numbers. Accepts comma-separated values.
    *   Example: `board.html?track=23` (show only track 23)
    *   Example: `board.html?track=23,24` (show tracks 23 and 24)
*   **`mode` (Display Mode):** Adjusts the display for different contexts.
    *   `concourse` (Default): Hides the "Train Stops" column.
    *   `gate`: Hides the line name, direction and "Train Stops" column.
    *   `platform`: Hides the "Track No" column.

Examples combining parameters:
*   `board.html?t=shinagawa&rows=10`
*   `board.html?t=shinagawa&rows=5&track=14,15&mode=gate`

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

## PWA & Home Screen Installation

FlapEmu supports **Progressive Web App (PWA)** features, allowing you to use it as a standalone application without the browser address bar.

*   **iOS/Safari**: Tap the **Share** button → **"Add to Home Screen"**.
*   **Android/Chrome**: Tap the **Menu (⋮)** → **"Install App"**.

### Dynamic Board Shortcuts
Unlike basic PWAs, FlapEmu uses a **Dynamic Manifest Strategy**. This means if you are viewing a specific board (e.g., `board.html?t=kumamoto&rows=3`), choosing "Add to Home Screen" will create a shortcut for **that specific station and configuration**. You can have multiple boards pinned to your home screen simultaneously.

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
