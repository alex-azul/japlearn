#!/usr/bin/env python3

import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "jlpt_n5_vocab.db"
OUTPUT_PATH = ROOT / "vocabulary-data.js"


def normalize_text(value):
    if isinstance(value, str):
        return value.strip()
    return ""


def is_valid_entry(entry):
    has_prompt = bool(entry["kanji"] or entry["furigana"])
    has_meaning = bool(entry["meaning"])
    return has_prompt and has_meaning


def load_entries():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        rows = connection.execute(
            """
            SELECT id, kanji, furigana, romaji, meaning
            FROM vocabulary
            ORDER BY id ASC
            """
        )

        entries = []
        for row in rows:
            entry = {
                "id": int(row["id"]),
                "kanji": normalize_text(row["kanji"]),
                "furigana": normalize_text(row["furigana"]),
                "romaji": normalize_text(row["romaji"]),
                "meaning": normalize_text(row["meaning"]),
            }

            if is_valid_entry(entry):
                entries.append(entry)

        return entries
    finally:
        connection.close()


def write_module(entries):
    payload = json.dumps(entries, ensure_ascii=True, separators=(",", ":"))
    content = (
        "// Generated from jlpt_n5_vocab.db by export_vocabulary_module.py\n"
        "export const VOCABULARY_DATA = Object.freeze("
        + payload
        + ");\n"
    )
    OUTPUT_PATH.write_text(content, encoding="utf-8")


def main():
    entries = load_entries()
    write_module(entries)
    print(f"Wrote {len(entries)} entries to {OUTPUT_PATH.name}")


if __name__ == "__main__":
    main()
