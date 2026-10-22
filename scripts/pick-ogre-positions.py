"""Pick the nine wild-pet positions (OgreXMLInfo pList) for maps that have a server pool but no client entry.

The client shows wild pets only at OgreXMLInfo positions: slot i of MAP_OGRE_LIST stands at pList[i], and the server
fills random slots 0-8. A position is usable when its 10 px cell is walkable in type_mc (fully transparent pixel, as
MapModel.makeMapArray reads it), lies inside rect_mc and connects to the map's spawn point.

Usage:
  python3 -I scripts/pick-ogre-positions.py --client <live client root> --core <NieoCore.swf> --java <java>
      --ffdec <ffdec.jar> --maps 32,51,... --out positions.json --sheet <dir>
      [--spawn 550=200,1018] [--avoid 550=hit_0,glyNPCMc] [--box 411=0,360,960,500]
Spawn points and door hits come from the first MapConfig entry of each map (the one the client reads). Positions
avoid doors, the spawn point and the drawn NPCs, decorations and foreground; --box keeps a map's positions in a region.
"""
import argparse
import collections
import concurrent.futures
import heapq
import json
import os
import re
import struct
import subprocess
import tempfile
import zlib

from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
for name in ("client", "core", "java", "ffdec", "maps", "out", "sheet"):
    parser.add_argument("--" + name, required=True)
parser.add_argument("--spawn", action="append", default=[])
parser.add_argument("--avoid", action="append", default=[])
parser.add_argument("--box", action="append", default=[])
args = parser.parse_args()

GRID, COUNT, MAX_TRY = 10, 9, 1500
MAGENTA = (255, 0, 255)


# ==================== SWF ====================
def read_tags(data, offset):
    tags = []
    while offset < len(data):
        short = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        code, size = short >> 6, short & 63
        if size == 63:
            size = struct.unpack_from("<I", data, offset)[0]
            offset += 4
        tags.append((code, data[offset:offset + size]))
        offset += size
        if code == 0:
            break
    return tags


def read_swf(path):
    raw = open(path, "rb").read()
    body = zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw[8:]
    rect = (5 + (body[0] >> 3) * 4 + 7) // 8
    return raw[3], body[rect:rect + 2], read_tags(body, rect + 4)


def tag(code, payload):
    if len(payload) < 63:
        return struct.pack("<H", (code << 6) | len(payload)) + payload
    return struct.pack("<HI", (code << 6) | 63, len(payload)) + payload


def rect(width, height):
    values = (0, width * 20, 0, height * 20)
    n = max(v.bit_length() for v in values) + 1
    bits = format(n, "05b") + "".join(format(v, "0%db" % n) for v in values)
    bits += "0" * (-len(bits) % 8)
    return bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))


class Bits:
    def __init__(self, data, offset):
        self.data, self.pos = data, offset * 8

    def u(self, n):
        value = 0
        for _ in range(n):
            value = (value << 1) | ((self.data[self.pos >> 3] >> (7 - (self.pos & 7))) & 1)
            self.pos += 1
        return value

    def s(self, n):
        value = self.u(n)
        return value - (1 << n) if n and value >> (n - 1) else value

    def end(self):
        return (self.pos + 7) // 8


def read_matrix(data, offset):
    b = Bits(data, offset)
    m = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0]
    if b.u(1):
        n = b.u(5)
        m[0], m[1] = b.s(n) / 65536, b.s(n) / 65536
    if b.u(1):
        n = b.u(5)
        m[2], m[3] = b.s(n) / 65536, b.s(n) / 65536
    n = b.u(5)
    m[4], m[5] = b.s(n) / 20, b.s(n) / 20
    return m, b.end()


def place(code, payload):
    """(depth, character, matrix, matrix bytes, name) of a PlaceObject2/3 tag."""
    if code == 26:
        flags, depth, offset = payload[0], struct.unpack_from("<H", payload, 1)[0], 3
    else:
        flags, flags2, depth, offset = payload[0], payload[1], struct.unpack_from("<H", payload, 2)[0], 4
        if flags2 & 0x08 or (flags2 & 0x10 and flags & 0x02):
            offset = payload.index(0, offset) + 1
    char = matrix = raw_matrix = name = None
    if flags & 0x02:
        char = struct.unpack_from("<H", payload, offset)[0]
        offset += 2
    if flags & 0x04:
        start = offset
        matrix, offset = read_matrix(payload, offset)
        raw_matrix = payload[start:offset]
    if flags & 0x08:
        b = Bits(payload, offset)
        terms = b.u(1) + b.u(1)
        b.u(b.u(4) * 4 * terms)
        offset = b.end()
    if flags & 0x10:
        offset += 2
    if flags & 0x20:
        end = payload.index(0, offset)
        name = payload[offset:end].decode("utf-8", "replace")
    return depth, char, matrix, raw_matrix, name


