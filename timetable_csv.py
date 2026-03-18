#!/usr/bin/env python3
"""Import/export timetable schedule to/from CSV.

Usage:
  python timetable_csv.py export timetable/shinagawa.json timetable/shinagawa.csv
  python timetable_csv.py import timetable/shinagawa.json timetable/shinagawa.csv

The CSV header must match the expected 13 columns:
  track_no, type.local, type.en, type_color_hex, type_text_color, train_no,
  depart_time, destination.local, destination.en, remarks.local, remarks.en,
  stops_at.local, stops_at.en
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from contextlib import contextmanager
from typing import Dict, Iterable, List


EXPECTED_FIELDS = [
    "track_no",
    "type.local",
    "type.en",
    "type_color_hex",
    "type_text_color",
    "train_no",
    "depart_time",
    "destination.local",
    "destination.en",
    "remarks.local",
    "remarks.en",
    "stops_at.local",
    "stops_at.en",
]


@contextmanager
def smart_open(path: str, mode: str, *, encoding: str, newline: str):
    if path == "-":
        if "r" in mode:
            yield sys.stdin
        else:
            yield sys.stdout
        return
    with open(path, mode, encoding=encoding, newline=newline) as handle:
        yield handle


def _coerce(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def _get_nested(obj: Dict, *path: str) -> str:
    current = obj
    for key in path:
        if not isinstance(current, dict):
            return ""
        current = current.get(key)
    return _coerce(current)


def schedule_to_rows(schedule: Iterable[Dict]) -> Iterable[Dict[str, str]]:
    for entry in schedule:
        if not isinstance(entry, dict):
            raise ValueError("schedule entries must be objects")
        yield {
            "track_no": _get_nested(entry, "track_no"),
            "type.local": _get_nested(entry, "type", "local"),
            "type.en": _get_nested(entry, "type", "en"),
            "type_color_hex": _get_nested(entry, "type_color_hex"),
            "type_text_color": _get_nested(entry, "type_text_color"),
            "train_no": _get_nested(entry, "train_no"),
            "depart_time": _get_nested(entry, "depart_time"),
            "destination.local": _get_nested(entry, "destination", "local"),
            "destination.en": _get_nested(entry, "destination", "en"),
            "remarks.local": _get_nested(entry, "remarks", "local"),
            "remarks.en": _get_nested(entry, "remarks", "en"),
            "stops_at.local": _get_nested(entry, "stops_at", "local"),
            "stops_at.en": _get_nested(entry, "stops_at", "en"),
        }


def row_to_schedule_entry(row: Dict[str, str]) -> Dict:
    def val(key: str) -> str:
        value = row.get(key, "")
        return "" if value is None else value

    return {
        "track_no": val("track_no"),
        "type": {
            "local": val("type.local"),
            "en": val("type.en"),
        },
        "type_color_hex": val("type_color_hex"),
        "type_text_color": val("type_text_color"),
        "train_no": val("train_no"),
        "depart_time": val("depart_time"),
        "destination": {
            "local": val("destination.local"),
            "en": val("destination.en"),
        },
        "remarks": {
            "local": val("remarks.local"),
            "en": val("remarks.en"),
        },
        "stops_at": {
            "local": val("stops_at.local"),
            "en": val("stops_at.en"),
        },
    }


def read_csv_schedule(csv_path: str) -> List[Dict]:
    with smart_open(csv_path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise ValueError("CSV must include a header row")
        if fieldnames[0].startswith("\ufeff"):
            fieldnames[0] = fieldnames[0].lstrip("\ufeff")
            reader.fieldnames = fieldnames
        if fieldnames != EXPECTED_FIELDS:
            raise ValueError(
                "CSV header must match expected columns: "
                + ", ".join(EXPECTED_FIELDS)
            )

        schedule: List[Dict] = []
        for row in reader:
            if row is None:
                continue
            if row.get(None):
                raise ValueError(
                    f"CSV row {reader.line_num} has extra columns: {row.get(None)}"
                )
            if all((value is None or value == "") for value in row.values()):
                continue
            missing = [key for key, value in row.items() if value is None]
            if missing:
                raise ValueError(
                    f"CSV row {reader.line_num} is missing columns: {', '.join(missing)}"
                )
            schedule.append(row_to_schedule_entry(row))

    return schedule


def export_csv(json_path: str, csv_path: str) -> None:
    with open(json_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    schedule = data.get("schedule", [])
    if not isinstance(schedule, list):
        raise ValueError("JSON 'schedule' must be an array")

    with smart_open(csv_path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=EXPECTED_FIELDS)
        writer.writeheader()
        for row in schedule_to_rows(schedule):
            writer.writerow(row)


def import_csv(json_path: str, csv_path: str) -> None:
    schedule = read_csv_schedule(csv_path)

    with open(json_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)

    data["schedule"] = schedule

    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Import/export timetable schedule CSV. Use '-' for stdin/stdout."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    export_parser = subparsers.add_parser("export", help="Export JSON schedule to CSV")
    export_parser.add_argument("json_path", help="Path to timetable JSON")
    export_parser.add_argument("csv_path", help="Path to CSV output (or '-')")

    import_parser = subparsers.add_parser("import", help="Import CSV into JSON schedule")
    import_parser.add_argument("json_path", help="Path to timetable JSON")
    import_parser.add_argument("csv_path", help="Path to CSV input (or '-')")

    return parser


def main(argv: List[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "export":
            export_csv(args.json_path, args.csv_path)
        elif args.command == "import":
            import_csv(args.json_path, args.csv_path)
        else:
            parser.error("Unknown command")
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
