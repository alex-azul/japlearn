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


def table_exists(connection, table_name):
    row = connection.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
        """,
        (table_name,),
    ).fetchone()

    return row is not None


def column_exists(connection, table_name, column_name):
    rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return any(row["name"] == column_name for row in rows)


def load_entries():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        mnemonic_expression = (
            "mnemonic_es"
            if column_exists(connection, "vocabulary", "mnemonic_es")
            else "'' AS mnemonic_es"
        )
        rows = connection.execute(
            f"""
            SELECT id, kanji, furigana, romaji, meaning, {mnemonic_expression}
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
                "mnemonic": normalize_text(row["mnemonic_es"]),
            }

            if is_valid_entry(entry):
                entries.append(entry)

        return entries
    finally:
        connection.close()


def load_radicals():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row

    try:
        if not table_exists(connection, "kanji_radicals"):
            return []

        rows = connection.execute(
            """
            SELECT id, radical, variants, strokes, name_es, mnemonic_es, kind
            FROM kanji_radicals
            ORDER BY id ASC
            """
        )

        return [
            {
                "id": int(row["id"]),
                "radical": normalize_text(row["radical"]),
                "variants": normalize_text(row["variants"]),
                "strokes": int(row["strokes"]),
                "name": normalize_text(row["name_es"]),
                "mnemonic": normalize_text(row["mnemonic_es"]),
                "kind": normalize_text(row["kind"]),
            }
            for row in rows
            if normalize_text(row["radical"]) and normalize_text(row["name_es"])
        ]
    finally:
        connection.close()


def write_module(entries, radicals):
    vocabulary_payload = json.dumps(entries, ensure_ascii=True, separators=(",", ":"))
    radical_payload = json.dumps(radicals, ensure_ascii=True, separators=(",", ":"))
    content = (
        "// Generated from jlpt_n5_vocab.db by export_vocabulary_module.py\n"
        "export const VOCABULARY_DATA = Object.freeze("
        + vocabulary_payload
        + ");\n"
        "export const RADICALS_DATA = Object.freeze("
        + radical_payload
        + ");\n"
    )
    OUTPUT_PATH.write_text(content, encoding="utf-8")


def main():
    entries = load_entries()
    radicals = load_radicals()
    write_module(entries, radicals)
    print(
        f"Wrote {len(entries)} vocabulary entries and "
        f"{len(radicals)} radicals to {OUTPUT_PATH.name}"
    )


if __name__ == "__main__":
    main()