CONTROL = {0, 1, 4, 5, 9, 12, 26, 28, 43, 59, 65, 70, 72, 76, 77, 82, 86}


def on_magenta(version, rate, tags, places, width, height, out):
    """A one-frame SWF on a magenta stage whose timeline holds only `places` (encoded PlaceObject tags)."""
    head = [tag(c, p) for c, p in tags if c == 69]
    defs = [tag(c, p) for c, p in tags if c not in CONTROL and c != 69]
    body = rect(width, height) + rate + struct.pack("<H", 1) + b"".join(
        head + [tag(9, bytes(MAGENTA))] + defs + places + [tag(1, b""), tag(0, b"")])
    open(out, "wb").write(b"FWS" + bytes([version]) + struct.pack("<I", len(body) + 8) + body)


def only_placed(version, rate, tags, char, raw_matrix, width, height, out):
    """Only `char`, without colour transform (identity matrix when raw_matrix is None)."""
    flags = 0x02 | (0x04 if raw_matrix else 0)
    po = bytes([flags]) + struct.pack("<HH", 1, char) + (raw_matrix or b"")
    on_magenta(version, rate, tags, [tag(26, po)], width, height, out)


def with_stage(version, rate, tags, width, height, out):
    body = rect(width, height) + rate + struct.pack("<H", 1) + b"".join(tag(c, p) for c, p in tags)
    open(out, "wb").write(b"FWS" + bytes([version]) + struct.pack("<I", len(body) + 8) + body)


def render(swf, work):
    outdir = os.path.join(work, os.path.basename(swf) + ".frames")
    subprocess.run([args.java, "-Djava.awt.headless=true", "-jar", args.ffdec, "-format", "frame:png", "-select", "1",
                    "-export", "frame", outdir, swf], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                   timeout=600)
    return Image.open(os.path.join(outdir, "1.png")).convert("RGB")


# ==================== 地图表 ====================
def core_xml(symbol):
    _, _, tags = read_swf(args.core)
    symbols, binaries = {}, {}
    for code, payload in tags:
        if code == 76:
            offset = 2
            for _ in range(struct.unpack_from("<H", payload, 0)[0]):
                tag_id = struct.unpack_from("<H", payload, offset)[0]
                end = payload.index(b"\0", offset + 2)
                symbols[payload[offset + 2:end].decode()] = tag_id
                offset = end + 1
        elif code == 87:
            binaries[struct.unpack_from("<H", payload, 0)[0]] = payload[6:]
    return binaries[symbols[symbol]].decode("utf-8")


map_xml = re.sub(r"<!--.*?-->", "", core_xml("com.robot.core.manager.map.config.MapConfig_xmlCls"), flags=re.S)
pairs = lambda options: {k: v for k, v in (o.split("=", 1) for o in options)}
spawn_override, avoid_names, boxes = pairs(args.spawn), pairs(args.avoid), pairs(args.box)


def map_entry(map_id):
    match = re.search(r'<map id="%s"[^>]*>.*?</map>' % map_id, map_xml, re.S)
    if not match:
        return [], []
    text = match.group(0)
    head = dict(re.findall(r'(\w+)="([^"]*)"', re.match(r"<map[^>]*>", text).group(0)))
    spawns = [(int(head["x"]), int(head["y"]))]
    spawns += [(int(float(x)), int(float(y))) for x, y in re.findall(r'PosX="([^"]+)"\s+PosY="([^"]+)"', text)]
    return spawns, re.findall(r'hit="([^"]+)"', text)


