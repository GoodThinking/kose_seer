import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP响应
 * 
 * 客户端只需要 catchTime，会在本地更新精灵HP和PP
 */
export class PetOneCureRspProto extends BaseProto {
  private _catchTime: number = 0;

  constructor() {
    super(CommandID.PET_ONE_CURE);
  }

  public setCatchTime(catchTime: number): this {
    this._catchTime = catchTime;
    return this;
  }

  public serialize(): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(this._catchTime, 0);
    return buffer;
  }
}
