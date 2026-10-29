#!/usr/bin/env python3
"""Add missing reference planet art to the current Rog galaxy without replacing its code."""

import argparse
import copy
import hashlib
import json
import re
import struct
import subprocess
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path


CURRENT_GALAXY_SHA256 = '5f3adc7b862c751f069da06c61832d0610595fbd5545aada273491fd8e783e6e'
REFERENCE_GALAXY_SHA256 = '0e2dd5ef4157aeb3475aeed9564865ed766efdc2ee54ff5cf2c4e114d429893f'
REFERENCE_INTRO_SHA256 = 'd2dcc973970daa3a467b0f8dea4d8ba4d81f4430a558ade66682d04f3ce7d5c4'
REFERENCE_IDS = (5, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36)
PLANETS = ((439, 24, 850, '海兹尔星'), (441, 27, 975, '拉铂尔星'),
           (459, 30, 1100, '菲尔纳星'), (481, 36, 1225, '般若星'))
TRANSLATION = str.maketrans({'茲': '兹', '鉑': '铂', '爾': '尔', '倫': '伦',
                            '納': '纳', '裡': '里', '羅': '罗', '達': '达'})


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_checked(path, expected):
    data = Path(path).read_bytes()
    require(digest(data) == expected, f'Unexpected input SHA256: {path}')
    return data


def parse_swf(raw):
    require(raw[:3] in (b'CWS', b'FWS'), 'Unsupported SWF compression')
    body = zlib.decompress(raw[8:]) if raw[:3] == b'CWS' else raw[8:]
    require(len(body) + 8 == struct.unpack_from('<I', raw, 4)[0], 'Invalid SWF length')
    pos = (5 + (body[0] >> 3) * 4 + 7) // 8 + 4
    header = body[:pos]
    tags = []
    while pos < len(body):
        start = pos
        short = struct.unpack_from('<H', body, pos)[0]
        pos += 2
        code, size = short >> 6, short & 63
        if size == 63:
            size = struct.unpack_from('<I', body, pos)[0]
            pos += 4
        require(pos + size <= len(body), 'Truncated SWF tag')
        payload = body[pos:pos + size]
        pos += size
        tags.append((code, payload, body[start:pos]))
        if code == 0:
            break
    require(pos == len(body) and tags[-1][0] == 0, 'Invalid SWF tag stream')
    return raw[:8], header, tags


def make_tag(code, payload):
    return (code, payload, struct.pack('<HI', (code << 6) | 63, len(payload)) + payload)


def encode_swf(prefix, header, tags):
    body = header + b''.join(tag[2] for tag in tags)
    prefix = prefix[:4] + struct.pack('<I', len(body) + 8)
    return prefix + (zlib.compress(body, 9) if prefix[:3] == b'CWS' else body)


def symbol_id(tags, expected):
    found = []
    for code, payload, _ in tags:
        if code != 76:
            continue
        count = struct.unpack_from('<H', payload)[0]
        pos = 2
        for _ in range(count):
            character_id = struct.unpack_from('<H', payload, pos)[0]
            pos += 2
            end = payload.index(b'\0', pos)
            if payload[pos:end].decode('utf-8') == expected:
                found.append(character_id)
            pos = end + 1
        require(pos == len(payload), 'Invalid symbol table')
    require(len(found) == 1, f'Missing or duplicate symbol: {expected}')
    return found[0]


def binary_tag(tags, character_id):
    found = [i for i, (code, payload, _) in enumerate(tags)
             if code == 87 and struct.unpack_from('<H', payload)[0] == character_id]
    require(len(found) == 1, f'Missing or duplicate binary character: {character_id}')
    return found[0]


def append_before(text, ending, content):
    match = re.search(re.escape(ending) + r'\s*$', text)
    require(match is not None, f'Missing XML root ending: {ending}')
    return text[:match.start()] + content + '\n' + text[match.start():]


