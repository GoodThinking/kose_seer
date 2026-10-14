import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PetRoomListRspProto, IPetListInfo } from '../../../../../shared/proto/packets/rsp/pet/PetRoomListRspProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';

/**
 * KOSE简表：2303完整库存，2324基地展示名单，2323展示保存确认。
 */
export class PacketPetRoomList extends BaseProto {
  private _data: Buffer;

  constructor(petList: IPetListInfo[], command: number = CommandID.PET_ROOM_LIST) {
    const proto = new PetRoomListRspProto(command);
    super(proto.getCmdId());
    proto.setPetList(petList);
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
