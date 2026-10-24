#!/usr/bin/env python3
"""Reprice captured production catalogs without rebuilding any gameplay code."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import runpy
import struct
import xml.etree.ElementTree as ET
import zlib

POLICY = runpy.run_path(str(Path(__file__).with_name("patch-reward-and-price.py")))["PRICE_UPDATES"]


def check(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def reprice_xml(data, require_all=True):
    text = data.decode("utf-8")
    ET.fromstring(text)
    seen = Counter()
    before = {}

    def update(match):
        tag = match.group(0)
        identity = re.search(r'\b(?:ID|itemID)="(\d+)"', tag)
        if not identity or identity[1] not in POLICY:
            return tag
        item_id = identity[1]
        price = re.search(r'\b(?:Price|price)="(\d+)"', tag)
        check(price is not None, "Missing price: " + item_id)
        old_price = int(price[1])
        check(item_id not in before or before[item_id] == old_price, "Conflicting item prices: " + item_id)
        before[item_id] = old_price
        seen[item_id] += 1
        return tag[:price.start(1)] + POLICY[item_id]["price"] + tag[price.end(1):]

    result = re.sub(r'<(?:Item|item)\b[^>]*>', update, text)
    check(set(seen) == set(POLICY) if require_all else bool(seen), "Missing target catalog entries")
    ET.fromstring(result)
    return result.encode("utf-8"), before


def parse_swf(raw):
    check(raw[:3] == b"CWS", "Expected compressed current Core")
    body = zlib.decompress(raw[8:])
    check(len(body) + 8 == struct.unpack_from("<I", raw, 4)[0], "Invalid SWF length")
    offset = (5 + (body[0] >> 3) * 4 + 7) // 8 + 4
    header = body[:offset]
    tags = []
    while offset < len(body):
        start = offset
        short = struct.unpack_from("<H", body, offset)[0]
        offset += 2
        length = short & 63
        if length == 63:
            length = struct.unpack_from("<I", body, offset)[0]
            offset += 4
        check(offset + length <= len(body), "Truncated SWF tag")
        payload = body[offset:offset + length]
        offset += length
        tags.append((short >> 6, payload, body[start:offset]))
        if short >> 6 == 0:
            break
    check(offset == len(body), "Trailing SWF bytes")
    return header, tags


def build(baseline, out):
    check(not out.exists(), "Choose a fresh output directory")
    core_paths = ["client/assets/dll/NieoCore.swf", "client/overlay/dll/NieoCore.swf"]
    raw = (baseline / core_paths[0]).read_bytes()
    check(raw == (baseline / core_paths[1]).read_bytes(), "Captured Core copies differ")
    header, tags = parse_swf(raw)
    item_path = "app/config/data/xml/items.xml"
    source_items = (baseline / item_path).read_bytes()
    updated_items, server_prices = reprice_xml(source_items)
    replacements = {}
    binary_seen = Counter()
    for index, (code, payload, _) in enumerate(tags):
        if code != 87:
            continue
        character_id = struct.unpack_from("<H", payload)[0]
        if character_id not in (29, 31):
            continue
        binary_seen[character_id] += 1
        updated, displayed = reprice_xml(payload[6:], require_all=character_id == 31)
        check(all(server_prices[item_id] == price for item_id, price in displayed.items()), "Client/server baseline price mismatch")
        new_payload = payload[:6] + updated
        replacements[index] = struct.pack("<HI", (87 << 6) | 63, len(new_payload)) + new_payload
    check(binary_seen == Counter({29: 1, 31: 1}), "Expected unique shop and item catalogs")
    body = header + b"".join(replacements.get(i, tag[2]) for i, tag in enumerate(tags))
    updated_core = raw[:4] + struct.pack("<I", len(body) + 8) + zlib.compress(body, 9)
    new_header, new_tags = parse_swf(updated_core)
    check(new_header == header and len(new_tags) == len(tags), "Core structure changed")
    check(all(new_tags[i][2] == tags[i][2] for i in range(len(tags)) if i not in replacements), "Unrelated SWF tag changed")
    product_path = "app/config/data/json/money-products.json"
    products = json.loads((baseline / product_path).read_text(encoding="utf-8"))
    check(products["currency"] == "coins", "Unexpected product currency")
    changed_products = []
    for product in products["products"]:
        targets = [str(item_id) for item_id in product["itemIds"] if str(item_id) in POLICY]
        if not targets:
            continue
        check(len(product["itemIds"]) == 1 and targets == ["300700"], "Unexpected target product bundle")
        check(product["coins"] == product["vipCoins"] == server_prices[targets[0]], "Product baseline price mismatch")
        product["coins"] = product["vipCoins"] = int(POLICY[targets[0]]["price"])
        changed_products.append(product["productId"])
    check(len(changed_products) == 1, "Expected one 100-level medicine product")
    outputs = {core_paths[0]: updated_core, core_paths[1]: updated_core, item_path: updated_items,
               product_path: (json.dumps(products, ensure_ascii=False, indent=2) + "\n").encode("utf-8")}
    files = []
    for relative, content in outputs.items():
        original = (baseline / relative).read_bytes()
        check(original != content, "No price change: " + relative)
        target = out / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        files.append({"path": relative, "before": sha(original), "after": sha(content)})
    manifest = {"files": files, "prices": [{"itemId": int(item_id), "name": entry["name"],
                 "before": server_prices[item_id], "after": int(entry["price"])} for item_id, entry in POLICY.items()],
                "changedBinaryData": [29, 31], "unchangedOtherSwfTags": len(tags) - 2,
                "changedProducts": changed_products, "serverCodeChanged": False,
                "databaseWrites": False, "restartServices": ["kose-seer.service"]}
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(files), "items": len(POLICY), "coreSha256": sha(updated_core)}, ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    build(args.baseline.resolve(), args.out.resolve())
