# FlapEmu: Split-flap Display Emulator

https://github.com/user-attachments/assets/5fab661f-0162-4178-aec9-b20f25982a26

Demo: [https://tyoubin.github.io/flapemu/](https://tyoubin.github.io/flapemu/)

## Overview

FlapEmu is an emulator for split-flap displays, often seen in train stations and airports. It dynamically loads timetable data from pre-defined data and visually simulates the iconic flap animation to display schedules.

FlapEmuは、駅や空港に設置されている反転フラップ式案内表示機（ソラリーボード）を模したエミュレーターです。定義済みデータソースから時刻表情報を動的に取得し、特徴的なフラップの回転動作を視覚的にシミュレートして描画します。

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

### Data Structure

The JSON timetable files follow a specific structure containing station metadata, presets, and a schedule. While you can edit these files manually, it is recommended to use the **Timetable Editor** for a more convenient experience.

## License

This project is licensed under the MIT License.
