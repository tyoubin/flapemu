# FlapEmu: Split-flap Display Emulator

Demo: [https://tyoubin.github.io/flapemu/](https://tyoubin.github.io/flapemu/)

## Overview

FlapEmu is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules.

FlapEmuは、駅や空港などでよく見られるフリップ式表示器のエミュレーターです。事前に定義されたデータから時刻表データを動的に読み込み、象徴的なフリップアニメーションを視覚的にシミュレーションして時刻表を表示します。

## Features

*   **Realistic Flap Animation:** Smooth and authentic visual transitions for character and word changes.
*   **Configurable Timetables:** Easily switch between different schedules by modifying URL parameters or JSON data files.
*   **Dynamic Data Loading:** Automatically fetches/updates schedule and preset data.

## Configuration

FlapEmu loads its timetable data from JSON data located in the `timetable/` directory.

### Switching Timetables

You can switch between different timetable files by appending a query parameter `eki` to the URL. For example:

*   To load `timetable/demo.json` (default):
    `board.html`
*   To load `timetable/kumamoto.json`:
    `board.html?eki=kumamoto`
*   To load `timetable/shinagawa.json`:
    `board.html?eki=shinagawa`
*   To load `timetable/tohoku.json`:
    `board.html?eki=tohoku`

### Data Structure

The JSON timetable files should follow a specific structure. An example can be found in `timetable/demo.json`. Each file contains `schedule` (an array of train records) and `presets` (definitions for types, destinations, remarks, and stops).

## License

This project is licensed under the MIT License.
