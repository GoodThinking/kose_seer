#!/usr/bin/env python3
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET
import zlib

PRICE_UPDATES = {
    # 胶囊类
    "300001": {"name": "普通精灵胶囊", "price": "1000"},
    "300002": {"name": "中级精灵胶囊", "price": "3000"},
    "300003": {"name": "高级精灵胶囊", "price": "8000"},
    "300004": {"name": "超级精灵胶囊", "price": "20000"},
    "300006": {"name": "无敌精灵胶囊", "price": "100000"},
    # 体力药剂
    "300011": {"name": "初级体力药剂", "price": "100"},
    "300012": {"name": "中级体力药剂", "price": "300"},
    "300013": {"name": "高级体力药剂", "price": "800"},
    "300014": {"name": "超级体力药剂", "price": "2000"},
    "300015": {"name": "特级体力药剂", "price": "5000"},
    # 活力药剂
    "300016": {"name": "初级活力药剂", "price": "200"},
    "300017": {"name": "中级活力药剂", "price": "1000"},
    "300018": {"name": "高级活力药剂", "price": "3000"},
    "300019": {"name": "超级活力药剂", "price": "6000"},
    # 洗练与养成道具
    "300024": {"name": "个体重塑药剂", "price": "20000"},
    "300025": {"name": "神经元再生胶囊", "price": "30000"},
    "300026": {"name": "降级秘药", "price": "5000"},
    "300052": {"name": "融合精灵特性重组剂", "price": "50000"},
    "300053": {"name": "特性开启晶片", "price": "30000"},
    "300054": {"name": "特性重组剂", "price": "50000"},
    "300152": {"name": "形态固定胶囊", "price": "10000"},
    "300153": {"name": "形态还原胶囊", "price": "5000"},
    "300650": {"name": "全能学习力遗忘剂", "price": "10000"},
    "300651": {"name": "全能学习力注入剂", "price": "50000"},
    "300700": {"name": "100级升级秘药", "price": "200000"},
    "400501": {"name": "神奇扭蛋牌", "price": "5000"},
    # 加成卡（改名为十倍并提价至20000豆）
    "399901": {"name": "十倍经验卡", "price": "20000", "multiplier": "10"},
    "399902": {"name": "十倍学习力卡", "price": "20000", "multiplier": "10"},
    "399903": {"name": "十倍赛尔豆卡", "price": "20000", "multiplier": "10"},
}

BAG_CLASS = b"com/robot/app/bag/BagPanel"


def u30_read(buf, i):
    val = 0
    shift = 0
    for _ in range(5):
        b = buf[i]
        i += 1
        val |= (b & 0x7F) << shift
        if b < 0x80:
            return val, i
        shift += 7
    raise SystemExit("bad u30")


def s32_read(buf, i):
    val = 0
    shift = 0
    for n in range(5):
        b = buf[i]
        i += 1
        val |= (b & 0x7F) << shift
        shift += 7
        if b < 0x80:
            if n < 4 and (b & 0x40):
                val |= -1 << shift
            return val, i
    return val, i


