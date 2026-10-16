import argparse
from collections import Counter
import hashlib
import struct
import zlib
from pathlib import Path

parser = argparse.ArgumentParser(description="Update the exact BagPanel and coin-card XML to 100x.")
parser.add_argument("--core", type=Path, required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
src = args.core
dest = args.out
if src.resolve() == dest.resolve():
    parser.error("Output must not overwrite the input")
BAG_CLASS = b"com/robot/app/bag/BagPanel"
raw = src.read_bytes()
assert raw[:3] == b"CWS"
body = bytearray(zlib.decompress(raw[8:]))
assert len(body) + 8 == int.from_bytes(raw[4:8], "little")


def u30_read(buf, i):
    value = 0
    shift = 0
    for _ in range(5):
        b = buf[i]
        i += 1
        value |= (b & 0x7F) << shift
        if b < 0x80:
            return value, i
        shift += 7
    raise SystemExit("bad u30")


def s32_read(buf, i):
    value = 0
    shift = 0
    for n in range(5):
        b = buf[i]
        i += 1
        value |= (b & 0x7F) << shift
        shift += 7
        if b < 0x80:
            if n < 4 and (b & 0x40):
                value |= -1 << shift
            return value, i
    return value, i


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


STRINGS = {
    537: (
        "<font color='#f7c948'>五倍赛尔豆: ".encode(),
        "<font color='#f7c948'>一百倍赛尔豆: ".encode(),
    ),
    538: ("赛尔豆5x[".encode(), "赛尔豆100x[".encode()),
    557: ("<br>赛尔豆加成（5倍）：".encode(), "<br>赛尔豆加成（100倍）：".encode()),
}


def patch_abc(abc: bytes) -> bytes:
    name = abc[4 : abc.index(0, 4)]
    if name != BAG_CLASS:
        raise SystemExit(f"not bag panel {name}")
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
    for _idx in range(1, string_count):
        ln, p = u30_read(abc, p)
        strings.append(abc[p : p + ln])
        p += ln
    pool_end = p
    delta = 0
    for idx, (old, new) in STRINGS.items():
        if strings[idx - 1] != old:
            raise SystemExit(f"string {idx} mismatch {strings[idx - 1]!r}")
        strings[idx - 1] = new
        delta += len(new) - len(old)
    if delta != 7:
        raise SystemExit(f"abc delta {delta}")
    rebuilt = bytearray()
    for s in strings:
        rebuilt += u30_write(len(s))
        rebuilt += s
    return abc[:pool_start] + bytes(rebuilt) + abc[pool_end:]


xml_repls = {
    1: [("获得的赛尔豆为基础奖励的5倍".encode(), "获得的赛尔豆为基础奖励的100倍".encode(), 2)],
    29: [('name="五倍赛尔豆卡"'.encode(), 'name="一百倍赛尔豆卡"'.encode(), 3)],
    31: [('Name="五倍赛尔豆卡"'.encode(), 'Name="一百倍赛尔豆卡"'.encode(), 3)],
}
seen = {1: 0, 29: 0, 31: 0, "abc": 0}
abc_names = Counter()
nbits = body[0] >> 3
pos = (5 + nbits * 4 + 7) // 8 + 4
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
        abc_names[payload[4:payload.index(0, 4)]] += 1
    new_payload = None
    if code == 87:
        cid = struct.unpack_from("<H", payload, 0)[0]
        if cid in xml_repls:
            data = payload[6:]
            delta = 0
            for old, new, expect in xml_repls[cid]:
                if data.count(old) != 1:
                    raise SystemExit(f"xml {cid} count {data.count(old)} {old}")
                data = data.replace(old, new, 1)
                delta += expect
            new_payload = payload[:6] + data
            seen[cid] += 1
            if len(new_payload) - length != delta:
                raise SystemExit(f"xml {cid} delta {len(new_payload) - length}")
    elif code == 82 and payload[4:payload.index(0, 4)] == BAG_CLASS:
        new_payload = patch_abc(payload)
        seen["abc"] += 1
    if new_payload is not None:
        delta = len(new_payload) - length
        body[start : start + length] = new_payload
        if header != 6:
            raise SystemExit("short tag")
        struct.pack_into("<I", body, pos + 2, length + delta)
        pos = start + length + delta
        continue
    pos = start + length

if seen != {1: 1, 29: 1, 31: 1, "abc": 1}:
    raise SystemExit(f"seen {seen}")
if any(count != 1 for count in abc_names.values()):
    raise SystemExit("Duplicate ABC names; repair the core before applying this patch")
for required in (b"com/robot/app/petbag/ui/PetBagPanel", b"com/robot/app/fightLevel/FightPetBagPanel"):
    if abc_names[required] != 1:
        raise SystemExit(f"Missing required class: {required!r}")

file_len = len(body) + 8
out = bytearray(b"CWS")
out.append(raw[3])
out += struct.pack("<I", file_len)
out += zlib.compress(bytes(body), 9)

check = zlib.decompress(out[8:])
assert len(check) + 8 == file_len
pos = (5 + (check[0] >> 3) * 4 + 7) // 8 + 4
abc_ok = 0
while pos + 2 <= len(check):
    code_len = struct.unpack_from("<H", check, pos)[0]
    code = code_len >> 6
    length = code_len & 0x3F
    header = 2
    if length == 0x3F:
        length = struct.unpack_from("<I", check, pos + 2)[0]
        header = 6
    if pos + header + length > len(check):
        raise SystemExit("overrun")
    if code == 0:
        pos += header + length
        break
    payload = check[pos + header : pos + header + length]
    if code == 82 and payload[4:payload.index(0, 4)] == BAG_CLASS and "一百倍赛尔豆".encode() in payload:
        abc = payload
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
        strings = []
        for _idx in range(1, string_count):
            ln, p = u30_read(abc, p)
            strings.append(abc[p : p + ln])
            p += ln
        assert strings[536] == STRINGS[537][1]
        assert strings[537] == STRINGS[538][1]
        assert strings[556] == STRINGS[557][1]
        assert "一百倍经验".encode() in strings[557]
        code_bytes = abc[p:]

        def enc(n):
            outb = bytearray()
            while True:
                b = n & 0x7F
                n >>= 7
                if n:
                    outb.append(b | 0x80)
                else:
                    outb.append(b)
                    return bytes(outb)

        for idx in (537, 538, 557, 555, 534):
            pat = bytes([0x2C]) + enc(idx)
            assert code_bytes.count(pat) == 1, idx
        abc_ok += 1
    if code == 87:
        cid = struct.unpack_from("<H", payload, 0)[0]
        text = payload[6:]
        if cid == 29:
            assert 'name="一百倍赛尔豆卡"'.encode() in text
            assert 'name="一百倍经验卡"'.encode() in text
            assert 'price="40"'.encode() in text
        if cid == 31:
            assert 'Name="一百倍赛尔豆卡"'.encode() in text
            assert 'Name="一百倍经验卡"'.encode() in text
        if cid == 1:
            assert "基础奖励的100倍".encode() in text
            assert "基础奖励的5倍".encode() not in text
    pos += header + length
assert pos == len(check), (pos, len(check))
assert abc_ok == 1
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_bytes(out)
print("sha", hashlib.sha256(out).hexdigest())
print("uncomp", file_len, "size", len(out))
