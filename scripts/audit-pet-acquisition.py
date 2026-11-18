"""Static pet acquisition coverage for the deployed dex, configs and server code.

Usage:
  python3 -I scripts/audit-pet-acquisition.py --core NieoCore.swf --app <captured app root> --out <dir>
      [--wild wild-additions.json] [--exchange-plan <resource-tree.json> <local-resource-list>]

Missing means no path linked by this model. A wild pool counts only on a registered map with enough
OgreXMLInfo positions (nine normally, four for original-universe maps); bosses are assumed reachable.
--wild evaluates planned encounters before release; --exchange-plan prints the smallest exchange list that
closes the remaining gaps, limited to pets whose battle and head resources exist.
"""
import argparse
import collections
import csv
import json
import os
import re
import struct
import subprocess
import zlib

parser = argparse.ArgumentParser()
parser.add_argument("--core", required=True)
parser.add_argument("--app", required=True)
parser.add_argument("--out", required=True)
parser.add_argument("--wild")
parser.add_argument("--exchange-plan", nargs=2, metavar=("TREE", "LOCAL"))
args = parser.parse_args()
app = lambda *p: os.path.join(args.app, *p)
read = lambda *p: open(app(*p), encoding="utf-8").read()
attrs = lambda tag: dict(re.findall(r'(\w+)="([^"]*)"', tag))


def core_xml(symbol):
    raw = open(args.core, "rb").read()
    body = zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw[8:]
    offset, symbols, binaries = ((5 + (body[0] >> 3) * 4) + 7) // 8 + 4, {}, {}
    while offset < len(body):
        short = struct.unpack_from("<H", body, offset)[0]
        offset += 2
        code, size = short >> 6, short & 63
        if size == 63:
            size = struct.unpack_from("<I", body, offset)[0]
            offset += 4
        payload = body[offset:offset + size]
        offset += size
        if code == 76:
            index = 2
            for _ in range(struct.unpack_from("<H", payload, 0)[0]):
                tag_id = struct.unpack_from("<H", payload, index)[0]
                end = payload.index(b"\0", index + 2)
                symbols[payload[index + 2:end].decode()] = tag_id
                index = end + 1
        elif code == 87:
            binaries[struct.unpack_from("<H", payload, 0)[0]] = payload[6:]
        elif code == 0:
            break
    return binaries[symbols[symbol]].decode("utf-8")


dex = {int(a["ID"]): a for a in map(attrs, re.findall(r"<Monster\b[^>]*>",
                                                       core_xml("com.robot.core.config.xml.PetBookXMLInfo_xmlClass"), re.S))}
pets = {int(a["ID"]): a for a in map(attrs, re.findall(r"<Monster\b[^>]*>", read("config/data/xml/pets.xml"), re.S))}
items = {int(a["ID"]): a for a in map(attrs, re.findall(r"<Item\b[^>]*>", read("config/data/xml/items.xml"), re.S))}
num = lambda pid, key: int(pets.get(pid, {}).get(key) or 0)
load = lambda name: json.loads(read("config/data/json", name))


def numbers(pattern, text):
    match = re.search(pattern, text)
    return [int(x) for x in re.findall(r"\d+", match.group(1))] if match else []


map_table = core_xml("com.robot.core.manager.map.config.MapConfig_xmlCls")
registered = set(re.findall(r'<map id="(\d+)"', map_table))
ogre_table = core_xml("com.robot.core.config.xml.OgreXMLInfo_xmlClass")
ogre_section = ogre_table[ogre_table.index("<ogre>"):ogre_table.index("</ogre>")]
drawn = {i for i, p in re.findall(r'<item id="(\d+)" pList="([^"]*)"', ogre_section)
         if len(p.split("|")) >= (4 if 9700 <= int(i) <= 9794 else 9)}


