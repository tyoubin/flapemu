# FlapEmu - Developer & Agent Documentation

**Context for AI Agents:**

This project is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules. It relies heavily on **Skeuomorphism** (simulating physical mechanics) and **CSS 3D Transforms**. The architecture follows the **KISS principle** (Keep It Simple, Stupid). Do not introduce frameworks (React, Vue, etc.) or build steps (Webpack, TS) unless explicitly requested.

This document is an overview of the current situation. Agent does not need to keep the information for old bugs etc, if the bug has been fixed. Git history is available for reference. Agent shall update this document when necessary.

---

## 1. Project Overview

**FlapEmu** simulates the mechanical departure boards found in train stations and airports. It uses a data-driven approach where the visual representation is decoupled from the data source.

*   **Core Goal:** Photorealistic simulation of mechanical flipping, lighting, and layout.
*   **Tech Stack:** Pure HTML5, CSS3, ES6+ JavaScript.
*   **Deployment:** Static hosting (e.g., GitHub Pages).

## 2. File Structure

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

## 3. Core Mechanics (How it works)

### 3.1. The "Physical Spool" Logic
Unlike digital displays that change content instantly, this simulator mimics a physical spool of cards.
*   **Implementation:** `createPhysicalList()` in `js/data-logic.js`.
*   **Logic:**
    1.  Loads `presets` from JSON (simulating factory-installed cards).
    2.  Scans the current `schedule` for new values (dynamic injection).
    3.  Merges them and pads with `BLANK_DATA` up to a specific `capacity`.
*   **Flipping:** The animation iterates through this array index by index (`pointer` -> `targetPointer`). It does not jump directly to the target.

### 3.2. Visual Rendering (`FlapUnit`)
Each character or word block is a `FlapUnit` class.
*   **DOM Structure:** 
    *   `.top` (Static upper half)
    *   `.bottom` (Static lower half)
    *   `.flap.front` (Animating upper half)
    *   `.flap.back` (Animating lower half)
*   **Animation:** Controlled via CSS `@keyframes` (`flip-down-front`, `flip-down-back`).
*   **Sync Logic:** JS timing is decoupled from CSS durations. It uses `animationend` event listeners on the `.flap.back` element to trigger subsequent steps in the spool sequence.
*   **Lighting:** CSS `filter: brightness()` and `contrast()` are keyed to the animation frames to simulate specular highlights as the card rotates.
*   **Glossiness:** Uses a flat card design with environmental glare (top-left light source) and an `inset` box-shadow on the unit to simulate a retracted/sunken physical mounting.

### 3.3. Auto-Layout System
The board adapts to different text lengths defined in the JSON.
*   **Logic:** `adjustColumnWidth()` (in `main.js`) scans all text in `presets` and `schedule`.
*   **Calculation:** `(VisualLength * Multiplier) + Padding`. ASCII/Latin/Half-width Katakana count as 0.6 width, CJK chars as 1.0. (Logic in `js/utils.js`)
*   **Application:** Sets CSS Variables (e.g., `--col-dest-width`) at runtime.

### 3.4. Sequential Updates
To prevent GPU bottlenecks on mobile devices:
*   **Mechanism:** `fetchData` (in `main.js`) uses `await sleep(1000)` between updating each row (`TrainGroup`).
*   **Effect:** Rows flip in a cascade (Wave effect) rather than all at once.

## 4. Data Structure (JSON Schema)

Data files are located in `timetable/*.json`. Example:

```json
{
  "meta": {
    "station_name": "Shinagawa",
    "line_name": "Tokaido Shinkansen"
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

## 5. CSS Architecture & Constraints

### 5.1. Layout Strategy
*   **Desktop:** Uses `width: max-content` on the board container to ensure columns are never squashed. Columns use `flex-shrink: 0`.
*   **Mobile:** Uses a `--scale-factor` CSS variable to fit the wide board onto small screens without breaking the physical aspect ratio of the flaps.

### 5.2. Column Alignment (Strict)
*   **Fixed Columns (Track, No, Time):** Widths are calculated via `calc((var(--char-width) + 2px) * N - 2px)` to perfectly match the physical width of N flap units.
*   **Dynamic Columns (Type, Dest, Remarks):** Controlled by CSS variables set by JS.
*   **Alignment:** The Header Row and Content Rows share the exact same CSS classes and flex properties to ensure pixel-perfect vertical alignment.

### 5.3. Typography
*   **Font Stack:** "Hiragino Kaku Gothic ProN", "Helvetica Neue", Arial. (Prioritizes Japanese fonts for better centering of colons and full-width characters).
*   **Vertical Alignment Hack:** In `.local-text` (72% height) and `.en-text` (28% height), the split is **not** 50/50. This is intentional to optically center the heavy Kanji/Hanzi characters. **Do not reset to 50/50.**

## 6. Important Caveats for Future Devs

1.  **Do not use `innerHTML` on the whole board:** When updating, we only update the *target state* of the `FlapUnit`. Rebuilding DOM kills the animation.
2.  **Performance:** `ROW_COUNT` is currently capped (e.g., 3 or 6) to maintain framerates on mobile devices during heavy flipping.
3.  **Skeuomorphism:** The `::after` pulse (simulating card thickness during flip) and the `.flap-unit::before` inset shadow (simulating the retracted bezel) are critical for the 3D photorealistic feel. Do not remove them for "cleanliness".
4.  **Language:** The HTML tag is set to `lang="en"`, but CSS font stacks prioritize CJK fonts to ensure correct glyph rendering (preventing Han Unification issues).

## 7. Development & Debugging

To ensure the latest changes are reflected (especially for AI agents and developers), use the provided Python development server which strictly disables browser caching via HTTP headers.

*   **Run Server**: `python3 serve.py`
*   **Port**: `8086`
*   **URL**: `http://localhost:8086/board.html?t=shinagawa`
*   **Mechanism**: Sends `Cache-Control: no-cache, no-store, must-revalidate` headers for all files.
*   `?preview=1`: **Preview Mode** - Loads timetable data from `sessionStorage` instead of fetching JSON. Used by the Timetable Editor's "Preview Board" feature.

## 8. Timetable Editor

The editor (`editor.html`) provides a visual interface for creating/editing JSON timetables:

*   **Features**: Meta editing, preset management (types/dests/remarks/stops), schedule table with inline editing, color pickers, JSON import/export.
*   **Autosave**: Drafts saved to `localStorage` automatically.
*   **Preview**: Opens `board.html?preview=1` which reads data from `sessionStorage`.
*   **Export**: Downloads a `.json` file ready to place in `timetable/` directory.
