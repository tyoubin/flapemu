# FlapEmu - Developer & Agent Documentation

**Context for AI Agents:**

This project is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules. It relies heavily on **Skeuomorphism** (simulating physical mechanics) and **CSS 3D Transforms**. The architecture follows the **KISS principle** (Keep It Simple, Stupid). Do not introduce frameworks (React, Vue, etc.) or build steps (Webpack, TS) unless explicitly requested.

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
├── style.css           # Global styles (Responsive, Animations, Theming)
├── script.js           # Core logic (Fetching, Rendering, Animation loop)
├── timetable/          # JSON Data directory
│   ├── demo.json
│   ├── shinagawa.json
│   └── ...
└── README.md           # User facing documentation
```

## 3. Core Mechanics (How it works)

### 3.1. The "Physical Spool" Logic
Unlike digital displays that change content instantly, this simulator mimics a physical spool of cards.
*   **Implementation:** `createPhysicalList()` in `script.js`.
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
*   **Lighting:** CSS `filter: brightness()` and `contrast()` are keyed to the animation frames to simulate specular highlights as the card rotates.

### 3.3. Auto-Layout System
The board adapts to different text lengths defined in the JSON.
*   **Logic:** `adjustColumnWidth()` scans all text in `presets` and `schedule`.
*   **Calculation:** `(VisualLength * Multiplier) + Padding`. ASCII chars count as 0.6 width, CJK chars as 1.0.
*   **Application:** Sets CSS Variables (e.g., `--col-dest-width`) at runtime.

### 3.4. Sequential Updates
To prevent GPU bottlenecks on mobile devices:
*   **Mechanism:** `fetchData` uses `await sleep(1500)` between updating each row (`TrainGroup`).
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
*   **Mobile:** Uses a `zoom: 0.65` strategy (or similar scale) to fit the wide board onto small screens without breaking the physical aspect ratio of the flaps.

### 5.2. Column Alignment (Strict)
*   **Fixed Columns (Track, No, Time):** Widths are calculated via `calc((var(--char-width) + 2px) * N - 2px)` to perfectly match the physical width of N flap units.
*   **Dynamic Columns (Type, Dest, Remarks):** Controlled by CSS variables set by JS.
*   **Alignment:** The Header Row and Content Rows share the exact same CSS classes and flex properties to ensure pixel-perfect vertical alignment.

### 5.3. Typography
*   **Font Stack:** "Hiragino Kaku Gothic ProN", "Helvetica Neue", Arial. (Prioritizes Japanese fonts for better centering of colons and full-width characters).
*   **Vertical Alignment Hack:** In `.local-text` (72% height) and `.en-text` (28% height), the split is **not** 50/50. This is intentional to optically center the heavy Kanji/Hanzi characters. **Do not reset to 50/50.**

## 6. Important Caveats for Future Devs

1.  **Do not use `innerHTML` on the whole board:** When updating, we only update the *target state* of the `FlapUnit`. Rebuilding DOM kills the animation.
2.  **Performance:** `ROW_COUNT` is currently capped (e.g., 3 or 6) to maintain 60fps on mobile devices during heavy flipping.
3.  **Skeuomorphism:** The `::after` (thickness) and `::before` (shadow) pseudo-elements on `.flap-unit` are critical for the 3D feel. Do not remove them for "cleanliness".
4.  **Language:** The HTML tag is set to `lang="en"`, but CSS font stacks prioritize CJK fonts to ensure correct glyph rendering (preventing Han Unification issues).

## 7. URL Parameters

*   `?t=filename`: Loads `./timetable/filename.json`.
*   Example: `board.html?t=kumamoto` loads `kumamoto.json`.

## 8. Gemini Log

This section details an analysis of the codebase conducted by a Gemini agent, identifying potential bugs, performance bottlenecks, and maintainability risks as of 2025-12-28.

### Identified Problems and Risks:

**Bugs / High Risks:**

1.  **FlapUnit.setTarget Data Overwrite:**
    *   **Description:** The "Safety Fallback" logic within `FlapUnit.setTarget` dynamically injects new words into `this.physicalList` if they are not found. This can lead to overwriting existing, potentially valid, non-blank entries if the list capacity or available blank slots are insufficient. This is the most critical identified bug, directly impacting data integrity and display accuracy.
    *   **File:** `script.js`
    *   **Snippet:**
        ```javascript
        // Original problematic section in FlapUnit.setTarget:
        if (nextIndex === -1) {
            let freeSlotIndex = this.physicalList.findIndex((item, idx) => item.local === " " && idx !== 0);
            if (freeSlotIndex === -1) {
                freeSlotIndex = (this.pointer + 5) % this.physicalList.length;
                if (freeSlotIndex === 0) freeSlotIndex = 1;
            }
            this.physicalList[freeSlotIndex] = { ... }; // Overwrites
            nextIndex = freeSlotIndex;
        }
        ```
    *   **Revised Analysis and Proposed Solution (2025-12-28):**
        Further analysis revealed that `createPhysicalList` (the "spool making function") is only called during the initial setup (`isInitialized = false`) when `TrainGroup` and `WordFlap` instances are first created. It is *not* called on subsequent `fetchData` cycles (which occur every 30 seconds). Therefore, the `physicalList` within each `WordFlap` instance is static after initialization and does not automatically update to include new words introduced in later schedule fetches.
        The "Safety Fallback" was a risky attempt to address this, but it led to data corruption. A more robust solution is required:
        **Proposed Solution:**
        1.  **Refactor `getCap`:** Move `getCap` to the global scope to make it accessible for recalculating capacity.
        2.  **Create `mergeIntoPhysicalList` utility:** A new function to safely merge new unique words from the latest `presets` and `scheduleData` into an existing `WordFlap`'s `physicalList` without duplicates, while respecting capacity.
        3.  **Add `updatePhysicalLists` to `TrainGroup`:** A new method in `TrainGroup` to orchestrate calling `mergeIntoPhysicalList` for all its `WordFlap` instances.
        4.  **Call `TrainGroup.updatePhysicalLists` in `fetchData`:** After `fetchData` retrieves new data, if `isInitialized` is `true`, iterate through all `TrainGroup` instances and call their `updatePhysicalLists` method.
        5.  **Finalize `FlapUnit.setTarget` fix:** Once `physicalList` is guaranteed to be updated, the dynamic injection logic in `FlapUnit.setTarget` can be safely removed. Any word not found at that point can then reliably default to blank or log an error.
      * To be investigated later: The user has to refresh the page if a JSON is updated. The fetchData() function is solely for the data (currently displaying flap cards) to sync with time. Will this render the bug irrelevant?

2.  **Fragile FlapUnit.step() Timing:**
    *   **Description:** The `setTimeout(..., 150)` in `FlapUnit.step()` is tightly coupled to the CSS animation duration (`--flap-speed: 0.15s`). If these values diverge (e.g., due to user styling, browser performance variations, or future changes to CSS), animations could become janky or out of sync, leading to visual glitches.
    *   **File:** `script.js`
    *   **Snippet:**
        ```javascript
        setTimeout(() => {
            // ...
        }, 150); // Crucial: the JS interval (150ms) must be greater than the CSS animation duration (--flap-speed: 0.15s)
        ```

**Performance / UX Risks:**

4.  **`fetchData` Fixed 1-Second Row Update Delay:**
    *   **Description:** The `await sleep(1000)` inserted between updating each row in the `fetchData` function creates a fixed 1-second delay for each subsequent row. For a board with `ROW_COUNT` rows, this translates to `(ROW_COUNT - 1)` seconds of forced waiting before the entire board has been updated. This can make the board feel slow and unresponsive to updates from the user's perspective.
    *   **File:** `script.js`
    *   **Snippet:**
        ```javascript
        for (let i = 0; i < ROW_COUNT; i++) {
            if (groups[i]) {
                groups[i].update(displayTrains[i]);
                if (i < ROW_COUNT - 1) {
                    await sleep(1000); // This line
                }
            }
        }
        ```

**Maintainability / Minor Risks:**

6.  **Monolithic `script.js` and Global State:**
    *   **Description:** The entire core logic of the application resides in a single `script.js` file, with several global variables (`groups`, `isInitialized`, `ROW_COUNT`) and a large `fetchData` function. While currently manageable due to the project's size, this architecture will become a significant maintainability challenge as the project grows, making it harder to debug, add new features, or refactor components without introducing side effects.
    *   **File:** `script.js`
    *   **Snippet (examples):** Global variables at the top, large `fetchData` function.

7.  **Inaccurate `adjustColumnWidth` for Diverse Unicode:**
    *   **Description:** The `adjustColumnWidth` function attempts to calculate the visual length of text by assigning `0.6` width units to ASCII characters and `1.0` to others (presumably CJK characters). This simplified model, while generally effective for typical Japanese/English text, might not be perfectly accurate for all possible Unicode characters or specific font renderings. This could lead to minor, subtle misalignments in column widths for very diverse text content.
    *   **File:** `script.js`
    *   **Snippet:**
        ```javascript
        if (char.charCodeAt(0) < 128) visualLength += 0.6;
        else visualLength += 1;
        ```

8.  **`createPhysicalList` Redundant Blank Handling:**
    *   **Description:** The `createPhysicalList` function initializes its internal `list` with `BLANK_DATA` at index 0 and then uses a `processItems` helper that explicitly skips items where `item.local.trim() === ""`. While not a critical bug, the logic for managing and padding with blank cards could be slightly streamlined or made more explicit to avoid minor inefficiencies or potential confusion.
    *   **File:** `script.js`
    *   **Snippet:**
        ```javascript
        let list = [BLANK_DATA]; // Index 0 is always blank
        // ...
        if (item && item.local && item.local.trim() !== "" && !seenLocals.has(item.local)) { /* ... */ }
        ```