def base_sources(extra_wild=(), extra_exchange=()):
    sources, item_sources = collections.defaultdict(set), collections.defaultdict(set)
    give = lambda pid, label: sources[int(pid)].add(label)
    give_item = lambda iid, label: item_sources[int(iid)].add(label)
    for map_id, entry in load("map-ogres.json")["maps"].items():
        shown = (map_id in registered and map_id in drawn and entry.get("spawnCount", 0) > 0
                 and entry.get("spawnProbability", 1) > 0)
        for ogre in entry.get("ogres", []):
            if (shown and ogre.get("catchable", True) and not ogre.get("isBoss")
                    and ogre.get("weight", 1) > 0 and ogre.get("refreshConfig", {}).get("enabled")):
                give(ogre["petId"], "野外:%s" % map_id)
            for drop in ogre.get("dropItems", []):
                give_item(drop["itemId"], "野怪掉落:%s" % map_id)
    for entry in extra_wild:
        give(entry["petId"], "计划野外:%s" % entry["mapId"])
    for boss in load("boss_abilities.json")["bossConfigs"]:
        where = "%s/%s" % (boss["mapId"], boss["param2"])
        spt = boss.get("spt")
        if not spt:
            if boss.get("catchable", True):
                give(boss["petId"], "Boss捕捉:" + where)
        else:
            if spt.get("rewardPetId"):
                give(spt["rewardPetId"], "Boss奖励:" + where)
            if spt.get("rewardItemId"):
                give_item(spt["rewardItemId"], "Boss奖励:" + where)
        for drop in boss.get("drops", []):
            give_item(drop["itemId"], "Boss掉落:" + where)
    acquisition = load("pet-acquisition.json")
    for d in acquisition.get("disguises", []):
        give(d["petId"], "变身遭遇")
    for m in acquisition.get("mechanisms", []):
        give(m["petId"], "机关:%s" % m["mapId"])
    for pid in list(acquisition.get("exchange", {}).get("petIds", [])) + list(extra_exchange):
        give(pid, "实验室兑换")
    arena_file = app("dist/GameServer/Game/Battle/StarArenaCatalog.json")
    if os.path.exists(arena_file):
        for arena in json.load(open(arena_file, encoding="utf-8")).get("arenas", []):
            if arena.get("rewardPetId"):
                give(arena["rewardPetId"], "星系擂台:%s" % arena.get("name", arena.get("id")))
    for task_id, task in load("tasks.json")["tasks"].items():
        rewards = task.get("rewards") or {}
        for reward in rewards.get("pets", []):
            give(reward["petId"], "任务:%s" % task_id)
        for reward in rewards.get("items", []):
            give_item(reward.get("itemId", reward.get("id", 0)), "任务:%s" % task_id)
    for iid in range(400001, 400041):
        if iid != 400013:
            give_item(iid, "材料来源")
    for reward in load("gacha_rewards.json"):
        give_item(reward["itemID"], "扭蛋")
    for iid in set(re.findall(r'"itemId"\s*:\s*(\d+)', read("config/data/json/mining.json"))):
        give_item(iid, "采集")
    for name in ("shop.json", "money-products.json"):
        for iid in set(re.findall(r'"(?:itemId|itemID|id)"\s*:\s*(\d+)', read("config/data/json", name))):
            give_item(iid, "商店")
    for iid in re.findall(r"itemId:\s*(\d+)", read("dist/GameServer/Game/Map/GameplayRewards.js")):
        give_item(iid, "首胜精元")
    collect = read("dist/GameServer/Game/Pet/CollectReward.js")
    for ids in re.findall(r"rewardIds:\s*\[([\d,\s]+)\]", collect):
        for pid in re.findall(r"\d+", ids):
            give(pid, "收集奖励")
    plans_file = app("config/data/json/collect-plans.json")
    if os.path.exists(plans_file):
        for plan in load("collect-plans.json")["plans"]:
            for pid in plan["rewards"]:
                give(pid, "收集计划:%s" % plan["id"])
    for pid in numbers(r"STARTER_IDS\s*=\s*\[([\d,\s]+)\]", read("dist/GameServer/Game/Battle/FreshTower.js")):
        give(pid, "试炼之塔")
    for pid in (1, 4, 7):
        give(pid, "初始精灵")
    if os.path.exists(app("config/data/json/universe.json")):
        universe = load("universe.json")
        scenes = {scene["key"]: scene for scene in universe["scenes"]}
        if universe.get("publishable"):
            for encounter in universe["encounters"]:
                scene = scenes.get(encounter["scene"], {})
                if (encounter["kind"] != "fusionOnly" and scene.get("resourceBuilt")
                        and str(scene.get("mapId")) in registered):
                    give(encounter["petId"], "远航遭遇:%s/%s" % (scene["mapId"], encounter["id"]))
    if os.path.exists(app("config/data/json/sea_vortex.json")):
        rescue = load("sea_vortex.json")
        if str(rescue["mapId"]) in registered:
            for reward in rescue["rewards"]:
                if reward.get("weight", 0) <= 0:
                    continue
                if reward.get("petId"):
                    give(reward["petId"], "深海救援:%s" % rescue["mapId"])
                if reward.get("itemId"):
                    give_item(reward["itemId"], "深海救援:%s" % rescue["mapId"])
    if os.path.exists(app("config/data/json/story_encounters.json")):
        for encounter in load("story_encounters.json"):
            if encounter.get("capture") and str(encounter["mapId"]) in registered:
                give(encounter["petId"], "原生特殊遭遇:%s/%s" % (encounter["mapId"], encounter["region"]))
    return sources, item_sources


fusion_script = r"""
const fs = require('node:fs'), vm = require('node:vm');
const text = fs.readFileSync(process.argv[1], 'utf8');
const start = text.indexOf('const RECIPES = ['), end = text.indexOf('function petConfig(');
if (start < 0 || end < start) throw Error('Unknown fusion rule layout');
process.stdout.write(JSON.stringify(vm.runInNewContext(
    text.slice(start, end) + ';({RECIPES,MIRACLES,NEIL})', {}, {timeout:1000})));
"""
fusion = json.loads(subprocess.run(
    ["node", "-e", fusion_script, app("dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js")],
    check=True, capture_output=True, text=True).stdout)
