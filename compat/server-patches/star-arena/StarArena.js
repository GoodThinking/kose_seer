'use strict';
const catalog=require('./StarArenaCatalog.json');
const {DatabaseManager}=require('../../../DataBase/DatabaseManager');
const {GameConfig}=require('../../../shared/config/game/GameConfig');
const {createDefaultPetInfo}=require('../../../shared/models/PetModel');
const {PetCalculator}=require('../Pet/PetCalculator');
const {ReconcilePetPP}=require('../Pet/PetPP');
const {ChampionPetRuntime:Champion}=require('./ChampionPetRuntime');
const {PacketChangePet,PacketEscapeFight}=require('../../Server/Packet/Send/Battle');
const {PacketEmpty}=require('../../Server/Packet/Send/PacketEmpty');
const {CommandID}=require('../../../shared/protocol/CommandID');
const {BattleConverter}=require('./BattleConverter');
const {BaseProto}=require('../../../shared/proto/base/BaseProto');
class PacketStarArena extends BaseProto {
  constructor(operation,progress,result=0){super(91010);this.operation=operation;this.progress=progress;this.setResult(result);}
  serialize(){const p=this.progress||{},data=Buffer.alloc(32);[this.operation,1,p.next_stage||0,catalog.trainers.length,catalog.rewardPetId,p.claimed?1:0,p.champion?1:0,p.run_id||1].forEach((value,index)=>data.writeUInt32BE(value,index*4));return data;}
}
class StarArena {
  static async Progress(uid){
    await DatabaseManager.Instance.Execute('INSERT INTO star_arena_progress(owner_id,next_stage,claimed,champion,run_id) SELECT ?,0,0,0,1 WHERE NOT EXISTS(SELECT 1 FROM star_arena_progress WHERE owner_id=?)',[uid,uid]);
    const rows=await DatabaseManager.Instance.Query('SELECT * FROM star_arena_progress WHERE owner_id=?',[uid]);
    if(rows.length!==1)throw new Error('Arena progress missing');return rows[0];
  }
  static async Reply(player,operation,progress,result=0){return player.SendPacket(new PacketStarArena(operation,progress,result));}
  static async Handle(player,body){
    if(body.length!==8)return this.Reply(player,0,null,5001);
    const operation=body.readUInt32BE(0),expected=body.readUInt32BE(4);
    if(operation>3||player.Data.mapID!==catalog.mapId)return this.Reply(player,operation,null,5001);
    if(operation===0)return this.Reply(player,0,await this.Progress(player.Uid));
    const manager=player.BattleManager,recovery=manager.BeginOutOfBattleRecovery();
    if(!recovery)return this.Reply(player,operation,null,5001);
    let release;
    try{
      const progress=await this.Progress(player.Uid);
      if(!recovery.isCurrent()||progress.next_stage!==expected)return this.Reply(player,operation,progress,5001);
      release=await player.PetManager.PetData.AcquireMutation();
      if(!recovery.isCurrent())return;
      if(operation===1){
        if(progress.next_stage>=catalog.trainers.length)return this.Reply(player,operation,progress,5001);
        const pets=player.PetManager.PetData.GetPetsInBag();
        if(!pets.length)return this.Reply(player,operation,progress,5001);
        await player.PetManager.commitPetRecovery(pets,0);
        if(!recovery.isCurrent())return;
        const trainer=catalog.trainers[progress.next_stage],team=trainer.team.map((pet,index)=>this.BuildOpponent(manager,pet,index));
        const battle=await manager._initService.CreatePVEBattle(team[0].petId,100);
        if(!battle||!recovery.isCurrent())return this.Reply(player,operation,progress,5001);
        battle.enemy=team[0];battle.starArena={stage:progress.next_stage,runId:progress.run_id,trainer,team,index:0};
        recovery.release();manager.InitializeBattle(battle);manager._currentBattleMapId=catalog.mapId;
        await this.Reply(player,operation,progress);
        await manager.SendReadyToFight(battle,trainer.name+' · '+trainer.title);
      }else if(operation===2){
        if(!progress.champion||progress.claimed)return this.Reply(player,operation,progress,progress.claimed?0:5001);
        await this.Claim(player,progress);
        if(recovery.isCurrent()){
          await this.Reply(player,operation,await this.Progress(player.Uid));
          await player.PetManager.SendPetListUpdate();
        }
      }else{
        if(!progress.claimed||progress.next_stage!==catalog.trainers.length)return this.Reply(player,operation,progress,5001);
        const result=await DatabaseManager.Instance.Execute('UPDATE star_arena_progress SET next_stage=0,run_id=run_id+1 WHERE owner_id=? AND run_id=? AND next_stage=? AND claimed=1',[player.Uid,progress.run_id,catalog.trainers.length]);
        if(result.affectedRows!==1)throw new Error('Arena replay conflict');
        if(recovery.isCurrent())await this.Reply(player,operation,await this.Progress(player.Uid));
      }
    }finally{release?.();recovery.release();}
  }
  static BuildOpponent(manager,configured,index){
    const config=GameConfig.GetPetById(configured.petId);
    if(!config)throw new Error(`Arena species missing: ${configured.petId}`);
    const stats=createDefaultPetInfo(0,configured.petId);
    stats.level=100;stats.nature=configured.nature;
    stats.dvHp=stats.dvAtk=stats.dvDef=stats.dvSpAtk=stats.dvSpDef=stats.dvSpeed=31;
    [stats.evHp,stats.evAtk,stats.evDef,stats.evSpAtk,stats.evSpDef,stats.evSpeed]=configured.ev;
    PetCalculator.UpdatePetStats(stats);
    const pet=manager._initService.BuildBattlePet(configured.petId,config.DefName,100,stats.maxHp,stats.maxHp,stats.atk,stats.def,stats.spAtk,stats.spDef,stats.speed,config.Type,configured.skills,1000000000+index,0);
    pet.dv=31;return pet;
  }
  static SelectSkill(battle,configs){
    const pet=battle.enemy,foe=battle.player,style=battle.starArena.trainer.style;
    let best=0,bestScore=-Infinity;
    for(let index=0;index<pet.skills.length;index++){
      if(pet.skillPP[index]<=0)continue;
      const skill=configs.get(pet.skills[index]);if(!skill)continue;
      let score=0;
      const effects=require('./SkillEffectRuntime').SkillEffectRuntime.Entries(skill);
      if(skill.category!==4){
        const atk=skill.category===1?pet.attack:pet.spAtk,def=skill.category===1?foe.defence:foe.spDef;
        const element=require('./ElementSystem').ElementSystem.GetEffectiveness(skill.type,foe.type);
        score=(skill.power||0)*Math.max(.1,atk/Math.max(1,def))*element*(skill.accuracy||100)/100;
        if(style==='aggressive')score*=1.4;
        if(foe.hp<foe.maxHp*.25&&skill.priority>0)score+=70;
      }else{
        for(const effect of effects){
          if([43,450].includes(effect.id)&&pet.hp<pet.maxHp*.65)score+=style==='defensive'?200:110;
          if(effect.id===4){const stat=effect.args[0],change=effect.args[2];if(change>0&&(pet.battleLevels[stat]||0)<2)score+=style==='aggressive'?65:90;}
          if(effect.id===5&&!foe.battleLevels.some(v=>v<=-2))score+=style==='tactical'?100:55;
          if([2,10,13,16,24,29,30].includes(effect.id)&&!require('./SkillEffectRuntime').SkillEffectRuntime.HasStatus(foe))score+=style==='tactical'?125:45;
          if([47,48,57,58,61,191].includes(effect.id)&&!Object.keys(pet.effectStates||{}).some(key=>!key.startsWith('_')))score+=style==='defensive'?90:35;
        }
      }
      if(score>bestScore){bestScore=score;best=skill.id;}
    }
    return best;
  }
  static SpendPP(battle,pet,skill){
    if(!battle.starArena||pet!==battle.enemy||skill.id<=0)return;
    const index=pet.skills.indexOf(skill.id);
    if(index>=0)pet.skillPP[index]=Math.max(0,pet.skillPP[index]-Champion.PPCost(pet));
  }
  static async Finish(manager,winner,reason,valid=()=>true,silent=false){
    const battle=manager._currentBattle,arena=battle?.starArena;
    if(!arena||arena.ending||!valid())return;
    if(battle.player.hp<=0&&!manager.Player.PetManager.PetData.GetPetsInBag().some(pet=>(manager._battlePetHPMap.get(pet.catchTime)??pet.hp)>0))winner=0;
    if(winner===manager.UserID&&battle.enemy.hp<=0){
      const next=arena.team.findIndex((pet,index)=>index>arena.index&&pet.hp>0);
      if(next>=0){
        arena.index=next;battle.enemy=arena.team[next];battle.isOver=false;
        Champion.RestoreState(battle,battle.enemy,'enemy');
        await manager.Player.SendPacket(new PacketChangePet(0,battle.enemy.petId,battle.enemy.name,100,battle.enemy.hp,battle.enemy.maxHp,battle.enemy.catchTime));
        return;
      }
    }
    arena.ending=true;
    const player=manager.Player,pets=player.PetManager.PetData,release=await pets.AcquireMutation();
    try{
      if(manager._currentBattle!==battle||!valid())return;
      const bag=pets.GetPetsInBag();
      const planned=JSON.parse(JSON.stringify(pets.PetList));
      for(const pet of planned)if(pet.isInBag){pet.hp=pet.maxHp;pet.skillPP=ReconcilePetPP(pet,true);}
      await DatabaseManager.Instance.WithConnection(async driver=>{
        let committed=false;await driver.beginTransaction();
        try{
          const petWrite=await driver.execute('UPDATE player_pets SET pet_list=? WHERE owner_id=?',[JSON.stringify(planned),player.Uid]);
          if(petWrite.affectedRows!==1)throw new Error('Arena pet restore failed');
          if(winner===manager.UserID){
            const progressWrite=await driver.execute('UPDATE star_arena_progress SET next_stage=?,champion=CASE WHEN ?=? THEN 1 ELSE champion END WHERE owner_id=? AND next_stage=? AND run_id=?',[arena.stage+1,arena.stage+1,catalog.trainers.length,player.Uid,arena.stage,arena.runId]);
            if(progressWrite.affectedRows!==1)throw new Error('Arena advancement conflict');
          }
          await driver.commit();committed=true;
          for(const pet of bag){const candidate=planned.find(value=>value.catchTime===pet.catchTime);pet.hp=candidate.hp;pet.skillPP=candidate.skillPP;}
        }catch(error){if(!committed)await driver.rollback();throw error;}
      });
      battle.isOver=true;
      if(!silent&&manager._currentBattle===battle&&valid()){
        if(reason===1)await player.SendPacket(new PacketEscapeFight(1));
        await manager.SendFightOverPacket(player,reason||0,winner);
      }
    }finally{release();if(manager._currentBattle===battle)manager.CleanupBattle();}
  }
  static async Claim(player,progress){
    const pets=player.PetManager.PetData;
    let catchTime=Math.max(1000000000,Math.floor(Date.now()/1000));
    while(pets.GetPetByCatchTime(catchTime))catchTime++;
    const releaseIdentity=pets.ReserveIdentity(catchTime);
    try{
      await DatabaseManager.Instance.WithConnection(async driver=>{
        let committed=false;await driver.beginTransaction();
        try{
          const rows=await driver.query('SELECT claimed,champion FROM star_arena_progress WHERE owner_id=?',[player.Uid]);
          if(!rows[0]?.champion||rows[0].claimed)throw new Error('Arena reward unavailable');
          const stored=await driver.query('SELECT pet_list FROM player_pets WHERE owner_id=?',[player.Uid]);
          if(!stored[0]||JSON.parse(stored[0].pet_list).some(p=>p.catchTime===catchTime))throw new Error('Arena grant identity collision');
          const pet=createDefaultPetInfo(player.Uid,catalog.rewardPetId);
          pet.level=pet.obtainLevel=100;pet.catchTime=catchTime;
          pet.dvHp=pet.dvAtk=pet.dvDef=pet.dvSpAtk=pet.dvSpDef=pet.dvSpeed=31;
          PetCalculator.UpdatePetStats(pet);pet.hp=pet.maxHp;
          pet.skillArray=[30944,25581,25582,30948];pet.skillPP=ReconcilePetPP(pet,true);
          pet.isInBag=pets.GetPetsInBag().length<6;pet.isDefault=pets.GetPetsInBag().length===0;
          const petWrite=await driver.execute('UPDATE player_pets SET pet_list=? WHERE owner_id=?',[JSON.stringify([...pets.PetList,pet]),player.Uid]);
          const claimWrite=await driver.execute('UPDATE star_arena_progress SET claimed=1,reward_catch_time=? WHERE owner_id=? AND claimed=0 AND champion=1',[catchTime,player.Uid]);
          if(petWrite.affectedRows!==1||claimWrite.affectedRows!==1)throw new Error('Arena reward commit conflict');
          await driver.commit();committed=true;pets.PetList.push(pet);
        }catch(error){if(!committed)await driver.rollback();throw error;}
      });
      const {PetEventType,PetObtainSource}=require('../Event/EventTypes');
      await player.EventBus.Emit({type:PetEventType.PET_OBTAINED,timestamp:Date.now(),playerId:player.Uid,petId:catalog.rewardPetId,level:100,catchTime,source:PetObtainSource.GIVE});
      await player.PetManager.SendNoteUpdatePropForNewPet(pets.GetPetByCatchTime(catchTime));
    }finally{releaseIdentity();}
  }
  static Install(BattleManager,PetManager){
    Champion.InstallAtomic();
    const wrap=(type,name,fn)=>{const original=type.prototype[name];type.prototype[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
    wrap(BattleManager,'InitializeBattle',function(base,battle){battle.championOwner=this.Player;return base(battle);});
    wrap(BattleManager,'HandleFightOver',function(base,winner,reason,valid){return this._currentBattle?.starArena?StarArena.Finish(this,winner,reason,valid):base(winner,reason,valid);});
    wrap(BattleManager,'EscapeFight',function(base){return this._currentBattle?.starArena?StarArena.Finish(this,0,1):base();});
    wrap(BattleManager,'SendReadyToFight',function(base,battle,nickname){
      if(!battle.starArena)return base(battle,nickname);
      const {PacketNoteReadyToFight}=require('../../Server/Packet/Send/Battle');
      return this.Player.SendPacket(new PacketNoteReadyToFight(this.UserID,this.Player.Data.nick,this.BuildPlayerPetsInfo(),0,nickname,battle.starArena.team.map(pet=>BattleConverter.ToSimplePetInfo(pet)),this.Player.ClientProtocol));
    });
    wrap(BattleManager,'RunBattleAction',function(base,command,action){
      if(this._currentBattle?.starArena&&(this._battleActionsInProgress>0||![CommandID.READY_TO_FIGHT,CommandID.USE_SKILL,CommandID.CHANGE_PET,CommandID.ESCAPE_FIGHT].includes(command)))return this.Player.SendPacket(new PacketEmpty(command).setResult(5001));
      return base(command,action);
    });
    for(const [name,command]of [['HandleUsePetItem',CommandID.USE_PET_ITEM],['HandleCatchMonster',CommandID.CATCH_MONSTER]])wrap(BattleManager,name,function(base,...args){if(this._currentBattle?.starArena)return this.Player.SendPacket(new PacketEmpty(command).setResult(5001));return base(...args);});
    for(const [name,command]of [['HandlePetRelease',CommandID.PET_RELEASE],['HandlePetTakeOut',CommandID.PET_RELEASE],['HandlePetDefault',CommandID.PET_DEFAULT],['HandleMovePetToStorage',CommandID.PET_BARGE_LIST],['HandleMovePetToBag',CommandID.PET_BARGE_LIST]])wrap(PetManager,name,function(base,...args){if(this.Player.BattleManager._currentBattle?.starArena)return this.Player.SendPacket(new PacketEmpty(command).setResult(5001));return base(...args);});
  }
}
exports.StarArena=StarArena;exports.PacketStarArena=PacketStarArena;