def u30_write(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def patch_bag_panel_abc(abc: bytes) -> bytes:
    p = abc.index(0, 4) + 1 + 4
    int_count, p = u30_read(abc, p)
    for _ in range(max(0, int_count - 1)):
        _, p = s32_read(abc, p)
    uint_count, p = u30_read(abc, p)
    for _ in range(max(0, uint_count - 1)):
        _, p = u30_read(abc, p)
    double_count, p = u30_read(abc, p)
    if double_count:
        p += 8 * (double_count - 1)
    string_count, p = u30_read(abc, p)
    pool_start = p
    strings = []
    for _ in range(1, string_count):
        ln, p = u30_read(abc, p)
        strings.append(abc[p : p + ln])
        p += ln
    pool_end = p

    str_repls = {
        537: (
            "<font color='#f7c948'>一百倍赛尔豆: ".encode(),
            "<font color='#f7c948'>十倍赛尔豆: ".encode(),
        ),
        538: ("赛尔豆100x[".encode(), "赛尔豆10x[".encode()),
        555: ("经验加成（100倍）：".encode(), "经验加成（10倍）：".encode()),
        557: ("<br>赛尔豆加成（100倍）：".encode(), "<br>赛尔豆加成（10倍）：".encode()),
        558: ("<font color='#59d685'>一百倍经验: ".encode(), "<font color='#59d685'>十倍经验: ".encode()),
        559: ("经验100x[".encode(), "经验10x[".encode()),
    }

    for idx, (old, new) in str_repls.items():
        assert strings[idx - 1] == old, f"String {idx} expected {old!r}, got {strings[idx-1]!r}"
        strings[idx - 1] = new

    rebuilt = bytearray()
    for s in strings:
        rebuilt += u30_write(len(s))
        rebuilt += s
    return abc[:pool_start] + bytes(rebuilt) + abc[pool_end:]


def patch_text_xml(content: str, updates: dict) -> str:
    lines = content.splitlines(keepends=True)
    out_lines = []
    for line in lines:
        for iid, cfg in updates.items():
            pat = rf'(<item\s+(?:itemID|id)="|Item\s+ID="){iid}(".*?>)'
            m = re.search(pat, line, re.IGNORECASE)
            if m:
                # Update price
                if "price" in cfg:
                    if re.search(r'Price="[^"]*"', line):
                        line = re.sub(r'Price="[^"]*"', f'Price="{cfg["price"]}"', line)
                    elif re.search(r'price="[^"]*"', line):
                        line = re.sub(r'price="[^"]*"', f'price="{cfg["price"]}"', line)
                    elif 'Rarity="' in line:
                        line = re.sub(r'(Rarity="[^"]*")', rf'\1 Price="{cfg["price"]}"', line)
                    elif 'Name="' in line:
                        line = re.sub(r'(Name="[^"]*")', rf'\1 Price="{cfg["price"]}"', line)
                # Update name
                if "name" in cfg:
                    line = re.sub(r'Name="[^"]*"', f'Name="{cfg["name"]}"', line)
                    line = re.sub(r'name="[^"]*"', f'name="{cfg["name"]}"', line)
                # Update multiplier
                if "multiplier" in cfg:
                    line = re.sub(r'RewardMultiplier="[^"]*"', f'RewardMultiplier="{cfg["multiplier"]}"', line)
                # Update 1.bin description
                if iid in ("399901", "399903") and "100倍" in line:
                    line = line.replace("100倍", "10倍")
                break
        out_lines.append(line)
    return "".join(out_lines)


def patch_core_swf(input_path: Path, output_path: Path):
    raw = input_path.read_bytes()
    assert raw[:3] == b"CWS", "Expected compressed CWS"
    body = bytearray(zlib.decompress(raw[8:]))
    nbits = body[0] >> 3
    pos = (5 + nbits * 4 + 7) // 8 + 4
    modified = {1: 0, 29: 0, 31: 0, "abc": 0}
    abc_names = Counter()

    while pos + 2 <= len(body):
        code_len = struct.unpack_from("<H", body, pos)[0]
        code = code_len >> 6
        length = code_len & 0x3F
        header = 2
        if length == 0x3F:
            length = struct.unpack_from("<I", body, pos + 2)[0]
            header = 6
        if code == 0:
            break
        start = pos + header
        payload = bytes(body[start : start + length])
        if code == 82:
            name = payload[4 : payload.index(0, 4)]
            abc_names[name] += 1
        new_payload = None

        if code == 87:
            cid = struct.unpack_from("<H", payload, 0)[0]
            if cid in (1, 29, 31):
                text = payload[6:].decode("utf-8")
                patched_text = patch_text_xml(text, PRICE_UPDATES)
                new_payload = payload[:6] + patched_text.encode("utf-8")
                modified[cid] += 1
        elif code == 82 and payload[4 : payload.index(0, 4)] == BAG_CLASS:
            new_payload = patch_bag_panel_abc(payload)
            modified["abc"] += 1

        if new_payload is not None:
            delta = len(new_payload) - length
            body[start : start + length] = new_payload
            if header != 6:
                raise SystemExit("short tag not supported for replacement")
            struct.pack_into("<I", body, pos + 2, length + delta)
            pos = start + length + delta
            continue
        pos = start + length

    assert modified == {1: 1, 29: 1, 31: 1, "abc": 1}, f"Modified count mismatch: {modified}"
    assert all(count == 1 for count in abc_names.values()), "Duplicate ABC names detected"

    file_len = len(body) + 8
    out = bytearray(b"CWS")
    out.append(raw[3])
    out += struct.pack("<I", file_len)
    out += zlib.compress(bytes(body), 9)

    # Verification on roundtrip
    check = zlib.decompress(out[8:])
    assert len(check) + 8 == file_len

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(out)
    h = hashlib.sha256(out).hexdigest()
    print(f"Patched SWF sha256: {h}, size: {len(out)}")
    return h


def patch_repo_files(repo_root: Path):
    # 1. binaryData/1.bin
    p1 = repo_root / "compat/client-patches/coin-products/binaryData/1.bin"
    if p1.exists():
        old_text = p1.read_text(encoding="utf-8")
        new_text = patch_text_xml(old_text, PRICE_UPDATES)
        p1.write_text(new_text, encoding="utf-8")
        print(f"Updated {p1.relative_to(repo_root)}")

    # 2. binaryData/31.bin
    p31 = repo_root / "compat/client-patches/coin-products/binaryData/31.bin"
    if p31.exists():
        old_text = p31.read_text(encoding="utf-8")
        new_text = patch_text_xml(old_text, PRICE_UPDATES)
        p31.write_text(new_text, encoding="utf-8")
        print(f"Updated {p31.relative_to(repo_root)}")

    # 3. items.xml
    pxml = repo_root / "compat/server-patches/coin-products/config/data/xml/items.xml"
    if pxml.exists():
        old_text = pxml.read_text(encoding="utf-8")
        new_text = patch_text_xml(old_text, PRICE_UPDATES)
        pxml.write_text(new_text, encoding="utf-8")
        print(f"Updated {pxml.relative_to(repo_root)}")

    # 4. money-products.json
    pjson = repo_root / "compat/server-patches/coin-products/config/data/json/money-products.json"
    if pjson.exists():
        with open(pjson, "r", encoding="utf-8") as f:
            data = json.load(f)
        for product in data.get("products", []):
            if 300700 in product.get("itemIds", []):
                product["coins"] = int(PRICE_UPDATES["300700"]["price"])
                product["vipCoins"] = int(PRICE_UPDATES["300700"]["price"])
        with open(pjson, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"Updated {pjson.relative_to(repo_root)}")


def main():
    parser = argparse.ArgumentParser(description="Patch reward boost 10x multiplier and item prices")
    parser.add_argument("--core", type=Path, help="Input NieoCore.swf")
    parser.add_argument("--out", type=Path, help="Output NieoCore.swf")
    parser.add_argument("--update-repo", type=Path, help="Path to repo root to update source files")
    args = parser.parse_args()

    if args.core and args.out:
        patch_core_swf(args.core, args.out)

    if args.update_repo:
        patch_repo_files(args.update_repo)


if __name__ == "__main__":
    main()
