import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 扭蛋机请求
 * CMD 3201
 * 
 * 请求格式：按钮编号(4)
 * - 1 = 单抽
 * - 2 = 5连抽
 * - 3 = 10连抽
 */
export class GachaReqProto extends BaseProto {
  public times: number = 1;

  constructor() {
    super(CommandID.EGG_GAME_PLAY);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      const btn = buffer.readUInt32BE(0);
      switch (btn) {
        case 1:
          this.times = 1;
          break;
        case 2:
          this.times = 5;
          break;
        case 3:
          this.times = 10;
          break;
        default:
          this.times = 1;
      }
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
