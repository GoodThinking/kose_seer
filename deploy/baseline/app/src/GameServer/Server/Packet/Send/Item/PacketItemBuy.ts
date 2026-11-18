import { ItemBuyRspProto } from '../../../../../shared/proto/packets/rsp/item/ItemBuyRspProto';

/**
 * 物品购买/获得数据包
 * CommandID: ITEM_BUY (2601)
 * 
 * 直接返回Proto对象，由SendPacket处理
 */
export class PacketItemBuy extends ItemBuyRspProto {
  constructor(cash: number, itemID: number, itemNum: number, itemLevel: number) {
    super(cash, itemID, itemNum, itemLevel);
  }
}
