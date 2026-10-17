'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {parseArgs} = require('node:util');
const {execFileSync} = require('node:child_process');

const names = ['server-source', 'tasks', 'core', 'panel', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
const out = path.resolve(values.out);
const sourceRoot = path.resolve(values['server-source']);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };
const sourceRelative = 'src/GameServer/Game/Task/CompleteConfiguredTask.ts';
const runtimeRelative = 'dist/GameServer/Game/Task/CompleteConfiguredTask.js';
const configRelative = 'config/data/json/tasks.json';
const panelRelative = 'resource/module/TaskPanel_90.swf';
const baseline = {
  source: '6d2e61ec548c2157103dcc797f94aa7cd4e37392169e09ab63961bce6d35520b',
  runtime: '5be59ae3535f644940a79b22de8d302e98fc94173b3ce3f75e2ac2c25dfae986',
  config: 'bdbf4f075670b855dc2219c356e393d4263093adde6aba70a2e19a8e93858592',
  panel: '38b49e0967005c7ac4e14ff34ff5e4b98ce2d9d714f233899eec3573e066a411',
  core: '8016a34165cd3b4eea2c63a8740c04aa7b64c2977346b147b1a8950f15d2f4eb'
};
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
}
function replaceOnce(text, before, after) {
  check(text.split(before).length === 2, `Expected exactly one patch anchor: ${before}`);
  return text.replace(before, after);
}
function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));
  check(body.length + 8 === raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset);
  const tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset);
    offset += 2;
    const code = short >> 6;
    let length = short & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    check(offset + length <= body.length, 'Truncated SWF tag');
    const payload = body.subarray(offset, offset + length);
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null;
    offset += length;
    tags.push({code, name, raw: body.subarray(start, offset)});
    if (code === 0) break;
  }
  check(offset === body.length && tags.at(-1)?.code === 0, 'Invalid SWF end');
  return {raw, header, tags};
}
function encode(movie, tags) {
  const body = Buffer.concat([movie.header, ...tags.map(tag => tag.raw)]);
  const size = Buffer.alloc(4); size.writeUInt32LE(body.length + 8);
  return Buffer.concat([movie.raw.subarray(0, 4), size, zlib.deflateSync(body, {level: 9})]);
}

const ts = require(path.join(sourceRoot, 'node_modules/typescript/lib/typescript.js'));
const tsconfig = ts.readConfigFile(path.join(sourceRoot, 'tsconfig.json'), ts.sys.readFile);
check(!tsconfig.error, 'Cannot read TypeScript configuration');
const options = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, sourceRoot).options;
let source = fs.readFileSync(path.join(sourceRoot, sourceRelative), 'utf8');
check(sha(source) === baseline.source, 'Server source baseline changed');
const compile = text => ts.transpileModule(text, {compilerOptions: options, fileName: path.join(sourceRoot, sourceRelative), reportDiagnostics: true});
check(sha(compile(source).outputText) === baseline.runtime, 'Source does not reproduce the deployed module');
source = replaceOnce(source, 'const petData = petRewards.length ?', 'const petData = petRewards.length || taskId === 90 ?');
source = replaceOnce(source, 'const petRows = petRewards.length', 'const petRows = petData');
source = replaceOnce(source, '(petRewards.length && !petRows[0])', '(petData && !petRows[0])');
source = replaceOnce(source, 'if (petData) petData.PetList = stagedPets;', 'if (petRewards.length && petData) petData.PetList = stagedPets;');
const progressCheck = '        validateProgress(taskId, config, taskBuffers);';
source = replaceOnce(source, progressCheck, progressCheck + `
        if (taskId === 90) {
          const ownedPets: IPetInfo[] = JSON.parse(petRows[0].pet_list);
          if (!ownedPets.some(pet => pet.petId === 10)) {
            throw new Error('Task 90 requires a Pipi in the bag or storage');
          }
          const buffer: ITaskBuffer = taskBuffers[taskId];
          if (buffer.xinBytes) buffer.xinBytes[1] = 1;
          else buffer[1] = 1;
        }`);
const compiled = compile(source);
check(!compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'TypeScript transpilation failed');
put('app/' + sourceRelative, source);
put('app/' + runtimeRelative, compiled.outputText);
const sourceMap = JSON.parse(compiled.sourceMapText);
sourceMap.sources = ['../../../../' + sourceRelative];
put('app/' + runtimeRelative + '.map', JSON.stringify(sourceMap));
let config = fs.readFileSync(values.tasks, 'utf8');
check(sha(config) === baseline.config, 'Task config baseline changed');
const configAnchor = '"90": {\n      "name": "克洛斯星的皮皮",\n      "type": "normal",\n      "requiredProgress": 2,';
config = replaceOnce(config, configAnchor, configAnchor.replace('requiredProgress": 2', 'requiredProgress": 1'));
check(JSON.parse(config).tasks['90'].requiredProgress === 1, 'Task prerequisite count was not changed');
put('app/' + configRelative, config);

const panelBytes = fs.readFileSync(values.panel), coreBytes = fs.readFileSync(values.core);
check(sha(panelBytes) === baseline.panel && sha(coreBytes) === baseline.core, 'Client baseline changed');
const panel = parse(panelBytes), core = parse(coreBytes);
const panelAbcs = panel.tags.filter(tag => tag.code === 82);
check(panelAbcs.length === 1, 'Expected one native task panel ABC');
check(!core.tags.some(tag => tag.code === 82 && tag.name === panelAbcs[0].name), 'Panel ABC already exists in compiler context');
// Use the real core only as a compiler library. Never ship it in the panel.
const holder = encode(core, [...core.tags.slice(0, -1), ...panelAbcs, core.tags.at(-1)]);
put('compiler/input.swf', holder);
const panelSource = fs.readFileSync(path.join(__dirname, '../compat/client-patches/task90/TaskPanel_90.as'));
put('compiler/import/scripts/com/robot/module/task/TaskPanel_90.as', panelSource);
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort',
  '-importScript', path.join(out, 'compiler/input.swf'), path.join(out, 'compiler/output.swf'),
  path.join(out, 'compiler/import')], {stdio: 'inherit', timeout: 120000});
const compiledMovie = parse(fs.readFileSync(path.join(out, 'compiler/output.swf')));
const imported = compiledMovie.tags.filter(tag => tag.code === 82 && tag.name === panelAbcs[0].name);
check(imported.length === 1 && !imported[0].raw.equals(panelAbcs[0].raw), 'Panel source was not compiled');
const finalPanel = encode(panel, panel.tags.map(tag => tag === panelAbcs[0] ? imported[0] : tag));
const checkedPanel = parse(finalPanel);
check(checkedPanel.tags.length === panel.tags.length, 'Panel tag count changed');
check(checkedPanel.tags.every((tag, index) => tag.code === 82 || tag.raw.equals(panel.tags[index].raw)), 'Panel artwork or linkage changed');
put('client/overlay/' + panelRelative, finalPanel);
const manifest = {
  baseline,
  files: [
    {path: 'app/' + runtimeRelative, after: sha(compiled.outputText)},
    {path: 'app/' + runtimeRelative + '.map', after: sha(JSON.stringify(sourceMap))},
    {path: 'app/' + sourceRelative, after: sha(source)},
    {path: 'app/' + configRelative, after: sha(config)},
    {path: 'client/overlay/' + panelRelative, after: sha(finalPanel)}
  ],
  coreUsedOnlyAsCompilerLibrary: true,
  panelArtworkPreserved: true,
  databaseMigration: false
};
put('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
