import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP请求
 */
export class PetOneCureReqProto extends BaseProto {
  public catchTime: number = 0;
  public coins: number = 0; // 客户端发送的赛尔豆数量（可选）

  constructor() {
    super(CommandID.PET_ONE_CURE);
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    
    // 使用大端序读取 catchTime
    this.catchTime = buffer.readUInt32BE(offset);
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
