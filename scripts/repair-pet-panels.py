#!/usr/bin/env python3
"""Restore two overwritten pet panel ABC tags without rolling back other patches."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct
import zlib


BAG = b"com/robot/app/bag/BagPanel"
PANELS = (
    b"com/robot/app/fightLevel/FightPetBagPanel",
    b"com/robot/app/petbag/ui/PetBagPanel",
)


def parse_swf(raw):
    if raw[:3] != b"CWS":
        raise ValueError("Expected a compressed CWS core")
    body = zlib.decompress(raw[8:])
    if len(body) + 8 != struct.unpack_from("<I", raw, 4)[0]:
        raise ValueError("SWF length mismatch")
    start = (5 + (body[0] >> 3) * 4 + 7) // 8 + 4
    header = body[:start]
    records = []
    while start < len(body):
        short = struct.unpack_from("<H", body, start)[0]
        code, length = short >> 6, short & 63
        offset = start + 2
        if length == 63:
            length = struct.unpack_from("<I", body, offset)[0]
            offset += 4
        end = offset + length
        if end > len(body):
            raise ValueError("Truncated SWF tag")
        payload = body[offset:end]
        name = payload[4:payload.index(0, 4)] if code == 82 else None
        records.append((code, name, body[start:end]))
        start = end
        if code == 0:
            break
    if start != len(body) or not records or records[-1][0] != 0:
        raise ValueError("Invalid SWF end tag")
    return header, records


def repair(current, reference):
    header, records = parse_swf(current)
    ref_header, ref_records = parse_swf(reference)
    if header != ref_header or len(records) != len(ref_records):
        raise ValueError("Reference has a different movie or tag layout")
    counts = Counter(name for code, name, _ in records if code == 82)
    ref_counts = Counter(name for code, name, _ in ref_records if code == 82)
    if any(count != 1 for count in ref_counts.values()):
        raise ValueError("Reference contains duplicate ABC names")
    if any(ref_counts[name] != 1 for name in (BAG, *PANELS)):
        raise ValueError("Reference is missing a required panel")
    expected = ref_counts.copy()
    for name in PANELS:
        del expected[name]
    expected[BAG] = 3
    if counts != expected:
        raise ValueError("Core does not match the known two-panel overwrite")
    bag_bytes = {data for code, name, data in records if name == BAG}
    if len(bag_bytes) != 1:
        raise ValueError("Duplicate BagPanel tags differ; refuse ambiguous recovery")
    restored = []
    result = []
    for index, (record, ref_record) in enumerate(zip(records, ref_records)):
        code, name, data = record
        ref_code, ref_name, ref_data = ref_record
        if code != ref_code:
            raise ValueError(f"Tag layout differs at {index}")
        if ref_name in PANELS:
            if name != BAG:
                raise ValueError(f"Expected overwritten panel at {index}")
            data = ref_data
            restored.append({"tagIndex": index, "class": ref_name.decode()})
        elif name != ref_name:
            raise ValueError(f"Unrelated ABC name differs at {index}")
        result.append(data)
    if len(restored) != 2:
        raise ValueError("Expected exactly two restored panel tags")
    body = header + b"".join(result)
    output = current[:4] + struct.pack("<I", len(body) + 8) + zlib.compress(body, 9)
    _, checked = parse_swf(output)
    if Counter(name for code, name, _ in checked if code == 82) != ref_counts:
        raise ValueError("Restored class inventory differs from the reference")
    changed = [i for i, (a, b) in enumerate(zip(records, checked)) if a != b]
    if changed != [item["tagIndex"] for item in restored]:
        raise ValueError("Recovery changed unrelated SWF tags")
    return output, restored


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--core", type=Path, required=True)
    parser.add_argument("--reference", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if args.out.resolve() in (args.core.resolve(), args.reference.resolve()):
        parser.error("Output must not overwrite either input")
    current, reference = args.core.read_bytes(), args.reference.read_bytes()
    output, restored = repair(current, reference)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(output)
    print(json.dumps({
        "coreSha256": hashlib.sha256(current).hexdigest(),
        "referenceSha256": hashlib.sha256(reference).hexdigest(),
        "outputSha256": hashlib.sha256(output).hexdigest(),
        "restored": restored,
        "unrelatedTagsPreserved": True,
    }, indent=2))


if __name__ == "__main__":
    main()
