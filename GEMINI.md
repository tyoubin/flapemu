# FlapEmu - Developer & Agent Documentation

**Context for AI Agents:**

Read `README.md` **FIRST** for high-level project overview, file structure, usage instructions, and data schemas. This document (`GEMINI.md`) is reserved for internal implementation details, architectural constraints, and specific caveats for modifying the code.

Agent does not need to keep the information for old bugs etc, if the bug has been fixed. Git history is available for reference. Agent shall update this document when necessary.

This project relies heavily on **Skeuomorphism** (simulating physical mechanics) and **CSS 3D Transforms**. The architecture follows the **KISS principle** (Keep It Simple, Stupid). Do not introduce frameworks (React, Vue, etc.) or build steps (Webpack, TS) unless explicitly requested.

---

## Project Overview

**FlapEmu** simulates the mechanical departure boards found in train stations and airports. It uses a data-driven approach where the visual representation is decoupled from the data source.

*   **Core Goal:** Photorealistic simulation of mechanical flipping, lighting, and layout with a global environmental light source.
*   **Tech Stack:** Pure HTML5, CSS3, ES6+ JavaScript.
*   **Deployment:** Static hosting (e.g., GitHub Pages).

## Core Mechanics (How it works)

### The "Physical Spool" Logic
Unlike digital displays that change content instantly, this simulator mimics a physical spool of cards.
*   **Implementation:** `createPhysicalList()` in `js/data-logic.js`.
*   **Logic:**
    1.  Loads `presets` from JSON (simulating factory-installed cards).
    2.  Scans the current `schedule` for new values (dynamic injection).
    3.  Merges them and pads with `BLANK_DATA` up to a specific `capacity`.
*   **Flipping:** The animation iterates through this array index by index (`pointer` -> `targetPointer`). It does not jump directly to the target.

### Visual Rendering (`FlapUnit`)
Each character or word block is a `FlapUnit` class.
*   **DOM Structure:** 
    *   `.top` (Static upper half)
    *   `.bottom` (Static lower half)
    *   `.flap.front` (Animating upper half)
    *   `.flap.back` (Animating lower half)
*   **Animation:** Controlled via CSS `@keyframes` (`flip-down-front`, `flip-down-back`).
*   **Sync Logic:** JS timing is decoupled from CSS durations. It uses `animationend` event listeners on the `.flap.back` element to trigger subsequent steps in the spool sequence.
*   **Lighting:** CSS `filter: brightness()` and `contrast()` are keyed to the animation frames to simulate diffused light reflections as the matt card rotates.
*   **Matt Finish:** Uses a flat card design with soft, even lighting (top-to-bottom subtle gradient) instead of a sharp glare. Uses an `inset` box-shadow on the unit to simulate a retracted/sunken physical mounting.

### Auto-Layout System
The board adapts to different text lengths defined in the JSON.
*   **Logic:** `adjustColumnWidth()` (in `main.js`) scans all text in `presets` and `schedule`.
*   **Calculation:** `(VisualLength * Multiplier) + Padding`. ASCII/Latin/Half-width Katakana count as 0.6 width, CJK chars as 1.0. (Logic in `js/utils.js`)
*   **Application:** Sets CSS Variables (e.g., `--col-dest-width`) at runtime.

### Sequential Updates
To prevent GPU bottlenecks on mobile devices:
*   **Mechanism:** `fetchData` (in `main.js`) uses `await sleep(1000)` between updating each row (`TrainGroup`).
*   **Effect:** Rows flip in a cascade (Wave effect) rather than all at once.

## CSS Architecture & Constraints

### Layout Strategy
*   **Desktop:** Uses a centered container with `max-width: 1200px`. The board adapts to this width, and columns may wrap if space is insufficient.
*   **Mobile:** Uses a `--scale-factor` CSS variable to fit the wide board onto small screens without breaking the physical aspect ratio of the flaps.

### Column Alignment (Strict)
*   **Fixed Columns (Track, No, Time):** Widths are calculated via `calc((var(--char-width) + 2px) * N - 2px)` to perfectly match the physical width of N flap units.
*   **Dynamic Columns (Type, Dest, Remarks):** Controlled by CSS variables set by JS.
*   **Alignment:** The Header Row and Content Rows share the exact same CSS classes and flex properties to ensure pixel-perfect vertical alignment.

### Typography
*   **Font Stack:** "Hiragino Kaku Gothic ProN", "Helvetica Neue", Arial. (Prioritizes Japanese fonts for better centering of colons and full-width characters).
*   **Vertical Alignment Hack:** In `.local-text` (72% height) and `.en-text` (28% height), the split is **not** 50/50. This is intentional to optically center the heavy Kanji/Hanzi characters. **Do not reset to 50/50.**

### PWA & Standalone Mode Implementation

To allow "Add to Home Screen" while maintaining the data-driven flexibility (URL parameters), FlapEmu uses a customized PWA stack.

*   **Dynamic Manifest Strategy (`js/pwa.js`):**
    *   Instead of a static `start_url` in `manifest.json`, the app generates a Blob URL for the manifest at runtime.
    *   It captures the current `window.location.href` as the `start_url`.
    *   This ensures that pinning a specific configuration (e.g., `?t=kumamoto&rows=3`) bookmarks that exact state.
*   **Service Worker (`sw.js`) - Dual Strategy:**
    *   **Assets:** Uses `stale-while-revalidate` for JS, CSS, and SVG icons to ensure instant loading of the "App Shell".
    *   **Timetable Data:** Uses **Network-Only** fetch for `.json` files. This is intentional to ensure the app doesn't serve stale data and correctly triggers the "System Adjustment" (error) overlay if the server connection is lost, maintaining mechanical board realism.
*   **iOS/Standalone Support:**
    *   Uses `apple-mobile-web-app-capable` and `black-translucent` status bar styles.
    *   **Safe Areas:** `style.css` and `home.css` use `env(safe-area-inset-*)` padding on the `body` to prevent the UI from being clipped by device notches or home indicators in standalone mode.

---

## Important Caveats for Future Devs

1.  **Do not use `innerHTML` on the whole board:** When updating, we only update the *target state* of the `FlapUnit`. Rebuilding DOM kills the animation.
2.  **Performance:** `ROW_COUNT` defaults to 3 but can be configured via URL parameter `?rows=N`. Be careful when increasing this number on mobile devices, as many flipping animations can cause GPU bottlenecks.
3.  **Skeuomorphism:** The `::after` pulse (simulating card thickness during flip) and the `.flap-unit::before` inset shadow (simulating the retracted bezel) are critical for the 3D photorealistic feel. Do not remove them for "cleanliness".
4.  **Language:** The HTML tag is set to `lang="en"`, but CSS font stacks prioritize CJK fonts to ensure correct glyph rendering (preventing Han Unification issues).
