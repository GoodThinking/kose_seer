import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldBuyProductRspProto } from '../../../../../shared/proto/packets/rsp/user/GoldBuyProductRspProto';

/**
 * 使用金豆购买商品响应包
 * CMD 1104
 */
export class PacketGoldBuyProduct extends BaseProto {
  private _data: Buffer;

  constructor(payGold: number, remainingGold: number) {
    super(CommandID.GOLD_BUY_PRODUCT);
    
    const proto = new GoldBuyProductRspProto();
    proto.setUnknown(0);
    proto.setPayGold(payGold * 100);  // 转换为 * 100
    proto.setGold(remainingGold * 100);  // 转换为 * 100
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
