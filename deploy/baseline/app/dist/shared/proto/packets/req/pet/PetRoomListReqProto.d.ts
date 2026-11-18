import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表请求
 */
export declare class PetRoomListReqProto extends BaseProto {
    roomType: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetRoomListReqProto;
}
//# sourceMappingURL=PetRoomListReqProto.d.ts.map