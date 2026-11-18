import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldCheckRemainRspProto } from '../../../../../shared/proto/packets/rsp/user/GoldCheckRemainRspProto';

/**
 * 查询赛尔豆余额响应包
 * CMD 1105
 */
export class PacketGoldCheckRemain extends BaseProto {
  private _data: Buffer;

  constructor(coins: number) {
    super(CommandID.GOLD_CHECK_REMAIN);
    
    const proto = new GoldCheckRemainRspProto();
    proto.setCoins(coins);
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
