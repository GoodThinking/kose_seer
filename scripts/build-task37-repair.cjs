'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const names = ['server-context', 'source', 'runtime', 'tasks', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
const root = path.resolve(values['server-context']);
const out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => {if (!condition) throw new Error(message);};
const baseline = {
  source: '20067c1bc325ce445306874f0e508a2b9511a38b1e2c25b4e3affc5d7f845039',
  runtime: 'ca116b8dc445d86c7d44876d60aed9eb04813118b179a1dddcaa3bb0e9a7e363',
  config: '4eb38d3434dedf2b034a6ad8320f1875ef4925aaa7beb00ad2ffd905a71ef342'
};
const sourceRelative = 'src/GameServer/Game/Task/CompleteConfiguredTask.ts';
const runtimeRelative = 'dist/GameServer/Game/Task/CompleteConfiguredTask.js';
const ts = require(path.join(root, 'node_modules/typescript/lib/typescript.js'));
const tsconfig = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
check(!tsconfig.error, 'Cannot read TypeScript configuration');
const options = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, root).options;
const filename = path.join(root, sourceRelative);
const compile = text => ts.transpileModule(text, {compilerOptions: options, fileName: filename, reportDiagnostics: true});
let source = fs.readFileSync(values.source, 'utf8');
check(sha(source) === baseline.source, 'Task settlement source changed');
check(sha(fs.readFileSync(values.runtime)) === baseline.runtime, 'Task settlement runtime changed');
// Reconstruct the concurrent task-19 runtime change missing from deployed TS.
// Require byte-for-byte reproduction before applying the survey fix.
source = replaceOnce(source, '        validateProgress(taskId, config, taskBuffers);',
  `        const mushroomTurnIn = taskId === 19 && (player.ChallengeProgressManager.HasDefeatedSPTBoss(1) ||
          taskList[301]?.status === TaskStatus.COMPLETED);
        if (!mushroomTurnIn) validateProgress(taskId, config, taskBuffers);`);
check(sha(compile(source).outputText) === baseline.runtime, 'Source does not reproduce deployed settlement');
function replaceOnce(text, before, after) {
  check(text.split(before).length === 2, 'Expected unique patch anchor');
  return text.replace(before, after);
}
const anchor = '        if (!mushroomTurnIn) validateProgress(taskId, config, taskBuffers);';
source = replaceOnce(source, anchor, anchor + `
        if (taskId === 37) {
          const buffer: ITaskBuffer = taskBuffers[taskId];
          const stages = buffer.xinBytes ?? DecodeTask96Buffer(buffer);
          stages[10] = 1;
          if (!buffer.xinBytes) stages.forEach((value, index) => { buffer[index] = value; });
        }`);
const host = ts.createCompilerHost(options);
const originalGetSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
  path.resolve(file) === filename ? ts.createSourceFile(file, source, languageVersion, true)
    : originalGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const program = ts.createProgram([filename], {...options, noEmit: true}, host);
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error && d.file && path.resolve(d.file.fileName) === filename);
check(!diagnostics.length, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'
}));
const compiled = compile(source);
check(!compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'Task settlement compilation failed');
let config = fs.readFileSync(values.tasks, 'utf8');
check(sha(config) === baseline.config, 'Task config changed');
const taskAnchor = '"37": {\n      "name": "帕诺星系星球测绘",\n      "type": "normal",\n      "requiredProgress": 11,';
config = replaceOnce(config, taskAnchor, taskAnchor.replace('requiredProgress": 11', 'requiredProgress": 10'));
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
}
put('app/' + sourceRelative, source);
put('app/' + runtimeRelative, compiled.outputText);
const sourceMap = JSON.parse(compiled.sourceMapText);
sourceMap.sources = ['../../../../' + sourceRelative];
put('app/' + runtimeRelative + '.map', JSON.stringify(sourceMap));
put('app/config/data/json/tasks.json', config);
const files = [runtimeRelative, runtimeRelative + '.map', sourceRelative, 'config/data/json/tasks.json']
  .map(relative => ({path: 'app/' + relative, after: sha(fs.readFileSync(path.join(out, 'app', relative)))}));
const manifest = {baseline, files, taskId: 37, requiredSurveySteps: 10, finalStepIndex: 10,
  patchedModuleSemanticDiagnostics: [], rewardsChanged: false, clientChanged: false, databaseMigration: false};
put('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
