'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'context', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: {...Object.fromEntries(names.map(name => [name, {type: 'string'}])),
  'evolution-only': {type: 'boolean', default: false}}});
for (const name of names.filter(name => !values['evolution-only'] || !['java', 'ffdec'].includes(name))) if (!values[name]) throw Error('Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out), root = path.resolve(__dirname, '..');
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [], inputs = {};
function check(condition, message) { if (!condition) throw Error(message); }
function input(relative) {
  const bytes = fs.readFileSync(path.join(baseline, relative));inputs[relative] = sha(bytes);return bytes;
}
function put(relative, bytes) {
  fs.mkdirSync(path.dirname(path.join(out, relative)), {recursive: true});
  fs.writeFileSync(path.join(out, relative), bytes);
  files.push({path: relative, before: fs.existsSync(path.join(baseline, relative)) ? sha(input(relative)) : null, after: sha(bytes)});
}
function patch(relative, mutate) {
  const source = input(relative).toString();
  const ast = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true);
  const edits = mutate(ast);
  check(edits.length, 'No patch anchors: ' + relative);
  let result = source;
  for (const edit of edits.sort((a,b) => b.start-a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  check(!ts.createSourceFile(relative, result, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 'Invalid patch: ' + relative);
  put(relative, result);
}
const patchRoot = path.join(root, 'compat/server-patches/pet-collection');
const additions = [
  ...(!values['evolution-only'] ? [
    ['DataBase/migrations/scripts/025_create_pet_collection', '025_create_pet_collection'],
    ['GameServer/Server/Packet/Recv/Pet/PetCollectionHandler', 'PetCollectionHandler']
  ] : []),
  ['DataBase/migrations/scripts/029_complete_evolution_collection', '029_complete_evolution_collection']
];
for (const [relative, name] of additions) {
  const source = fs.readFileSync(path.join(patchRoot, name + '.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {fileName: name + '.ts', reportDiagnostics: true,
    compilerOptions: {target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true}});
  check(!compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'Cannot compile ' + name);
  if (!values['evolution-only']) put('app/src/' + relative + '.ts', source);
  put('app/dist/' + relative + '.js', compiled.outputText);
}
if (values['evolution-only']) {
  input('app/config/data/xml/spt.xml');
  patch('app/dist/DataBase/migrations/MigrationRunner.js', ast => {
    check(!ast.text.includes('029_complete_evolution_collection'), 'Evolution collection migration already registered');
    const list = ast.statements.flatMap(statement => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [])
      .find(node => node.name.getText(ast) === 'AllMigrations');
    check(list && ts.isArrayLiteralExpression(list.initializer), 'Unknown migration registry');
    return [
      {start: ast.statements[0].end, end: ast.statements[0].end,
        text: '\nconst { Migration029CompleteEvolutionCollection } = require("./scripts/029_complete_evolution_collection");\n'},
      {start: list.initializer.elements.end, end: list.initializer.elements.end,
        text: (list.initializer.elements.hasTrailingComma ? '' : ',') + '\n  new Migration029CompleteEvolutionCollection(),'}
    ];
  });
  put('client/index.html', fs.readFileSync(path.join(root, 'compat/client-patches/versioned-assets/index.html')));
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, inputs, restartGame: true,
    restartWeb: false, migration: 29, playerDataMigration: 'ordinary-evolution-collection-only'}, null, 2) + '\n');
  console.log(JSON.stringify({files: files.length, migration: 29, out}));
  process.exit(0);
}
for (const extension of ['ts', 'js']) {
  const folder = extension === 'ts' ? 'src' : 'dist';
  const relative = `app/${folder}/GameServer/Server/Packet/Recv/Pet/index.${extension}`;
  patch(relative, ast => {
    check(!ast.text.includes('PetCollectionHandler'), 'Collection handler already registered');
    return [{start: ast.text.length, end: ast.text.length, text: extension === 'ts'
      ? "\nexport * from './PetCollectionHandler';\n" : '\n__exportStar(require("./PetCollectionHandler"), exports);\n'}];
  });
  patch(`app/${folder}/DataBase/migrations/MigrationRunner.${extension}`, ast => {
    check(!ast.text.includes('025_create_pet_collection'), 'Collection migration already registered');
    const edits = [];
    function visit(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'AllMigrations') {
        check(ts.isArrayLiteralExpression(node.initializer), 'Unknown migration registry');
        edits.push({start: node.initializer.elements.end, end: node.initializer.elements.end,
          text: (node.initializer.elements.hasTrailingComma ? '' : ',') + '\n  new Migration025CreatePetCollection(),\n  new Migration029CompleteEvolutionCollection(),'});
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);check(edits.length === 1, 'Expected one migration registry');
    const first = ast.statements[0];
    edits.push({start: first.end, end: first.end, text: extension === 'ts'
      ? "\nimport { Migration025CreatePetCollection } from './scripts/025_create_pet_collection';\nimport { Migration029CompleteEvolutionCollection } from './scripts/029_complete_evolution_collection';\n"
      : '\nconst { Migration025CreatePetCollection } = require("./scripts/025_create_pet_collection");\nconst { Migration029CompleteEvolutionCollection } = require("./scripts/029_complete_evolution_collection");\n'});
    return edits;
  });
}
const context = path.resolve(values.context);
const config = ts.readConfigFile(path.join(context, 'tsconfig.json'), ts.sys.readFile);
check(!config.error, 'Cannot read server TypeScript configuration');
const options = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, context).options;
const virtual = new Map(files.filter(file => file.path.startsWith('app/src/')).map(file =>
  [path.join(context, file.path.slice(4)), fs.readFileSync(path.join(out, file.path), 'utf8')]));
