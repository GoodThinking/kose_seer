"""Restore PetBookXMLInfo Foundin text in NieoCore.swf from an original Core, only where it now names removed
lab exchange. All other SWF tags are copied byte-for-byte.
Usage: python3 -I scripts/restore-dex-foundin.py <original Core> <current Core> <out Core>"""
import re, struct, sys, zlib
SYMBOL = "com.robot.core.config.xml.PetBookXMLInfo_xmlClass"

def split(path):
    raw = open(path, "rb").read()
    assert raw[:3] == b"CWS", "expected zlib SWF"
    body = zlib.decompress(raw[8:])
    head = ((5 + (body[0] >> 3) * 4) + 7) // 8 + 4
    tags, offset = [], head
    while offset < len(body):
        start = offset
        short = struct.unpack_from("<H", body, offset)[0]; offset += 2
        code, size = short >> 6, short & 63
        if size == 63: size = struct.unpack_from("<I", body, offset)[0]; offset += 4
        tags.append([code, body[offset:offset + size], body[start:offset + size]])
        offset += size
        if code == 0: break
    return raw[:8], body[:head], tags

def symbol_tag(tags):
    for code, payload, _ in tags:
        if code == 76:
            index = 2
            for _ in range(struct.unpack_from("<H", payload, 0)[0]):
                tag_id = struct.unpack_from("<H", payload, index)[0]
                end = payload.index(b"\0", index + 2)
                if payload[index + 2:end].decode() == SYMBOL: return tag_id
                index = end + 1
    raise SystemExit("symbol not found")

def dex_index(tags, tag_id):
    for i, (code, payload, _) in enumerate(tags):
        if code == 87 and struct.unpack_from("<H", payload, 0)[0] == tag_id: return i
    raise SystemExit("binary tag not found")

def foundin(xml):
    return {m.group(1): m.group(2) for m in re.finditer(r'<Monster\b[^>]*?\bID="(\d+)"[^>]*?\bFoundin="([^"]*)"', xml)}

_, _, otags = split(sys.argv[1]); orig = foundin(otags[dex_index(otags, symbol_tag(otags))][1][6:].decode("utf-8"))
header, rect, tags = split(sys.argv[2]); i = dex_index(tags, symbol_tag(tags))
payload = tags[i][1]; xml = payload[6:].decode("utf-8")
changed = []
def fix(m):
    tag = m.group(0); pid = re.search(r'\bID="(\d+)"', tag).group(1)
    cur = re.search(r'\bFoundin="([^"]*)"', tag)
    if cur and cur.group(1).startswith("实验室兑换") and pid in orig and orig[pid] != cur.group(1):
        changed.append((pid, cur.group(1), orig[pid]))
        return tag[:cur.start(1)] + orig[pid] + tag[cur.end(1):]
    return tag
xml2 = re.sub(r"<Monster\b[^>]*>", fix, xml)
newp = payload[:6] + xml2.encode("utf-8")
tagbytes = struct.pack("<HI", (87 << 6) | 63, len(newp)) + newp
body = rect + b"".join(tagbytes if j == i else t[2] for j, t in enumerate(tags))
out = header[:4] + struct.pack("<I", 8 + len(body)) + zlib.compress(body, 9)
open(sys.argv[3], "wb").write(out)
for c in changed: print("\t".join(c))
print("restored", len(changed), file=sys.stderr)
