import { BaseProto } from '../../../base/BaseProto';
import { BufferWriter } from '../../../../utils';
import { CommandID } from '../../../../protocol/CommandID';
import { ClientProtocol } from '../../../../protocol/ClientProtocol';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 金豆余额及 KOSE 金币读回
 */
export class GoldOnlineCheckRemainRspProto extends BaseProto {
  gold: number = 0;  // 金豆百分单位
  coins: number = 0;

  constructor() {
    super(CommandID.GOLD_ONLINE_CHECK_REMAIN);
  }

  serialize(protocol: ClientProtocol = 'kose'): Buffer {
    const writer = new BufferWriter(protocol === 'kose' ? 8 : 4);
    writer.WriteUInt32(this.gold);
    if (protocol === 'kose') writer.WriteUInt32(this.coins);
    return writer.ToBuffer();
  }

  setGold(gold: number): this {
    this.gold = gold;
    return this;
  }

  setCoins(coins: number): this {
    if (!Number.isSafeInteger(coins) || coins < 0 || coins > 0xffffffff) {
      throw new Error('Coins cannot be encoded as uint32');
    }
    this.coins = coins;
    return this;
  }
}