def patch_core(raw, intro_reference):
    prefix, header, tags = parse_swf(raw)
    original_tags = tags[:]
    intro_id = symbol_id(tags, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass')
    super_id = symbol_id(tags, 'com.robot.core.config.xml.SuperMapXMLInfo_xmlClass')
    intro_index, super_index = binary_tag(tags, intro_id), binary_tag(tags, super_id)
    reference_tags = parse_swf(intro_reference)[2]
    reference_index = binary_tag(reference_tags, 49)
    reference_xml = ET.fromstring(reference_tags[reference_index][1][6:])
    intro = tags[intro_index][1][6:].decode('utf-8')
    super_maps = tags[super_index][1][6:].decode('utf-8')
    intro_lines, super_lines = [], []
    for planet, _, x, name in PLANETS:
        require(not re.search(r'<map\b[^>]*\bid="' + str(planet) + r'"', intro),
                f'Existing intro needs reconciliation: {planet}')
        require(not re.search(r'<maps\b[^>]*\bid="' + str(planet) + r'"', super_maps),
                f'Existing super map needs reconciliation: {planet}')
        entries = [node for node in reference_xml if node.get('id') == str(planet)]
        require(len(entries) == 1, f'Missing reference intro: {planet}')
        entry = copy.deepcopy(entries[0])
        for node in entry.iter():
            node.attrib.update({key: value.translate(TRANSLATION) for key, value in node.attrib.items()})
        require(entry.get('des') == name, f'Unexpected reference planet name: {planet}')
        # These reference-only clues have no verified route in the current project.
        if planet == 459:
            sprites = entry.find('sprite')
            require(sprites is not None and sprites.get('petIDs') == '克里|克罗达|德普',
                    'Reconcile reference 菲尔纳星 creatures')
            sprites.set('petIDs', '克里|克罗达')
        intro_lines.append(ET.tostring(entry, encoding='unicode').strip())
        super_lines.append(f'<maps id="{planet}" name="{name}" galaxy="3" x="{x + 25}" y="65"/>')
    intro = append_before(intro, '</map>', '\n'.join(intro_lines))
    super_maps = append_before(super_maps, '</superMaps>', '\n'.join(super_lines))
    ET.fromstring(intro)
    ET.fromstring(super_maps)
    for index, xml in ((intro_index, intro), (super_index, super_maps)):
        tags[index] = make_tag(87, original_tags[index][1][:6] + xml.encode('utf-8'))
    require(all(tag[2] == original_tags[i][2] for i, tag in enumerate(tags)
                if i not in (intro_index, super_index)), 'Unrelated Core tags changed')
    return encode_swf(prefix, header, tags)


def character_id(element):
    for field in ('shapeId', 'spriteId', 'buttonId'):
        if field in element.attrib:
            return int(element.get(field))
    return None


def run_ffdec(java, ffdec, *args):
    subprocess.run([java, '-Xmx1024m', '-XX:ActiveProcessorCount=2',
                    '-Djava.awt.headless=true', '-jar', ffdec, *map(str, args)],
                   check=True, timeout=120)


def patch_galaxy(current_raw, reference_raw, current_path, reference_path, compiler, java, ffdec):
    current_xml, reference_xml = compiler / 'current.xml', compiler / 'reference.xml'
    run_ffdec(java, ffdec, '-swf2xml', current_path, current_xml)
    run_ffdec(java, ffdec, '-swf2xml', reference_path, reference_xml)
    current = ET.parse(current_xml)
    reference = ET.parse(reference_xml)
    current_tags = current.getroot().find('tags')
    reference_tags = reference.getroot().find('tags')
    current_ids = [character_id(tag) for tag in current_tags if character_id(tag) is not None]
    require(max(current_ids) == 59 and len(current_ids) == len(set(current_ids)),
            'Unexpected current galaxy character inventory')
    remap = {old: 60 + index for index, old in enumerate(REFERENCE_IDS)}
    sprite = next((tag for tag in current_tags if tag.get('type') == 'DefineSpriteTag'
                   and tag.get('spriteId') == '59'), None)
    ref_sprite = next((tag for tag in reference_tags if tag.get('type') == 'DefineSpriteTag'
                       and tag.get('spriteId') == '41'), None)
    require(sprite is not None and ref_sprite is not None, 'Missing galaxy timeline')
    insert_at = list(current_tags).index(sprite)
    for old_id in REFERENCE_IDS:
        matching = [tag for tag in reference_tags if character_id(tag) == old_id]
        require(len(matching) == 1, f'Missing reference graphic: {old_id}')
        graphic = copy.deepcopy(matching[0])
        for node in graphic.iter():
            require(not any(field in node.attrib for field in ('bitmapId', 'fontId', 'soundId')),
                    f'Unexpected external graphic dependency: {old_id}')
            for field in ('shapeId', 'spriteId', 'buttonId', 'characterId'):
                if field in node.attrib:
                    old_ref = int(node.get(field))
                    require(old_ref in remap, f'Unmapped reference: {old_id} -> {old_ref}')
                    node.set(field, str(remap[old_ref]))
        current_tags.insert(insert_at, graphic)
        insert_at += 1
    frames = sprite.find('subTags')
    reference_frames = ref_sprite.find('subTags')
    require(frames[-1].get('type') == 'ShowFrameTag', 'Unexpected galaxy timeline')
    hot_template = next((tag for tag in frames if tag.get('name') == 'hotMC_437'), None)
    require(hot_template is not None and hot_template.get('characterId') == '24', 'Missing hot marker')
    for index, (planet, button, x, _) in enumerate(PLANETS):
        name = f'plantBtn_{planet}'
        originals = [tag for tag in reference_frames if tag.get('name') == name]
        require(len(originals) == 1 and originals[0].get('characterId') == str(button),
                f'Missing reference button: {planet}')
        require(not any(tag.get('name') in (name, f'hotMC_{planet}') for tag in frames),
                f'Planet already exists: {planet}')
        hot = copy.deepcopy(hot_template)
        hot.set('name', f'hotMC_{planet}')
        hot.set('depth', str(101 + index * 10))
        matrix = hot.find('matrix')
        matrix.set('translateX', str((x + 37) * 20))
        matrix.set('nTranslateBits', '16')
        planet_button = copy.deepcopy(originals[0])
        planet_button.set('characterId', str(remap[button]))
        planet_button.set('depth', str(102 + index * 10))
        matrix = planet_button.find('matrix')
        matrix.set('translateX', str(x * 20))
        matrix.set('translateY', '1600')
        matrix.set('nTranslateBits', '16')
        frames.insert(len(frames) - 1, hot)
        frames.insert(len(frames) - 1, planet_button)
    modified_xml, converted = compiler / 'modified.xml', compiler / 'converted.swf'
    current.write(modified_xml, encoding='utf-8', xml_declaration=True)
    run_ffdec(java, ffdec, '-xml2swf', modified_xml, converted)
    generated = parse_swf(converted.read_bytes())[2]
    prefix, header, original = parse_swf(current_raw)
    desired = set(remap.values())
    definitions = {struct.unpack_from('<H', payload)[0]: (code, payload, raw)
                   for code, payload, raw in generated if code in (2, 22, 32, 34, 39, 83)
                   and struct.unpack_from('<H', payload)[0] in desired}
    require(set(definitions) == desired, 'Compiled galaxy graphics incomplete')
    compiled_sprite = [tag for tag in generated if tag[0] == 39
                       and struct.unpack_from('<H', tag[1])[0] == 59]
    require(len(compiled_sprite) == 1, 'Missing compiled galaxy timeline')
    result = []
    replaced = False
    for tag in original:
        if tag[0] == 39 and struct.unpack_from('<H', tag[1])[0] == 59:
            require(not replaced, 'Duplicate current galaxy timeline')
            result.extend(definitions[remap[old]] for old in REFERENCE_IDS)
            result.append(compiled_sprite[0])
            replaced = True
        else:
            result.append(tag)
    require(replaced, 'Missing current galaxy timeline')
    return encode_swf(prefix, header, result)


def main():
    parser = argparse.ArgumentParser()
    for name in ('galaxy', 'reference-galaxy', 'intro-galaxy', 'core', 'core-sha256',
                 'out', 'java', 'ffdec'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    current = read_checked(args.galaxy, CURRENT_GALAXY_SHA256)
    reference = read_checked(args.reference_galaxy, REFERENCE_GALAXY_SHA256)
    intro_reference = read_checked(args.intro_galaxy, REFERENCE_INTRO_SHA256)
    core = read_checked(args.core, args.core_sha256)
    output = Path(args.out)
    output.mkdir(parents=True, exist_ok=False)
    compiler = output / 'compiler'
    compiler.mkdir()
    galaxy = patch_galaxy(current, reference, args.galaxy, args.reference_galaxy,
                          compiler, args.java, args.ffdec)
    patched_core = patch_core(core, intro_reference)
    files = []
    for directory in ('assets', 'overlay'):
        for relative, before, after in (
                ('dll/NieoCore.swf', core, patched_core),
                ('module/com/robot/module/app/subMap/Galaxy_3.swf', current, galaxy)):
            target = output / 'client' / directory / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(after)
            files.append({'path': str(target.relative_to(output)),
                          'before': digest(before), 'after': digest(after)})
    manifest = {'inputs': {'galaxySha256': digest(current), 'referenceGalaxySha256': digest(reference),
                           'introGalaxySha256': digest(intro_reference), 'coreSha256': digest(core)},
                'planets': [{'id': planet, 'name': name, 'x': x}
                            for planet, _, x, name in PLANETS],
                'projectCompatibilityLayout': True, 'serverFilesChanged': False,
                'noDatabaseMigration': True, 'files': files}
    (output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n',
                                           encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == '__main__':
    main()
