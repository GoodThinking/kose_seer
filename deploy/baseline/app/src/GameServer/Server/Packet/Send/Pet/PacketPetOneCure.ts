import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PetOneCureRspProto } from '../../../../../shared/proto/packets/rsp/pet/PetOneCureRspProto';

/**
 * 恢复单个精灵HP包
 * CMD 2310
 */
export class PacketPetOneCure extends BaseProto {
  private _data: Buffer;

  constructor(catchTime: number) {
    super(CommandID.PET_ONE_CURE);
    
    const proto = new PetOneCureRspProto();
    proto.setCatchTime(catchTime);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
