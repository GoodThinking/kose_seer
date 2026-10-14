/* Fixed-input, exact-ID data alignment. Default: preview only. --write performs
 * a guarded mechanical rewrite of only pets.xml/spt.xml/skills.xml and writes
 * evidence under work/round12-data-align. No DB/server/effect implementation. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const {execFileSync} = require('child_process');
const {XMLParser} = require('fast-xml-parser');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'fda0e32bf16fa73e3cadf0dac94a022a617aa211';
const SOURCE_HASHES = {
  'monsters.json': 'a1c0ce6d5078f4c7b41e37bb2a8a7f21383d586e79a750b051bc97c9172f9204',
  'moves.json': '60902138866ac1188a2f661b43bd80bba529e1ace0070290e31e23ba6448ef58',
};
const BASE_HASHES = {
  'pets.xml': '9eb5eee78631d380ef096cf194be59e5a7cdf303f8a5b97559ea1fe8e201f689',
  'spt.xml': 'da1e0338502c7c52cdf399ba9f2002d2d1bdc948668d66a812ee2c7a6d516555',
  'skills.xml': 'bc786073ca3d76b83ec56edc46386b06beda0b26636d0fea8e9107cc51b31295',
};
// Field consumers are documented in TASK_RESULT_ROUND12.md and tested using the real loaders.
const PET_FIELDS = ['DefName','Type','Type2','GrowthType','HP','Atk','Def','SpAtk','SpDef','Spd',
  'YieldingExp','CatchRate','EvolvesFrom','EvolvesTo','EvolvingLv','FreeForbidden','IsRareMon','IsDark',
  'LearnableMoves','ExtraMoves'];
const SKILL_FIELDS = ['Name','Category','Type','Power','MaxPP','Accuracy','CritRate','Priority',
  'MustHit','SideEffect','SideEffectArg'];
const parser = new XMLParser({ignoreAttributes:false,attributeNamePrefix:'',parseAttributeValue:true});
const hash = v => crypto.createHash('sha256').update(v).digest('hex');
const list = v => v == null ? [] : Array.isArray(v) ? v : [v];
const sorted = v => [...new Set(v)].sort((a,b)=>a-b);
const refs = p => sorted(list(p.LearnableMoves?.Move).map(m=>Number(m.ID)).concat(list(p.ExtraMoves?.Move).map(m=>Number(m.ID??m))));
function canonical(v,key='') {
  if(v===undefined)return null;
  if(key==='Move')return list(v).map(x=>canonical(x));
  if(Array.isArray(v))return v.map(x=>canonical(x));
  if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k],k)]));
  if(typeof v==='string') { const s=v.trim().replace(/\s+/g,' ');return /^-?\d+(\.\d+)?$/.test(s)?Number(s):s; }
  return v;
}
const equal = (a,b) => JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function keyed(rows) {
  const m=new Map();for(const row of rows){assert(Number.isSafeInteger(row.ID)&&row.ID>0);assert(!m.has(row.ID),'Duplicate ID '+row.ID);m.set(row.ID,row);}return m;
}
function attr(v) {
  assert(['number','string'].includes(typeof v),'Non-scalar XML attribute');
  if(typeof v==='number')assert(Number.isFinite(v));
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(String(v)),'Invalid XML control character');
  return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function child(key,value) {
  assert.deepEqual(Object.keys(value),['Move'],'Unsupported nested schema '+key);
  if(key==='LearnableMoves')return `<LearnableMoves>\n${list(value.Move).map(m=>{
    const id=Number(m.ID),level=Number(m.LearningLv);
    assert(/^\d+$/.test(String(m.ID))&&Number.isSafeInteger(id)&&id>0);
    assert(/^\d+$/.test(String(m.LearningLv))&&Number.isSafeInteger(level));
    return `\t\t\t<Move ID="${id}" LearningLv="${level}"${Object.keys(m).filter(k=>!['ID','LearningLv'].includes(k)).map(k=>` ${k}="${attr(m[k])}"`).join('')} />`;
  }).join('\n')}\n\t\t</LearnableMoves>`;
  assert(key==='ExtraMoves');
  return `<ExtraMoves>${list(value.Move).map(id=>{assert(Number.isInteger(id)&&id>0);return `<Move>${id}</Move>`;}).join('')}</ExtraMoves>`;
}
function render(tag,row) {
  const children=Object.keys(row).filter(k=>typeof row[k]==='object');
  const attributes=Object.keys(row).filter(k=>!children.includes(k)).map(k=>`${k}="${attr(row[k])}"`).join(' ');
  return children.length?`<${tag} ${attributes}>\n${children.map(k=>'\t\t'+child(k,row[k])).join('\n')}\n\t</${tag}>`:`<${tag} ${attributes} />`;
}
function rewrite(text,tag,before,after,appendBefore) {
  let found=0;
  const re=tag==='Monster'?/<!--[\s\S]*?-->|<Monster\b[^>]*(?:\/>|>[\s\S]*?<\/Monster>)/g:/<!--[\s\S]*?-->|<Move\b[^>]*\/>/g;
  text=text.replace(re,block=>{
    if(block.startsWith('<!--'))return block;
    const m=/\bID="(\d+)"/.exec(block);assert(m,'ID missing');const id=Number(m[1]);found++;
    const old=before.get(id),next=after.get(id);assert(old&&next);
    if(equal(old,next))return block;
    let open=block.slice(0,block.indexOf('>')+1),rest=block.slice(open.length);
    for(const key of new Set([...Object.keys(old),...Object.keys(next)])) {
      if(equal(old[key],next[key]))continue;
      if(['LearnableMoves','ExtraMoves'].includes(key)) {
        const r=new RegExp(`<${key}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/${key}>)`);
        if(r.test(rest))rest=rest.replace(r,existing=>{
          if(next[key]===undefined)return '';
          if(key==='LearnableMoves'&&Object.keys(next[key]).some(k=>k!=='Move')) {
            // Only replace confirmed Move children; retain unknown baseline children verbatim.
            let used=false;
            const newMoves=child(key,{Move:next[key].Move}).replace(/^<LearnableMoves>\n|\n\t\t<\/LearnableMoves>$/g,'').trim();
            const replaced=existing.replace(/<Move\b[^>]*\/>/g,()=>{if(used)return '';used=true;return newMoves;});
            assert(used,'No existing Move anchor');return replaced.replace(/^[\t ]+$/gm,'');
          }
          return child(key,next[key]);
        });
        else if(next[key]!==undefined) {
          if(open.endsWith('/>')){open=open.replace(/\/>$/, '>');rest=`\n\t</${tag}>`;}
          rest=rest.replace(`</${tag}>`,`\t${child(key,next[key])}\n\t</${tag}>`);
        }
      } else {
        const r=new RegExp(`\\s+${key}="[^"]*"`);
        if(next[key]===undefined)open=open.replace(r,'');
        else if(r.test(open))open=open.replace(r,match=>match.replace(/="[^"]*"$/,`="${attr(next[key])}"`));
        else open=open.replace(/\s*\/?>$/,end=>` ${key}="${attr(next[key])}"${end}`);
      }
    }
    return open+rest;
  });
  assert.equal(found,before.size,'Raw XML inventory mismatch');
  const added=[...after.keys()].filter(id=>!before.has(id)).sort((a,b)=>a-b);
  assert.equal(text.split(appendBefore).length,2,'Ambiguous append point');
  if(added.length)text=text.replace(new RegExp('^[\\t ]*'+appendBefore,'m'),added.map(id=>'\t'+render(tag,after.get(id))).join('\n')+'\n'+appendBefore);
  return text.replace(/^\uFEFF/,''); // UTF-8 without BOM; no whole-file reformatting.
}
function alignmentReason(kind,id,key,incoming) {
  if(kind==='pet'&&['EvolvesFrom','EvolvesTo','EvolvingLv'].includes(key)&&Number(incoming.EvolvFlag)>0)
    return 'Triggered evolution gate is not enforced by current SptSystem/PetManager; preserve coupled evolution fields.';
  if(kind==='skill'&&key==='SideEffect'&&incoming.PwrBindDv!==undefined)
    return 'PwrBindDv is not consumed by SkillConfig; do not remove legacy sideEffect while withholding its replacement flag.';
  return null;
}
function merge(kind,source,baseline,allowed) {
  const result=new Map(baseline),changes=[],deferred=[];
  for(const incoming of source) {
    const old=baseline.get(incoming.ID)||{},next={...old,ID:incoming.ID};
    for(const key of new Set([...Object.keys(old),...Object.keys(incoming)])) {
      if(key==='ID'||equal(old[key],incoming[key]))continue;
      const reason=allowed.includes(key)?alignmentReason(kind,incoming.ID,key,incoming):'No confirmed KOSE runtime consumer/mapping; preserve baseline or omit new field.';
      if(!reason&&kind==='pet'&&key==='LearnableMoves') {
        for(const sub of new Set([...Object.keys(old[key]||{}),...Object.keys(incoming[key]||{})])) {
          if(sub==='Move'||equal(old[key]?.[sub],incoming[key]?.[sub]))continue;
          deferred.push({id:incoming.ID,field:key+'.'+sub,before:{present:old[key]?.[sub]!==undefined,value:old[key]?.[sub]??null},xin:{present:incoming[key]?.[sub]!==undefined,value:incoming[key]?.[sub]??null},reason:'Only LearnableMoves.Move is consumed; no SpMove learning semantics inferred.'});
        }
        const oldMoves=new Map(list(old[key]?.Move).map(m=>[Number(m.ID),m]));
        const projected=list(incoming[key]?.Move).map(m=>{
          const previous=oldMoves.get(Number(m.ID))||{};
          for(const field of new Set([...Object.keys(previous),...Object.keys(m)])) {
            if(['ID','LearningLv'].includes(field)||equal(previous[field],m[field]))continue;
            deferred.push({id:incoming.ID,field:`LearnableMoves.Move[${m.ID}].${field}`,before:{present:previous[field]!==undefined,value:previous[field]??null},xin:{present:m[field]!==undefined,value:m[field]??null},reason:'Only ID and LearningLv have confirmed learning consumers; preserve baseline metadata.'});
          }
          return {...previous,ID:Number(m.ID),LearningLv:Number(m.LearningLv)};
        });
        if(equal(list(old[key]?.Move),projected))continue;
        next[key]={...old[key]};
        if(incoming[key]?.Move!==undefined)next[key].Move=projected;else delete next[key].Move;
        changes.push({id:incoming.ID,field:key+'.Move',before:{present:old[key]?.Move!==undefined,value:old[key]?.Move??null},xin:{present:incoming[key]?.Move!==undefined,value:incoming[key]?.Move??null}});
        continue;
      }
      const delta={id:incoming.ID,field:key,before:{present:old[key]!==undefined,value:old[key]??null},xin:{present:incoming[key]!==undefined,value:incoming[key]??null}};
      if(reason){deferred.push({...delta,reason});continue;}
      if(incoming[key]===undefined)delete next[key];else next[key]=structuredClone(incoming[key]);
      changes.push(delta);
    }
    result.set(incoming.ID,next);
  }
  return {result,changes,deferred};
}
function generate(options={}) {
  const sourceDir=options.sourceDir||path.resolve(ROOT,'../xin-site-research/public/game/assets/json');
  const readSource=name=>{const bytes=fs.readFileSync(path.join(sourceDir,name));assert.equal(hash(bytes),SOURCE_HASHES[name],'Unbound source '+name);return JSON.parse(bytes);};
  const xp=readSource('monsters.json').Monsters.Monster,xs=readSource('moves.json').MovesTbl.Moves.Move;
  const xpi=keyed(xp),xsi=keyed(xs),referenced=sorted(xp.flatMap(refs));
  assert.equal(xpi.size,1511);assert.equal(referenced.length,5350);assert(referenced.every(id=>xsi.has(id)));
  const original={},parsed={};
  for(const file of Object.keys(BASE_HASHES)) {
    const raw=execFileSync('git',['show',`${BASE}:config/data/xml/${file}`],{cwd:ROOT,maxBuffer:16*1024*1024});
    assert.equal(hash(raw),BASE_HASHES[file],'Unbound baseline '+file);
    original[file]=raw.toString('utf8');parsed[file]=parser.parse(original[file]);
  }
  const kp=keyed(parsed['pets.xml'].Monsters.Monster),sp=keyed(parsed['spt.xml'].Monsters.Monster),ks=keyed(parsed['skills.xml'].MovesTbl.Moves.Move);
  assert(equal([...kp.values()],[...sp.values()]));
  const pet=merge('pet',xp,kp,PET_FIELDS),skill=merge('skill',referenced.map(id=>xsi.get(id)),ks,SKILL_FIELDS);
  const candidates={
    'pets.xml':rewrite(original['pets.xml'],'Monster',kp,pet.result,'</Monsters>'),
    'spt.xml':rewrite(original['spt.xml'],'Monster',sp,pet.result,'</Monsters>'),
    'skills.xml':rewrite(original['skills.xml'],'Move',ks,skill.result,'</Moves>'),
  };
  // Round-trip the complete generated XML; no silent field/namespace loss.
  for(const file of ['pets.xml','spt.xml'])assert(equal(parser.parse(candidates[file]).Monsters.Monster,[...pet.result.values()]));
  assert(equal(parser.parse(candidates['skills.xml']).MovesTbl.Moves.Move,[...skill.result.values()]));
  const finalRefs=sorted(xp.flatMap(p=>refs(pet.result.get(p.ID))));
  assert(finalRefs.every(id=>skill.result.has(id)),'Candidate skill references not closed');
  const effectsRaw=fs.readFileSync(path.join(ROOT,'config/data/json/skill_effects_v2.json'));
  const ei=new Map(JSON.parse(effectsRaw).effects.map(e=>[e.effectId,e]));
  const effectRefs=new Map();
  for(const id of referenced)for(const eid of String(xsi.get(id).SideEffect??'').split(/\s+/).map(Number).filter(x=>x>0)) {
    const ids=effectRefs.get(eid)||[];ids.push(id);effectRefs.set(eid,ids);
  }
  const effectCoverage=[...effectRefs].sort(([a],[b])=>a-b).map(([id,ids])=>{
    const e=ei.get(id);return {effectId:id,skillIds:sorted(ids),status:!e?'missing_config':!e.atomicComposition?.atoms?.length?'missing_atoms':e.implemented===false?'declared_unimplemented':'atomic_config_present_execution_unverified'};
  });
  const unknownFields={pet:{},skill:{}};
  for(const [kind,rows,fields] of [['pet',xp,PET_FIELDS],['skill',referenced.map(id=>xsi.get(id)),SKILL_FIELDS]])
    for(const r of rows)for(const key of Object.keys(r))if(key!=='ID'&&!fields.includes(key))(unknownFields[kind][key]??=[]).push(r.ID);
  const summary={baselineCommit:BASE,sourceHashes:SOURCE_HASHES,scope:'1511 XIN pets / 5350 referenced skills; no executable effect/trait support claim',
    pets:{before:kp.size,after:pet.result.size,added:[...pet.result.keys()].filter(id=>!kp.has(id)),updated:sorted(pet.changes.filter(c=>kp.has(c.id)).map(c=>c.id)),preservedKoseOnly:[...kp.keys()].filter(id=>!xpi.has(id)).length},
    skills:{before:ks.size,after:skill.result.size,added:referenced.filter(id=>!ks.has(id)),updated:sorted(skill.changes.filter(c=>ks.has(c.id)).map(c=>c.id)),xinCommonDifferenceIds:referenced.filter(id=>ks.has(id)&&!equal(xsi.get(id),ks.get(id)))},
    referenceClosure:{xinPetIds:xp.length,sourceSkillIds:referenced.length,candidateSkillIds:finalRefs.length,missing:finalRefs.filter(id=>!skill.result.has(id))},
    fieldChanges:{pet:pet.changes.length,skill:skill.changes.length},deferredFields:{pet:pet.deferred.length,skill:skill.deferred.length},
    effectCounts:Object.fromEntries([...new Set(effectCoverage.map(e=>e.status))].map(s=>[s,effectCoverage.filter(e=>e.status===s).length])),
    effectsBaselineHash:hash(effectsRaw),files:Object.keys(candidates).map(file=>({file,before:BASE_HASHES[file],after:hash(candidates[file])}))};
  return {summary,candidates,pet,skill,baseline:{pets:kp,skills:ks},source:{pets:xp,skills:xs,referenced},
    reports:{'summary.json':summary,'pet-field-changes.json':pet.changes,'skill-field-changes.json':skill.changes,
      'deferred-fields.json':{pets:pet.deferred,skills:skill.deferred},'effect-coverage.json':effectCoverage,
      'unverified-field-coverage.json':unknownFields}};
}
function writeGenerated(output) {
  // Guard all three before any write, preserving unexpected concurrent edits.
  for(const entry of output.summary.files) {
    const current=hash(fs.readFileSync(path.join(ROOT,'config/data/xml',entry.file)));
    assert([entry.before,entry.after].includes(current),'Unexpected local edit: '+entry.file);
  }
  for(const [file,text] of Object.entries(output.candidates))fs.writeFileSync(path.join(ROOT,'config/data/xml',file),text,'utf8');
  const dir=path.join(ROOT,'work/round12-data-align');fs.mkdirSync(dir,{recursive:true});
  for(const [file,value] of Object.entries(output.reports))fs.writeFileSync(path.join(dir,file),JSON.stringify(value,null,2)+'\n','utf8');
}
module.exports={generate,writeGenerated,hash,equal,refs,PET_FIELDS,SKILL_FIELDS,SOURCE_HASHES,BASE_HASHES,ROOT};
if(require.main===module) {
  const args=process.argv.slice(2);assert(args.every(x=>x==='--write'),'Only --write is supported');
  const output=generate();if(args.includes('--write'))writeGenerated(output);
  console.log(JSON.stringify({...output.summary,skills:{...output.summary.skills,added:output.summary.skills.added.length}},null,2));
}