const host = ts.createCompilerHost(options);
const originalRead = host.readFile.bind(host), originalExists = host.fileExists.bind(host), originalGet = host.getSourceFile.bind(host);
host.readFile = file => virtual.get(path.resolve(file)) ?? originalRead(file);
host.fileExists = file => virtual.has(path.resolve(file)) || originalExists(file);
host.getSourceFile = (file, version, onError, create) => virtual.has(path.resolve(file))
  ? ts.createSourceFile(file, virtual.get(path.resolve(file)), version, true) : originalGet(file, version, onError, create);
const program = ts.createProgram([...virtual.keys()], {...options, noEmit: true}, host);
const errors = ts.getPreEmitDiagnostics(program).filter(error =>
  error.category === ts.DiagnosticCategory.Error && error.file && virtual.has(path.resolve(error.file.fileName)));
check(!errors.length, ts.formatDiagnosticsWithColorAndContext(errors, {
  getCanonicalFileName: file => file, getCurrentDirectory: () => context, getNewLine: () => '\n'
}));
const xml = input('app/config/data/xml/pets.xml').toString();
const types = JSON.parse(fs.readFileSync(path.join(root, 'compat/client-patches/fusion-manual/native-types.json'))).types;
const catalog = [];
for (const match of xml.matchAll(/<Monster\b([^>]*)>/g)) {
  const attr = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
  if (!['HP','Atk','Def','SpAtk','SpDef','Spd'].every(key => attr[key] !== undefined && Number.isFinite(Number(attr[key])))) continue;
  check(Number.isSafeInteger(Number(attr.ID)) && Number(attr.ID) > 0, 'Invalid species ID');
  catalog.push({id: Number(attr.ID), name: attr.DefName.replaceAll('&amp;', '&').replaceAll('&quot;', '"'), type: types[attr.Type] || '属性' + attr.Type});
}
catalog.sort((a,b) => a.id-b.id);
check(catalog.length && new Set(catalog.map(p => p.id)).size === catalog.length, 'Invalid collection catalogue');
fs.mkdirSync(out, {recursive: true});fs.writeFileSync(path.join(out, 'catalogue.json'), JSON.stringify(catalog, null, 2) + '\n');
function parse(raw) {
  check(raw.subarray(0,3).toString() === 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));check(body.length + 8 === raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0,offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset);offset += 2;
    const code = short >> 6;let length = short & 63;
    if (length === 63) { length = body.readUInt32LE(offset);offset += 4; }
    check(offset + length <= body.length, 'Truncated SWF');
    const payload = body.subarray(offset,offset+length);offset += length;
    tags.push({code, payload, name: code === 82 ? payload.subarray(4,payload.indexOf(0,4)).toString() : null, raw: body.subarray(start,offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid SWF tags');return {raw, header, tags};
}
function encode(swf, tags) {
  const body = Buffer.concat([swf.header, ...tags]);const size = Buffer.alloc(4);size.writeUInt32LE(body.length+8);
  return Buffer.concat([swf.raw.subarray(0,4), size, zlib.deflateSync(body,{level:9})]);
}
function tag(code, payload = Buffer.alloc(0)) {
  const header = Buffer.alloc(6);header.writeUInt16LE((code << 6) | 63);header.writeUInt32LE(payload.length,2);
  return Buffer.concat([header,payload]);
}
const coreRelative = 'client/assets/dll/NieoCore.swf';const originalCore = parse(input(coreRelative));
const mapKey = 'com/robot/app/mapProcess/MapProcess_5';
const native = originalCore.tags.filter(t => t.name === mapKey);check(native.length === 1, 'Missing native lab class');
// Only the verified current lab baseline may be rebuilt from the maintained source mirror.
const expectedMap = 'f8ff9df4c7839628113aa6e190fdb6a12e030d3fdbd7028a2306ced80f9b9060';
const galleryAlreadyPresent = sha(native[0].raw) === 'ee657d1b727c6c4898c939745ff2f0826cace9921dbd0e24d34b01c5f21508a8';
check(sha(native[0].raw) === expectedMap || galleryAlreadyPresent, 'Lab class changed; reconcile its source before building');
if (!galleryAlreadyPresent) {
const importRoot = path.join(out, 'core-compiler/import');
const target = path.join(importRoot, 'scripts', mapKey + '.as');fs.mkdirSync(path.dirname(target), {recursive:true});
fs.copyFileSync(path.join(root,'compat/client-patches/acquisition-restoration/MapProcess_5.as'),target);
const coreOutput = path.join(out,'core-compiler/output.swf');
execFileSync(values.java,['-Djava.awt.headless=true','-Xmx2g','-jar',values.ffdec,'-onerror','abort','-importScript',path.join(baseline,coreRelative),coreOutput,importRoot],{stdio:'inherit',timeout:180000});
const changed = parse(fs.readFileSync(coreOutput)).tags.filter(t => t.name === mapKey);check(changed.length === 1,'Missing compiled lab class');
const finalCore = encode(originalCore, originalCore.tags.map(t => t.name === mapKey ? changed[0].raw : t.raw));
const verifyCore = parse(finalCore);
check(verifyCore.tags.length === originalCore.tags.length && verifyCore.tags.every((t,i) => t.name === mapKey || t.raw.equals(originalCore.tags[i].raw)), 'Unrelated Core tag changed');
put(coreRelative, finalCore);
}
const bookRelative = 'client/assets/resource/book/monsterBook.swf';const originalBook = parse(input(bookRelative));
let source = fs.readFileSync(path.join(root,'compat/client-patches/pet-collection/monsterBook.as'),'utf8');
const chunks = [];for (let i=0;i<catalog.length;i+=60) chunks.push(catalog.slice(i,i+60));
source = source.replace('private const catalog:Array = []; // @CATALOG@','private const catalog:Array = buildCatalog();');
const methods = '\n      private function buildCatalog():Array { var all:Array=[]; ' + chunks.map((_,i) => 'all=all.concat(catalog'+i+'());').join(' ') + ' return all; }\n' + chunks.map((rows,i) => '      private function catalog'+i+'():Array { return '+JSON.stringify(rows)+'; }').join('\n');
source = source.replace(/\n   }\s*}\s*$/, methods + '\n   }\n}\n');
const bookImport = path.join(out,'book-compiler/import');fs.mkdirSync(path.join(bookImport,'scripts'),{recursive:true});
fs.writeFileSync(path.join(bookImport,'scripts/monsterBook.as'),source);
const bookOutput = path.join(out,'book-compiler/output.swf');
execFileSync(values.java,['-Djava.awt.headless=true','-Xmx2g','-jar',values.ffdec,'-onerror','abort','-importScript',path.join(baseline,bookRelative),bookOutput,bookImport],{stdio:'inherit',timeout:180000});
const abc = parse(fs.readFileSync(bookOutput)).tags.filter(t => t.code === 82);check(abc.length,'Missing gallery code');
const linkage = Buffer.concat([Buffer.from([1,0,105,2]),Buffer.from('PetCollectionGallery\0')]);
const sprite = Buffer.concat([Buffer.from([105,2,1,0]),tag(1),tag(0)]);
put('client/overlay/resource/book/petCollection.swf',encode(originalBook,[tag(69,Buffer.from([8,0,0,0])),...abc.map(t=>t.raw),tag(39,sprite),tag(76,linkage),tag(1),tag(0)]));
const manifest = {files, inputs, species:catalog.length, command:91001, migration:25, changedNativeClasses:galleryAlreadyPresent ? [] : [mapKey], entryAlreadyPresent:galleryAlreadyPresent, unrelatedNativeTagsPreserved:true, restartGame:true, restartWeb:false, rewardsEnabled:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
