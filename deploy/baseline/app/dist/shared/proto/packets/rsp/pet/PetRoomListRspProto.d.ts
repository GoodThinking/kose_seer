import { BaseProto } from '../../../base/BaseProto';
/**
 * 精灵列表信息（简化版）
 */
export interface IPetListInfo {
    id: number;
    catchTime: number;
    skinID: number;
}
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表响应
 *
 * 格式：
 * - count (uint32): 精灵数量
 * - 多个 PetListInfo:
 *   - id (uint32): 精灵ID
 *   - catchTime (uint32): 捕获时间
 *   - skinID (uint32): 皮肤ID
 */
export declare class PetRoomListRspProto extends BaseProto {
    petList: IPetListInfo[];
    constructor();
    serialize(): Buffer;
    setPetList(petList: IPetListInfo[]): this;
}
//# sourceMappingURL=PetRoomListRspProto.d.ts.map