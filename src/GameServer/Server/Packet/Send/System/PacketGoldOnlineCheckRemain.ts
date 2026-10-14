import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldOnlineCheckRemainRspProto } from '../../../../../shared/proto/packets/rsp/system/GoldOnlineCheckRemainRspProto';
import { GoldToWire } from '../../../../../shared/protocol/GoldCurrency';
import { ClientProtocol } from '../../../../../shared/protocol/ClientProtocol';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 金豆余额（整金豆输入，百分单位输出）
 */
export class PacketGoldOnlineCheckRemain extends BaseProto {
  private readonly _proto: GoldOnlineCheckRemainRspProto;

  constructor(gold: number, coins: number) {
    super(CommandID.GOLD_ONLINE_CHECK_REMAIN);
    
    const proto = new GoldOnlineCheckRemainRspProto();
    proto.setGold(GoldToWire(gold));
    proto.setCoins(coins);
    this._proto = proto;
  }

  public serialize(protocol: ClientProtocol = 'kose'): Buffer {
    return this._proto.serialize(protocol);
  }
}
