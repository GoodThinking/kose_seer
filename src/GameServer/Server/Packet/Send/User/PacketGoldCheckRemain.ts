import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldCheckRemainRspProto } from '../../../../../shared/proto/packets/rsp/user/GoldCheckRemainRspProto';
import { GoldToWire } from '../../../../../shared/protocol/GoldCurrency';

/**
 * 查询金豆余额响应包（整金豆输入，百分单位输出）
 * CMD 1105
 */
export class PacketGoldCheckRemain extends BaseProto {
  private _data: Buffer;

  constructor(gold: number) {
    super(CommandID.GOLD_CHECK_REMAIN);
    
    const proto = new GoldCheckRemainRspProto();
    proto.setCoins(GoldToWire(gold));
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
