import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { FightOverRspProto } from '../../../../../shared/proto/packets/rsp/battle/FightOverRspProto';

/**
 * 战斗结束包
 * CMD 2506
 */
export class PacketFightOver extends BaseProto {
  private _data: Buffer;

  constructor(
    reason: number, 
    winnerId: number,
    twoTimes: number = 0,
    threeTimes: number = 0,
    autoFightTimes: number = 0,
    energyTimes: number = 0,
    learnTimes: number = 0
  ) {
    super(CommandID.FIGHT_OVER);
    
    const proto = new FightOverRspProto();
    proto.setReason(reason);
    proto.setWinnerId(winnerId);
    proto.setTwoTimes(twoTimes);
    proto.setThreeTimes(threeTimes);
    proto.setAutoFightTimes(autoFightTimes);
    proto.setEnergyTimes(energyTimes);
    proto.setLearnTimes(learnTimes);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
