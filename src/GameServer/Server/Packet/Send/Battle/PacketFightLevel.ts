import { BaseProto } from '../../../../../shared/proto/base/BaseProto';

/** 2414 / 2415：当前层 + 这一层要出现的精灵编号。 */
export class PacketFightLevel extends BaseProto {
  private body: Buffer;

  constructor(cmdId: number, level: number, bosses: number[]) {
    super(cmdId);
    const body = Buffer.alloc(8 + bosses.length * 4);
    body.writeUInt32BE(level, 0);
    body.writeUInt32BE(bosses.length, 4);
    bosses.forEach((id, index) => body.writeUInt32BE(id, 8 + index * 4));
    this.body = body;
  }

  public serialize(): Buffer {
    return this.body;
  }
}
