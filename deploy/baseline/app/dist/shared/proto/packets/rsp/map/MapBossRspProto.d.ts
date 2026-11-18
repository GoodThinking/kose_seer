import { BaseProto } from '../../../base/BaseProto';
/**
 * BOSS信息
 */
export interface IBossInfo {
    id: number;
    region: number;
    hp: number;
    pos: number;
}
/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应
 *
 * 协议格式：
 * - uint32: len (BOSS数量)
 * - 循环 len 次：
 *   - uint32: id (BOSS精灵ID)
 *   - uint32: region (区域/槽位)
 *   - uint32: hp (HP)
 *   - uint32: pos (位置，200表示移除)
 */
export declare class MapBossRspProto extends BaseProto {
    bosses: IBossInfo[];
    constructor();
    serialize(): Buffer;
    /**
     * 添加BOSS
     */
    addBoss(id: number, region: number, hp: number, pos: number): this;
    /**
     * 批量设置BOSS
     */
    setBosses(bosses: IBossInfo[]): this;
}
//# sourceMappingURL=MapBossRspProto.d.ts.map