# ==================== 选点 ====================
def pick(map_id):
    rel = "resource/map/%s.swf" % map_id
    path = next(p for p in (os.path.join(args.client, d, rel) for d in ("overlay", "assets")) if os.path.exists(p))
    version, rate, tags = read_swf(path)
    top = [(place(c, p), c, p) for c, p in tags if c in (26, 70)]
    named = {info[4]: info for info, _, _ in top if info[4]}
    sprites = {struct.unpack_from("<H", p, 0)[0]: p for c, p in tags if c == 39}
    work = tempfile.mkdtemp(prefix="ogre-%s-" % map_id)

    # 地图尺寸取 rect_mc（MapModel 的 spaceLevel），没有就是 960×560
    width, height = 960, 560
    if "rect_mc" in named:
        _, char, _, raw_matrix, _ = named["rect_mc"]
        only_placed(version, rate, tags, char, raw_matrix, 4000, 3000, os.path.join(work, "rect.swf"))
        img = render(os.path.join(work, "rect.swf"), work)
        mask = Image.new("1", img.size)
        mask.putdata([px != MAGENTA for px in img.getdata()])
        width, height = mask.getbbox()[2:]
    _, type_char, _, _, _ = named["type_mc"]
    only_placed(version, rate, tags, type_char, None, width, height, os.path.join(work, "type.swf"))
    type_img = render(os.path.join(work, "type.swf"), work)
    gx, gy = width // GRID, height // GRID
    walk = [[type_img.getpixel((x * GRID + GRID // 2, y * GRID + GRID // 2)) == MAGENTA for y in range(gy)] for x in range(gx)]

    # 门、碰撞区和出生点
    spawns, hits = map_entry(map_id)
    if map_id in spawn_override:
        spawns = [tuple(int(v) for v in spawn_override[map_id].split(","))]
    marks = {}
    for layer in ("control_mc", "depth_mc"):
        info = named.get(layer)
        if not info or info[1] not in sprites:
            continue
        ox, oy = (info[2][4], info[2][5]) if info[2] else (0, 0)
        for code, payload in read_tags(sprites[info[1]], 4):
            if code in (26, 70):
                _, _, matrix, _, name = place(code, payload)
                if name and matrix:
                    marks[name] = (ox + matrix[4], oy + matrix[5])
    avoid = [(marks[h], 80) for h in hits if h in marks]
    avoid += [(marks[n], 80) for n in avoid_names.get(map_id, "").split(",") if n in marks]
    avoid += [(s, 60) for s in spawns]
    box = tuple(int(v) for v in boxes[map_id].split(",")) if map_id in boxes else (0, 0, width, height)

    # 人物、装饰和前景（control/depth/top/button 层）：精灵身体（脚下往上 70 px、左右各 25 px）尽量别压上去
    layers = [tag(c, p) for info, c, p in top if info[4] in ("control_mc", "depth_mc", "top_mc", "buttonLevel")]
    on_magenta(version, rate, tags, layers, width, height, os.path.join(work, "objects.swf"))
    objects = render(os.path.join(work, "objects.swf"), work)
    pixels = objects.load()
    total = [[0] * (width + 1) for _ in range(height + 1)]
    for y in range(height):
        row, above, run = total[y + 1], total[y], 0
        for x in range(width):
            r, g, b = pixels[x, y]
            run += not (abs(r - b) <= 12 and g * 3 <= r)  # 透出洋红（含整图半透明暗色层）算空地
            row[x + 1] = above[x + 1] + run

    def covered(cell):
        px, py = cell[0] * GRID + GRID // 2, cell[1] * GRID + GRID // 2
        x0, x1, y0, y1 = max(0, px - 25), min(width, px + 25), max(0, py - 70), py
        return (total[y1][x1] - total[y0][x1] - total[y1][x0] + total[y0][x0]) / ((x1 - x0) * (y1 - y0))

    def neighbours(x, y):
        for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)):
            if 0 <= x + dx < gx and 0 <= y + dy < gy and walk[x + dx][y + dy]:
                yield x + dx, y + dy, 10
        for dx, dy in ((1, -1), (1, 1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < gx and 0 <= ny < gy and walk[nx][ny] and walk[x + dx][y] and walk[x][y + dy]:
                yield nx, ny, 14

    def nearest_walkable(point):
        cx, cy = min(int(point[0]) // GRID, gx - 1), min(int(point[1]) // GRID, gy - 1)
        best = min(((x - cx) ** 2 + (y - cy) ** 2, x, y) for x in range(gx) for y in range(gy) if walk[x][y])
        return best[1], best[2]

    start = nearest_walkable(spawns[0])
    seen, queue = {start}, collections.deque([start])
    while queue:
        x, y = queue.popleft()
        for nx, ny, _ in neighbours(x, y):
            if (nx, ny) not in seen:
                seen.add((nx, ny))
                queue.append((nx, ny))
    clearance = {}
    queue = collections.deque()
    for x in range(gx):
        for y in range(gy):
            if not walk[x][y] or x in (0, gx - 1) or y in (0, gy - 1):
                clearance[(x, y)] = 0
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                key = (x + dx, y + dy)
                if 0 <= key[0] < gx and 0 <= key[1] < gy and key not in clearance:
                    clearance[key] = clearance[(x, y)] + 1
                    queue.append(key)

    def center(cell):
        return cell[0] * GRID + GRID // 2, cell[1] * GRID + GRID // 2

    def allowed(cell, need):
        px, py = center(cell)
        # 原版位置在 y 110–485 之间：再低会被底部工具栏挡住，再高精灵头顶出画
        return (clearance[cell] >= need and 100 <= py <= height - 75 and 60 <= px <= width - 60
                and box[0] <= px <= box[2] and box[1] <= py <= box[3]
                and all((px - a[0]) ** 2 + (py - a[1]) ** 2 >= r * r for a, r in avoid))

    candidates = []
    for cover in (0.05, 0.15, 0.4, 1.01):
        for need in (3, 2, 1):
            candidates = [c for c in seen if allowed(c, need) and covered(c) <= cover]
            if len(candidates) >= 4 * COUNT:
                break
        if len(candidates) >= 4 * COUNT:
            break
    assert len(candidates) >= COUNT, "Map %s has only %d candidate cells" % (map_id, len(candidates))
    mx = sum(c[0] for c in candidates) / len(candidates)
    my = sum(c[1] for c in candidates) / len(candidates)
    chosen = [min(candidates, key=lambda c: (c[0] - mx) ** 2 + (c[1] - my) ** 2)]
    while len(chosen) < COUNT:
        chosen.append(max(candidates, key=lambda c: min((c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 for p in chosen)))

    # 客户端 AStar：f = g + 曼哈顿×10，最多展开 1500 次
    def tries(src, dst):
        g, heap, closed, count = {src: 0}, [(0, src)], set(), 0
        while heap:
            _, cell = heapq.heappop(heap)
            if cell in closed:
                continue
            count += 1
            if count > MAX_TRY:
                return None
            if cell == dst:
                return count
            closed.add(cell)
            for nx, ny, cost in neighbours(*cell):
                ng = g[cell] + cost
                if (nx, ny) not in closed and ng < g.get((nx, ny), 1 << 30):
                    g[(nx, ny)] = ng
                    heapq.heappush(heap, (ng + (abs(dst[0] - nx) + abs(dst[1] - ny)) * 10, (nx, ny)))
        return None

    positions = [center(c) for c in chosen]
    reach = [tries(start, c) for c in chosen]

    # 复核图：完整地图、不可走格子、出生点（绿）、门（红）、选中的位置（黄，编号即槽位）
    with_stage(version, rate, tags, width, height, os.path.join(work, "full.swf"))
    full = render(os.path.join(work, "full.swf"), work).convert("RGBA")
    shade = Image.new("RGBA", full.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shade)
    for x in range(gx):
        for y in range(gy):
            if not walk[x][y]:
                draw.rectangle([x * GRID, y * GRID, x * GRID + GRID - 1, y * GRID + GRID - 1], fill=(255, 0, 0, 70))
            elif (x, y) not in seen:
                draw.rectangle([x * GRID, y * GRID, x * GRID + GRID - 1, y * GRID + GRID - 1], fill=(0, 0, 255, 70))
    for (px, py), r in avoid:
        draw.ellipse([px - r, py - r, px + r, py + r], outline=(255, 60, 60, 255), width=2)
    for px, py in spawns:
        draw.ellipse([px - 8, py - 8, px + 8, py + 8], fill=(0, 255, 0, 255))
    for i, (px, py) in enumerate(positions):
        draw.ellipse([px - 9, py - 9, px + 9, py + 9], fill=(255, 220, 0, 255), outline=(0, 0, 0, 255))
        draw.text((px - 3, py - 6), str(i), fill=(0, 0, 0, 255))
    os.makedirs(args.sheet, exist_ok=True)
    Image.alpha_composite(full, shade).convert("RGB").save(os.path.join(args.sheet, "%s.png" % map_id))
    return map_id, {"size": [width, height], "spawns": spawns, "positions": positions, "aStarExpansions": reach,
                    "clearanceCells": need, "maxCovered": cover}


ids = args.maps.split(",")
with concurrent.futures.ThreadPoolExecutor(4) as pool:
    result = dict(pool.map(pick, ids))
open(args.out, "w", encoding="utf-8").write(json.dumps({k: result[k] for k in ids}, ensure_ascii=False, indent=2) + "\n")
for k in ids:
    print(k, result[k]["size"], result[k]["positions"], result[k]["aStarExpansions"])
