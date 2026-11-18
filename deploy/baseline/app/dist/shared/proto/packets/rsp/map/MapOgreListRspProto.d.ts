import { BaseProto } from '../../../base/BaseProto';
/**
 * 地图野怪槽位信息
 */
export interface IOgreSlot {
    petId: number;
    shiny: number;
}
/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应
 *
 * 协议格式（Lua 端格式）：
 * - 前 9 个 uint32: petId (36 bytes)
 * - 后 9 个 uint32: shiny (36 bytes)
 * - 总共 72 bytes
 * */
export declare class MapOgreListRspProto extends BaseProto {
    ogres: IOgreSlot[];
    constructor();
    serialize(): Buffer;
    /**
     * 设置槽位数据
     */
    setSlot(index: number, petId: number, shiny: number): this;
    /**
     * 批量设置槽位数据
     */
    setOgres(ogres: IOgreSlot[]): this;
}
//# sourceMappingURL=MapOgreListRspProto.d.ts.map