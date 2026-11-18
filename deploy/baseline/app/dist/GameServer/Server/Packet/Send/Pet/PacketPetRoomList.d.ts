import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IPetListInfo } from '../../../../../shared/proto/packets/rsp/pet/PetRoomListRspProto';
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表响应包
 */
export declare class PacketPetRoomList extends BaseProto {
    private _data;
    constructor(petList: IPetListInfo[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketPetRoomList.d.ts.map