import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/** 1102 now reports spent and remaining Seer coins as integer units. */
export class PacketMoneyBuyProduct extends BaseProto {
  constructor(private readonly spentCoins: number, private readonly coins: number) {
    super(CommandID.MONEY_BUY_PRODUCT);
  }
  public serialize(): Buffer {
    const body = Buffer.alloc(12);
    body.writeUInt32BE(0, 0);
    body.writeUInt32BE(this.spentCoins, 4);
    body.writeUInt32BE(this.coins, 8);
    return body;
  }
}
