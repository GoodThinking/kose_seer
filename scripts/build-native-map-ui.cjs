'use strict';
// Build native map and module interactions on a captured client; never rebuild server code.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['baseline', 'out', 'java', 'ffdec'].map(key => [key, {type: 'string'}]))});
for (const key of ['baseline', 'out', 'java', 'ffdec']) assert.ok(v[key], 'Missing --' + key);
const root = path.resolve(__dirname, '..'), baseline = path.resolve(v.baseline), out = path.resolve(v.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expected = {
    'com/robot/app/mapProcess/MapProcess_5': '2898bbeaec2f80761b5f200e93be71f2990514c82b3566ad8ef638ad374c6b04',
    'com/robot/app/mapProcess/MapProcess_10': '09b7b89810c9152493097cf99a4acf973066d2fe65e80ef967245c7057815091',
    'com/robot/app/mapProcess/MapProcess_550': 'f60b65481b745f389c079d636c1ed9b12723b5b8be3f5c9d5e6f06dc153fe4c1',
    'com/robot/app/mapProcess/MapProcess_102': 'e2098cc834e2510104b2e4da04d27d50beee11dac0bda0908cf19de5ec242b84',
    'com/robot/app/mapProcess/GalaxyArenaMap': '34c91680bacf64a234ea90a0047b6f5ef8137f81bdde274c2e1bdfe85d7daee8',
    'com/robot/core/manager/map/config/MapConfig': '30b5517223fee05a134c17cbc949fd242b61c5a26544ab01efc8cb9a5631f7d4',
    'com/robot/app/petbag/ui/PetBagPanel': 'dfdce514850265933f1bc54d873a2cc7a3ce08df19b176e55c9cf462d895c87f'
};
const sources = {
    'com/robot/app/mapProcess/MapProcess_5': 'compat/client-patches/acquisition-restoration/MapProcess_5.as',
    'com/robot/app/mapProcess/MapProcess_10': 'compat/client-patches/map-story/scripts/com/robot/app/mapProcess/MapProcess_10.as',
    'com/robot/app/mapProcess/MapProcess_550': 'compat/client-patches/safari/MapProcess_550.as',
    'com/robot/app/mapProcess/MapProcess_102': 'compat/client-patches/star-arena/core/scripts/com/robot/app/mapProcess/MapProcess_102.as',
    'com/robot/app/mapProcess/GalaxyArenaMap': 'compat/client-patches/star-arena/core/scripts/com/robot/app/mapProcess/GalaxyArenaMap.as',
    'com/robot/core/manager/map/config/MapConfig': 'compat/client-patches/map-story/scripts/com/robot/core/manager/map/config/MapConfig.as',
    'com/robot/app/petbag/ui/PetBagPanel': 'compat/client-patches/countermark/PetBagPanel.as'
};
const modules = [
    {name: 'com/robot/module/app/SptPanel', source: 'compat/client-patches/spt-all-bosses/SptPanel.as', catalog: 'BOSSES', inputs: {
        'client/assets/module/com/robot/module/app/SptPanel.swf': '55925c832de8d162b2dffed43eddbe7c26567640410fe3c3d57ce10d6dd9f5f3'
    }},
    {name: 'com/robot/module/book/PetCountermarkBookPanel', source: 'compat/client-patches/countermark/PetCountermarkBookPanel.as', inputs: {
        'client/overlay/module/com/robot/module/book/PetCountermarkBookPanel.swf': '36dcc1d1af76d46f4bd29ebbfec4d3d94b5193d46ec27f2e665ab8723a6926e9'
    }}
];
for (const module of modules) for (const [relative, hash] of Object.entries(module.inputs)) {
    assert.equal(sha(fs.readFileSync(path.join(baseline, relative))), hash, 'Module baseline changed; reconcile before replacing: ' + relative);
}
function parse(raw) {
    assert.equal(raw.subarray(0, 3).toString(), 'CWS');
    const body = zlib.inflateSync(raw.subarray(8));
    assert.equal(body.length + 8, raw.readUInt32LE(4));
    let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
    const header = body.subarray(0, offset), tags = [];
    while (offset < body.length) {
        const start = offset, short = body.readUInt16LE(offset); offset += 2;
        let size = short & 63;
        if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
        assert.ok(offset + size <= body.length, 'Truncated SWF tag');
        const payload = body.subarray(offset, offset + size); offset += size;
        tags.push({code: short >> 6, name: (short >> 6) === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
        if ((short >> 6) === 0) break;
    }
    assert.equal(offset, body.length);
    return {prefix: raw.subarray(0, 8), header, tags};
}
function encode(movie, tags) {
    const body = Buffer.concat([movie.header, ...tags.map(tag => tag.raw)]);
    const prefix = Buffer.from(movie.prefix); prefix.writeUInt32LE(body.length + 8, 4);
    return Buffer.concat([prefix, zlib.deflateSync(body, {level: 9})]);
}
const paths = ['client/assets/dll/NieoCore.swf', 'client/overlay/dll/NieoCore.swf'];
const original = fs.readFileSync(path.join(baseline, paths[0]));
assert.ok(original.equals(fs.readFileSync(path.join(baseline, paths[1]))), 'Captured Core copies differ');
const before = parse(original);
for (const [name, hash] of Object.entries(expected)) {
    const tags = before.tags.filter(tag => tag.name === name);
    assert.equal(tags.length, 1, 'Missing unique class: ' + name);
    assert.equal(sha(tags[0].raw), hash, 'Client class changed; reconcile native UI source: ' + name);
}
const arenaRoot = path.join(root, 'compat/server-patches/star-arena');
const read = name => JSON.parse(fs.readFileSync(path.join(arenaRoot, name)));
const arenas = [{...read('catalog.json'), id: 1, name: '帕诺', title: '星系擂台', rewardName: '圣霆雷伊', rewardSpeciesTotal: 710, rewardSkills: [30944, 25581, 25582, 30948], backgroundMapId: 102, theme: 'pano'}, read('catalog-kalan.json'), read('catalog-rogg.json')];
const imports = path.join(out, 'compiler/import');
for (const name of Object.keys(expected)) {
    let source = fs.readFileSync(path.join(root, sources[name]), 'utf8');
    if (name.endsWith('/GalaxyArenaMap')) {
        const marker = 'private static const ARENAS:Array = []; // @GALAXY_ARENAS@';
        assert.equal(source.split(marker).length, 2, 'Arena catalog marker changed');
        source = source.replace(marker, 'private static const ARENAS:Array = ' + JSON.stringify(arenas) + ';');
    }
    const target = path.join(imports, 'scripts', name + '.as');
    fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, source);
}
const compiledPath = path.join(out, 'compiler/output.swf');
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript', path.join(baseline, paths[0]), compiledPath, imports], {stdio: 'inherit', timeout: 120000});
const compiled = fs.readFileSync(compiledPath), after = parse(compiled), changed = [];
assert.ok(before.header.equals(after.header), 'Movie geometry changed');
assert.equal(before.tags.length, after.tags.length, 'Tag count changed');
after.tags.forEach((tag, index) => {
    if (tag.raw.equals(before.tags[index].raw)) return;
    assert.ok(Object.hasOwn(expected, tag.name) && tag.name === before.tags[index].name, 'Unrelated client change: ' + (tag.name || tag.code));
    changed.push(tag.name);
});
assert.deepEqual(changed.sort(), Object.keys(expected).sort(), 'Expected all native map UI and configuration classes to change');
const files = paths.map(relative => {
    const target = path.join(out, relative); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, compiled);
    return {path: relative, before: sha(original), after: sha(compiled)};
});
const preservedModuleCatalogs = {};
for (const module of modules) {
    const relatives = Object.keys(module.inputs), sourceFile = path.join(baseline, relatives[0]);
    const movie = parse(fs.readFileSync(sourceFile));
    assert.equal(movie.tags.filter(tag => tag.code === 82).length, 1, 'Expected one module ABC: ' + module.name);
    const compiler = path.join(out, 'compiler/modules', path.basename(module.name));
    let source = fs.readFileSync(path.join(root, module.source), 'utf8');
    if (module.catalog) {
        const exported = path.join(compiler, 'baseline');
        execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-selectclass', module.name.replaceAll('/', '.'), '-export', 'script', exported, sourceFile], {stdio: 'inherit', timeout: 120000});
        const originalSource = fs.readFileSync(path.join(exported, 'scripts', module.name + '.as'), 'utf8');
        const pattern = new RegExp('private const ' + module.catalog + ':Array = \\[[\\s\\S]*?\\];');
        const declaration = originalSource.match(pattern);
        assert.ok(declaration && pattern.test(source), 'Missing native module catalog: ' + module.catalog);
        const data = JSON.parse(declaration[0].replace('private const ' + module.catalog + ':Array = ', '').slice(0, -1));
        preservedModuleCatalogs[module.catalog] = {entries: data.length, sha256: sha(Buffer.from(JSON.stringify(data)))};
        source = source.replace(pattern, declaration[0]);
    }
    const imports = path.join(compiler, 'import'), target = path.join(imports, 'scripts', module.name + '.as');
    fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, source);
    const context = path.join(compiler, 'context.swf'), output = path.join(compiler, 'compiled.swf');
    fs.writeFileSync(context, encode(movie, movie.tags.flatMap(tag => tag.code === 82 ? [...after.tags.filter(tag => tag.code === 82), tag] : [tag])));
    execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript', context, output, imports], {stdio: 'inherit', timeout: 120000});
    const rebuilt = parse(fs.readFileSync(output)), replacement = rebuilt.tags.filter(tag => tag.code === 82).at(-1);
    assert.ok(replacement && replacement.name === movie.tags.find(tag => tag.code === 82).name, 'Module ABC moved: ' + module.name);
    assert.ok(!replacement.raw.equals(movie.tags.find(tag => tag.code === 82).raw), 'Module source did not compile: ' + module.name);
    const bytes = encode(movie, movie.tags.map(tag => tag.code === 82 ? replacement : tag));
    for (const relative of relatives) {
        const originalModule = parse(fs.readFileSync(path.join(baseline, relative)));
        assert.ok(originalModule.header.equals(movie.header), 'Module route geometry differs: ' + relative);
        assert.equal(originalModule.tags.length, movie.tags.length, 'Module route tag count differs: ' + relative);
        originalModule.tags.forEach((tag, index) => {
            if (tag.code !== 82) assert.ok(tag.raw.equals(movie.tags[index].raw), 'Module native artwork differs: ' + relative);
        });
        const destination = path.join(out, relative); fs.mkdirSync(path.dirname(destination), {recursive: true}); fs.writeFileSync(destination, bytes);
        files.push({path: relative, before: module.inputs[relative], after: sha(bytes)});
    }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({classes: changed, files, preservedModuleCatalogs, serverChanges: false, databaseChanges: false, restartServices: false}, null, 2) + '\n');
console.log(JSON.stringify({classes: changed, files: files.length, coreSha256: sha(compiled)}, null, 2));
