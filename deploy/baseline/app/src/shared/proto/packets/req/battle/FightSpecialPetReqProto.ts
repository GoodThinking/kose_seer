import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚请求
 */
export class FightSpecialPetReqProto extends BaseProto {
  public param2: number = 0;

  constructor() {
    super(CommandID.FIGHT_SPECIAL_PET);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.param2 = buffer.readUInt32BE(0);
    }
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this.param2, 0);
    return buffer;
  }

  static fromBuffer(buffer: Buffer): FightSpecialPetReqProto {
    const proto = new FightSpecialPetReqProto();
    proto.deserialize(buffer);
    return proto;
  }
}
