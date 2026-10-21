'use strict';
// Reconcile legacy level-local experience at login without publishing uncommitted pets.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['baseline','context','out'].map(name => [name,{type:'string'}]))});
for (const name of ['baseline','context','out']) assert.ok(v[name], 'Missing --' + name);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
const ts = require(path.join(path.resolve(v.context),'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [], protectedInputs = {};
function put(relative, bytes) {
  const target = path.join(out,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  const previous = path.join(baseline,relative);
  files.push({path:relative,before:fs.existsSync(previous) ? sha(fs.readFileSync(previous)) : null,after:sha(Buffer.from(bytes))});
}
for (const extension of ['ts','js']) {
  const source = extension === 'ts';
  const relative = `app/${source ? 'src' : 'dist'}/GameServer/Game/Pet/PetManager.${extension}`;
  const text = fs.readFileSync(path.join(baseline,relative),'utf8');
  const ast = ts.createSourceFile(relative,text,ts.ScriptTarget.Latest,true), edits = [];
  const calculator = source ? 'PetCalculator' : 'PetCalculator_1.PetCalculator';
  const pp = source ? 'ReconcilePetPP' : '(0, PetPP_1.ReconcilePetPP)';
  const cost = `${calculator}.CalculateExpForLevel(pet.level + 1, pet.petId) - ${calculator}.CalculateExpForLevel(pet.level, pet.petId)`;
  let initializers = 0, levelLoops = 0;
  function visit(node) {
    if (ts.isMethodDeclaration(node) && node.name.getText(ast) === 'Initialize') {
      initializers++;
      const first = node.body.statements[0];
      assert.ok(first.getText(ast).includes('GetInstanceOrCreateNew_PetData'));
      assert.ok(!node.body.getText(ast).includes('CommitPetUpdate'), 'Normalization already installed');
      const body = `
    // Legacy saves may contain enough level-local experience for several levels.
    // Keep login packets quiet and publish each pet only after strict persistence.
    const release = await this.PetData.AcquireMutation();
    try {
      for (const pet of this.PetData.PetList) {
        if (pet.level >= 100) continue;
        const requiredExp = ${cost};
        if (requiredExp <= 0 || pet.exp < requiredExp) continue;
        const candidate${source ? ': IPetInfo' : ''} = JSON.parse(JSON.stringify(pet));
        const result = this.checkLevelUp(candidate);
        const newSkills = [...new Set(result.newSkills)].filter(id => !candidate.skillArray.includes(id));
        candidate.skillArray.push(...newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length)));
        candidate.hp = candidate.maxHp;
        candidate.skillPP = ${pp}(candidate, true);
        await this.PetData.CommitPetUpdate(pet, candidate);
      }
    } finally {
      release();
    }
`;
      edits.push({start:first.end,end:first.end,replacement:body});
    }
    if (source && ts.isMethodDeclaration(node) && node.name.getText(ast) === 'checkLevelUp') {
      const loop = node.body.statements.find(ts.isWhileStatement);
      assert.ok(loop && loop.expression.getText(ast).includes('CalculateExpForLevel'));
      const statement = loop.statement.statements[0];
      assert.ok(ts.isVariableStatement(statement));
      const required = statement.declarationList.declarations[0];
      assert.equal(required.name.getText(ast),'requiredExp');
      edits.push({start:loop.expression.getStart(ast),end:loop.expression.end,replacement:'pet.level < 100'});
      edits.push({start:required.initializer.getStart(ast),end:required.initializer.end,replacement:`Math.max(0, ${cost})`});
      edits.push({start:statement.end,end:statement.end,replacement:'\n      if (requiredExp <= 0 || pet.exp < requiredExp) break;'});
      levelLoops++;
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
  assert.equal(initializers,1);assert.equal(levelLoops,source ? 1 : 0);
  if (source) {
    edits.push({start:0,end:0,replacement:"import type {} from './AcquisitionRuntime';\nimport { ReconcilePetPP } from './PetPP';\n"});
  } else {
    assert.ok(text.includes('PetPP_1.ReconcilePetPP'));
    assert.ok(text.includes('PetCalculator_1.PetCalculator.ExpForNextLevel'));
  }
  let result = text;
  for (const edit of edits.sort((a,b) => b.start-a.start)) result = result.slice(0,edit.start) + edit.replacement + result.slice(edit.end);
  assert.equal(ts.createSourceFile(relative,result,ts.ScriptTarget.Latest,true).parseDiagnostics.length,0);
  put(relative,result);
  if (!source && fs.existsSync(path.join(baseline,relative+'.map'))) {
    const map = JSON.parse(fs.readFileSync(path.join(baseline,relative+'.map'),'utf8'));
    if (map.mappings) {map.mappings = '';put(relative+'.map',JSON.stringify(map));}
  }
}
// Keep the live projection implementation; only the nonexistent next-level threshold changes at level 100.
const projection = 'app/dist/GameServer/Game/Pet/PetExperienceProjection.js';
const projectionText = fs.readFileSync(path.join(baseline,projection),'utf8');
const projectionAst = ts.createSourceFile(projection,projectionText,ts.ScriptTarget.Latest,true);
const projectionEdits = [];
(function visit(node) {
  if ((ts.isPropertyAssignment(node) || ts.isVariableDeclaration(node)) && node.name.getText(projectionAst) === 'nextLvExp') {
    const initializer = node.initializer;
    assert.ok(initializer && !ts.isConditionalExpression(initializer), 'Maximum-level projection already installed');
    assert.ok(initializer.getText(projectionAst).includes('ExpForNextLevel(pet.level, pet.petId)'));
    projectionEdits.push({start:initializer.getStart(projectionAst),end:initializer.end,
      replacement:`pet.level === 100 ? ${ts.isPropertyAssignment(node) ? 'pet.exp' : 'exp'} : ${initializer.getText(projectionAst)}`});
  }
  ts.forEachChild(node,visit);
})(projectionAst);
assert.equal(projectionEdits.length,2);
let projected = projectionText;
for (const edit of projectionEdits.sort((a,b) => b.start-a.start)) projected = projected.slice(0,edit.start) + edit.replacement + projected.slice(edit.end);
assert.equal(ts.createSourceFile(projection,projected,ts.ScriptTarget.Latest,true).parseDiagnostics.length,0);
put(projection,projected);
const projectionSource = fs.readFileSync(path.join(__dirname,'../compat/server-patches/pet-experience-normalize/PetExperienceProjection.ts'),'utf8');
put('app/src/GameServer/Game/Pet/PetExperienceProjection.ts',projectionSource);
if (fs.existsSync(path.join(baseline,projection+'.map'))) {
  const map = JSON.parse(fs.readFileSync(path.join(baseline,projection+'.map'),'utf8'));
  if (map.mappings) {map.mappings = '';put(projection+'.map',JSON.stringify(map));}
}
for (const name of ['PetCalculator','PetPP']) {
  const relative = 'app/dist/GameServer/Game/Pet/'+name+'.js';
  protectedInputs[relative] = sha(fs.readFileSync(path.join(baseline,relative)));
}
const mutation = 'app/dist/DataBase/models/PetData.js';
protectedInputs[mutation] = sha(fs.readFileSync(path.join(baseline,mutation)));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,protectedInputs,restartGame:true,restartWeb:false,normalizesOnLogin:true,bulkPlayerUpdate:false},null,2)+'\n');
console.log(JSON.stringify({files,protectedInputs},null,2));
