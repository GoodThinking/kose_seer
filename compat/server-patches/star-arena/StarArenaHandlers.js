'use strict';
const {Opcode,InjectType}=require('../../../../../shared/decorators');
const {BaseProto}=require('../../../../../shared/proto/base/BaseProto');
const {PacketEmpty}=require('../../Send/PacketEmpty');
const {Logger}=require('../../../../../shared/utils');
const {StarArena}=require('../../../../Game/Battle/StarArena');
const {BattleManager}=require('../../../../Game/Battle/BattleManager');
const {PetManager}=require('../../../../Game/Pet/PetManager');
StarArena.Install(BattleManager,PetManager);
class StarArenaHandler {
  async Handle(session,_head,body){
    if(!session.Player)return;
    try{await StarArena.Handle(session.Player,body);}
    catch(error){Logger.Error('[StarArena] Request failed; committed progress and grants are not replayed',error);await session.Player.SendPacket(new PacketEmpty(91010).setResult(5000));}
  }
}
class PacketBattlePP extends BaseProto {
  constructor(pet){super(91012);this.pet=pet;}
  serialize(){const pet=this.pet,data=Buffer.alloc(8+(pet?.skills.length||0)*8);data.writeUInt32BE(pet?.catchTime||0,0);data.writeUInt32BE(pet?.skills.length||0,4);pet?.skills.forEach((skill,index)=>{data.writeUInt32BE(skill,8+index*8);data.writeUInt32BE(pet.skillPP[index],12+index*8);});return data;}
}
class BattlePPHandler {
  async Handle(session,_head,body){
    const player=session.Player;if(!player)return;
    const battle=player.BattleManager._currentBattle;
    if(body.length!==4||!battle||body.readUInt32BE(0)!==battle.player.catchTime)return player.SendPacket(new PacketEmpty(91012).setResult(5001));
    await player.SendPacket(new PacketBattlePP(battle.player));
  }
}
exports.StarArenaHandler=Opcode(91010,InjectType.NONE)(StarArenaHandler)||StarArenaHandler;
exports.BattlePPHandler=Opcode(91012,InjectType.NONE)(BattlePPHandler)||BattlePPHandler;
