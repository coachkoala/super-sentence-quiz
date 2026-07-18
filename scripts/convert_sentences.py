#!/usr/bin/env python3
"""Converts the 'Tracker Kalimat' source spreadsheet into data/sentences.json.

Tokenization rule (matches the existing sample data by hand-inspection):
  - Split each English sentence on whitespace.
  - Strip a trailing run of . ! ? (including "...") from the LAST token only.
  - Every other token, including internal commas, apostrophes, and hyphenated
    words, is kept exactly as written.

Usage:
  python scripts/convert_sentences.py <source.xlsx> [output.json]
"""
import json
import re
import sys
from pathlib import Path

import pandas as pd

TRAILING_PUNCT_RE = re.compile(r"[.!?]+$")


def tokenize(sentence: str) -> list[str]:
    words = sentence.split()
    if not words:
        return []
    words[-1] = TRAILING_PUNCT_RE.sub("", words[-1])
    return words


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python convert_sentences.py <source.xlsx> [output.json]", file=sys.stderr)
        sys.exit(1)

    src = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "data" / "sentences.json"

    df = pd.read_excel(src, sheet_name="Tracker Kalimat")

    errors = []
    seen_ids = set()
    records = []

    for row in df.itertuples(index=False):
        i, e, _cara_baca, t, _topik, _bab = row
        i = int(i)
        e = str(e).strip()
        t = str(t).strip()

        if i in seen_ids:
            errors.append(f"duplicate id {i}")
        seen_ids.add(i)

        if not e:
            errors.append(f"id {i}: empty English sentence")
        if not t:
            errors.append(f"id {i}: empty Indonesian sentence")

        k = tokenize(e)
        if not k:
            errors.append(f"id {i}: tokenized to an empty word list")

        records.append({"i": i, "e": e, "t": t, "k": k})

    if errors:
        print(f"Found {len(errors)} problem(s):", file=sys.stderr)
        for err in errors[:50]:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(records)} sentences to {out}")


if __name__ == "__main__":
    main()
