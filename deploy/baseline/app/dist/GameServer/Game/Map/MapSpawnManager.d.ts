/**
 * 地图野怪刷新管理器
 * 负责管理玩家在地图的野怪刷新状态
 *
 * 功能：
 * 1. 玩家进入地图时随机刷新
 * 2. 在地图内不刷新（除非战斗结束且是最后一只）
 * 3. 离开地图后清除状态
 * 4. 战斗结束移除对应野怪
 */
import { BaseManager } from '../Base/BaseManager';
/**
 * 单个野怪刷新状态
 */
export interface ISpawnedOgre {
    petId: number;
    shiny: number;
    originalPetId: number;
    slot: number;
    spawnTime: number;
    isVisible: boolean;
}
/**
 * 地图野怪刷新管理器
 */
export declare class MapSpawnManager extends BaseManager {
    /** 当前地图ID */
    private _currentMapId;
    /** 当前刷新的野怪列表 */
    private _ogres;
    /** 进入地图时间 */
    private _enterTime;
    /**
     * 玩家进入地图（生成新的野怪列表）
     * @param mapId 地图ID
     */
    OnEnterMap(mapId: number): void;
    /**
     * 玩家离开地图（清除状态）
     */
    OnLeaveMap(): void;
    /**
     * 获取当前地图的野怪列表
     * @param mapId 地图ID（用于验证）
     * @returns 9个槽位的野怪列表
     */
    GetMapOgres(mapId: number): Array<{
        petId: number;
        shiny: number;
        originalPetId: number;
    }>;
    /**
     * 战斗结束后移除野怪
     * @param slot 槽位索引
     */
    OnBattleEnd(slot: number): void;
    /**
     * 检查BOSS是否应该刷新
     * @param petId BOSS精灵ID
     * @param mapId 地图ID
     * @param refreshConfig 刷新配置
     * @returns 是否应该刷新
     */
    private ShouldBossSpawn;
    /**
     * 生成地图野怪列表
     * @param mapId 地图ID
     * @returns 野怪列表
     */
    private GenerateOgres;
    /**
     * 获取地图的BOSS列表
     * @param mapId 地图ID
     * @returns BOSS信息列表
     */
    GetMapBosses(mapId: number): Array<{
        id: number;
        region: number;
        hp: number;
        pos: number;
    }>;
    /**
     * 移除BOSS（战斗结束后）
     * @param region BOSS区域/槽位
     * @returns 移除的BOSS信息（用于推送）
     */
    RemoveBoss(region: number): {
        id: number;
        region: number;
        hp: number;
        pos: number;
    } | null;
}
//# sourceMappingURL=MapSpawnManager.d.ts.map