recipes = [{"main": recipe["main"], "sub": recipe["sub"], "essence": recipe["essence"],
            "outs": [recipe["pet"]] + ([recipe["rare"]["pet"]] if recipe.get("rare") else [])}
           for recipe in fusion["RECIPES"]]
branches = load("special-evolutions.json")["branches"]


def closure(extra_wild=(), extra_exchange=()):
    sources, item_sources = base_sources(extra_wild, extra_exchange)
    have, changed = set(sources), True
    while changed:
        changed = False
        found = []
        for iid in item_sources:
            breed = int(items.get(iid, {}).get("BreedMonID") or 0)
            if breed:
                found.append((breed, "精元孵化:%d" % iid))
        for pid in have:
            flag, target = num(pid, "EvolvFlag"), num(pid, "EvolvesTo")
            if flag == 0 and target:
                found.append((target, "等级进化:%d" % pid))
            for branch in branches.get(str(flag), []) if flag else []:
                if not branch["itemId"] or branch["itemId"] in item_sources:
                    found.append((branch["petId"], "特殊进化:%d" % pid))
        for recipe in recipes:
            if any(p in have for p in recipe["main"]) and any(p in have for p in recipe["sub"]) and recipe["essence"] in item_sources:
                found.extend((out, "融合") for out in recipe["outs"])
        for recipe in fusion["MIRACLES"]:
            if (recipe["main"] in have and recipe["essence"] in item_sources
                    and any(num(pid, "Type") == recipe["type"] or pid in fusion["NEIL"] for pid in have)):
                found.extend((pid, "奇迹融合:%d" % recipe["main"]) for pid, weight in recipe["weights"] if weight > 0)
        for pid, label in found:
            sources[pid].add(label)
            if pid not in have:
                have.add(pid)
                changed = True
    return have, sources, item_sources


def base_of(pid):
    seen = set()
    while num(pid, "EvolvesFrom") and pid not in seen:
        seen.add(pid)
        pid = num(pid, "EvolvesFrom")
    return pid


def reason(pid, have, item_sources):
    previous = num(pid, "EvolvesFrom")
    if previous:
        if previous not in have:
            return "前置形态不可得"
        flag = num(previous, "EvolvFlag")
        if flag and not branches.get(str(flag)):
            return "进化条件未实现(EvolvFlag=%d)" % flag
        for branch in branches.get(str(flag), []):
            if branch["petId"] == pid and branch["itemId"] and branch["itemId"] not in item_sources:
                return "进化材料无来源(%d)" % branch["itemId"]
        return "进化路径未连通"
    if any(pid in recipe["outs"] for recipe in recipes):
        return "融合亲本不可得"
    return "基础形态无来源"


wild = json.load(open(args.wild, encoding="utf-8"))["additions"] if args.wild else []
have, sources, item_sources = closure(wild)
rows = [{"id": pid, "name": d.get("DefName", ""), "type": d.get("Type", ""), "dexFoundin": d.get("Foundin", ""),
         "baseForm": base_of(pid), "status": "可获得" if pid in have else "缺失",
         "sources": " | ".join(sorted(sources.get(pid, []))), "reason": "" if pid in have else reason(pid, have, item_sources)}
        for pid, d in sorted(dex.items())]
os.makedirs(args.out, exist_ok=True)
with open(os.path.join(args.out, "coverage.csv"), "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
missing = [r for r in rows if r["status"] == "缺失"]
summary = {"dexEntries": len(rows), "obtainable": len(rows) - len(missing), "missing": len(missing),
           "missingByReason": dict(collections.Counter(re.sub(r"\(.*", "", r["reason"]) for r in missing)),
           "plannedWildAdditions": len(wild), "fusionRecipes": len(recipes)}

if args.exchange_plan:
    tree_path, local_path = args.exchange_plan
    available = {e["path"][len("gameres/root/"):] for e in json.load(open(tree_path))["tree"] if e["type"] == "blob"}
    available |= {line.strip() for line in open(local_path) if line.strip()}
    ready = lambda pid: {"resource/fightResource/pet/swf/%d.swf" % pid, "resource/pet/head/%d.swf" % pid} <= available
    exchange, blocked = [], []
    # Base forms first so their evolutions arrive by levelling; then forms no evolution or fusion reaches.
    for stage in ("base", "rest"):
        for pid in sorted(dex):
            if pid in have or (stage == "base" and num(pid, "EvolvesFrom") and num(pid, "EvolvesFrom") in dex):
                continue
            if not ready(pid) or pid not in pets:
                blocked.append(pid)
                continue
            exchange.append(pid)
        have, sources, item_sources = closure(wild, exchange)
    blocked = sorted(set(p for p in blocked if p not in have))
    summary.update({"exchangePets": len(exchange), "missingAfterExchange": len([p for p in dex if p not in have]),
                    "blockedWithoutResources": len(blocked)})
    json.dump({"exchange": exchange, "blocked": blocked}, open(os.path.join(args.out, "exchange-plan.json"), "w"), indent=1)
json.dump(summary, open(os.path.join(args.out, "summary.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(json.dumps(summary, ensure_ascii=False, indent=2))
