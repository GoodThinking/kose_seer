// Independent runtime-reader checks; no server, network or database initialization.
const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {generate,hash,equal,ROOT}=require('./align-xin-pet-data.cjs');
process.chdir(ROOT);
require('ts-node').register({transpileOnly:true});
async function main(){
  const output=generate(),again=generate();
  assert.deepEqual(output.candidates,again.candidates);
  assert.equal(output.summary.pets.added.length,14);
  assert.equal(output.summary.skills.added.length,654);
  const xinIds=new Set(output.source.pets.map(p=>p.ID));
  for(const [id,p] of output.baseline.pets)if(!xinIds.has(id))assert(equal(output.pet.result.get(id),p));
  for(const id of output.summary.skills.xinCommonDifferenceIds)
    assert(output.skill.changes.some(c=>c.id===id)||output.skill.deferred.some(c=>c.id===id));
  const known=new Set(output.source.referenced);
  for(const [id,s] of output.baseline.skills)if(!known.has(id))assert(equal(s,output.skill.result.get(id)));
  for(const entry of output.summary.files){
    const raw=fs.readFileSync(path.join(ROOT,'config/data/xml',entry.file));
    assert.equal(hash(raw),entry.after);assert(!raw.toString().startsWith('\uFEFF'));
  }
  assert.equal(hash(fs.readFileSync('config/data/json/skill_effects_v2.json')),output.summary.effectsBaselineHash);
  const {ConfigRegistry}=require('../src/shared/config/ConfigRegistry');
  const {ConfigKeys,ConfigPaths,ConfigType}=require('../src/shared/config/ConfigDefinitions');
  const {ConfigLoader}=require('../src/shared/config/ConfigLoader');
  const {GameConfig}=require('../src/shared/config/game/GameConfig');
  const {SkillConfig}=require('../src/shared/config/game/SkillConfig');
  const {SptSystem}=require('../src/GameServer/Game/Pet/SptSystem');
  const {PetCalculator}=require('../src/GameServer/Game/Pet/PetCalculator');
  for(const key of [ConfigKeys.PET_CONFIG,ConfigKeys.SKILL_CONFIG,ConfigKeys.SPT_CONFIG])
    ConfigRegistry.Instance.Register(key,ConfigPaths[key],ConfigType.XML);
  await ConfigRegistry.Instance.Initialize();
  for(const file of ['pets.xml','spt.xml','skills.xml']){
    const sync=ConfigLoader.Instance.LoadXmlSync('data/xml/'+file);
    ConfigLoader.Instance.Reload('data/xml/'+file);
    assert.deepEqual(await ConfigLoader.Instance.LoadXml('data/xml/'+file),sync);
  }
  assert.equal(SptSystem.GetAllPetIds().length,2190);
  for(const source of output.source.pets){
    const id=source.ID;assert(GameConfig.GetPetById(id));assert(SptSystem.Exists(id));
    const raw=source.LearnableMoves?.Move;
    const expected=(raw==null?[]:Array.isArray(raw)?raw:[raw]).map(m=>({id:Number(m.ID),level:Number(m.LearningLv)})).sort((a,b)=>a.level-b.level);
    assert.deepEqual(SptSystem.GetLearnableMoves(id),expected);
    for(const level of [1,20,50,70,100])assert.deepEqual(SptSystem.GetDefaultSkills(id,level),expected.filter(m=>m.level<=level).slice(-4));
  }
  for(const id of output.source.referenced)assert(SkillConfig.GetSkill(id),'Missing loaded skill '+id);
  assert.equal(Number(SkillConfig.GetSkill(10030).sideEffectArg),10);
  for(const id of [10938,11030])assert.equal(Number(SkillConfig.GetSkill(id).sideEffect),1901);
  const stats=[];
  for(const id of [100001,2470]){
    const source=output.source.pets.find(p=>p.ID===id);
    const hp=PetCalculator.CalculateHP(id,50,31,0);
    assert.equal(hp,Math.floor((source.HP*2+31)/2)+60);
    const actual={id,hp};
    for(const [stat,field] of Object.entries({atk:'Atk',def:'Def',spAtk:'SpAtk',spDef:'SpDef',speed:'Spd'})){
      actual[stat]=PetCalculator.CalculateStat(id,stat,50,31,0,25);
      assert.equal(actual[stat],Math.floor((source[field]*2+31)/2)+5);
    }
    stats.push(actual);
  }
  const evolution=[[100001,100002,23],[100002,100003,44],[110001,110002,22],[110002,110003,43],[100007,100008,32],[100009,100010,21],[100010,100011,41]];
  for(const [id,target,level] of evolution){
    assert.equal(SptSystem.GetEvolvesTo(id),target);assert.equal(SptSystem.GetEvolvingLevel(id),level);
    assert(!SptSystem.CanEvolve(id,level-1));assert(SptSystem.CanEvolve(id,level));assert(SptSystem.Exists(target));
  }
  assert(!SptSystem.CanEvolve(671,100));
  assert(!Object.keys(require.cache).some(p=>/\/src\/DataBase\//.test(p)),'Unexpected DB module import');
  console.log(JSON.stringify({result:'PASS',reproducibility:true,koseOnlyPreserved:679,sharedSkillDifferencesAccounted:73,petReaders:1511,defaultLearningChecks:7555,loadedSkills:5350,evolutionThresholdPairs:evolution.length,stats,scope:'Configuration and pure runtime readers only; no battle, UI, persistence or XIN formula parity claim'},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
