import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { ChangePetRspProto } from '../../../../../shared/proto/packets/rsp/battle/ChangePetRspProto';

/**
 * 更换精灵包
 * CMD 2407
 */
export class PacketChangePet extends BaseProto {
  private _data: Buffer;

  constructor(
    userId: number,
    petId: number,
    petName: string,
    level: number,
    hp: number,
    maxHp: number,
    catchTime: number
  ) {
    super(CommandID.CHANGE_PET);
    
    const proto = new ChangePetRspProto();
    proto.setUserId(userId);
    proto.setPetId(petId);
    proto.setPetName(petName);
    proto.setLevel(level);
    proto.setHP(hp, maxHp);
    proto.setCatchTime(catchTime);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
