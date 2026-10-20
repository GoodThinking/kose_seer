'use strict';
// Preserve the live PP transaction; classify every configured PP potion consistently.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options:Object.fromEntries(['baseline','out','context'].map(name=>[name,{type:'string'}]))});
for(const name of ['baseline','out','context'])if(!v[name])throw Error('Missing --'+name);
const baseline=path.resolve(v.baseline),out=path.resolve(v.out);
const ts=require(path.join(path.resolve(v.context),'node_modules/typescript'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const relative='app/dist/GameServer/Game/Battle/BattleManager.js';
const text=fs.readFileSync(path.join(baseline,relative),'utf8');
const ast=ts.createSourceFile(relative,text,ts.ScriptTarget.Latest,true),edits=[],counts={};
function add(tag,start,end,replacement){counts[tag]=(counts[tag]||0)+1;edits.push({start,end,replacement});}
(function visit(node){
  if(ts.isMethodDeclaration(node)&&node.name.getText(ast)==='HandleUsePetItem'){
    const gate=node.body.statements[0];
    assert.ok(ts.isIfStatement(gate)&&gate.expression.getText(ast)==='itemId === 300016');
    add('reservation',gate.expression.getStart(ast),gate.expression.end,'ItemSystem_1.ItemSystem.GetItem(itemId)?.ItemType === 2');
  }
  if(ts.isMethodDeclaration(node)&&node.name.getText(ast)==='UsePetItem'){
    const start=node.body.statements[0].getStart(ast);
    add('classification',start,start,'// Classify PP potions from the same item configuration used for restoration.\n        const medicine = ItemSystem_1.ItemSystem.GetItem(itemId);\n        const isPP = medicine?.ItemType === 2;\n        ');
    for(const statement of node.body.statements){
      if(!ts.isVariableStatement(statement))continue;
      const decl=statement.declarationList.declarations[0],name=decl.name.getText(ast);
      if(name==='isPP'||name==='medicine'){
        assert.equal(decl.initializer.getText(ast),name==='isPP'?'itemId === 300016':'ItemSystem_1.ItemSystem.GetItem(itemId)');
        add('oldClassification',statement.getFullStart(),statement.end,'');
      }
    }
    (function scan(child){
      if(ts.isBinaryExpression(child)&&child.getText(ast)==='itemId !== 300016')add('fullHpGuard',child.getStart(ast),child.end,'!isPP');
      ts.forEachChild(child,scan);
    })(node.body);
  }
  ts.forEachChild(node,visit);
})(ast);
assert.deepEqual(counts,{reservation:1,classification:1,oldClassification:2,fullHpGuard:1});
let result=text;
for(const edit of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,edit.start)+edit.replacement+result.slice(edit.end);
assert.equal(ts.createSourceFile(relative,result,ts.ScriptTarget.Latest,true).parseDiagnostics.length,0);
const files=[];
function put(file,bytes){
  const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  files.push({path:file,before:sha(fs.readFileSync(path.join(baseline,file))),after:sha(Buffer.from(bytes))});
}
put(relative,result);
if(fs.existsSync(path.join(baseline,relative+'.map'))){
  const map=JSON.parse(fs.readFileSync(path.join(baseline,relative+'.map'),'utf8'));
  if(map.mappings){map.mappings='';put(relative+'.map',JSON.stringify(map));}
}
const itemFile='app/config/data/xml/items.xml';
const manifest={files,protectedInputs:{[itemFile]:sha(fs.readFileSync(path.join(baseline,itemFile)))},restartGame:true,restartWeb:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
