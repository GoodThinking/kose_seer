/**
 * 单个精灵的刷新配置
 */
export interface IOgreRefreshConfig {
    enabled: boolean;
    refreshInterval: number;
    refreshOnEmpty: boolean;
    refreshAtNight: boolean;
    refreshAtDay: boolean;
    startTime: string;
    endTime: string;
    useInterval: boolean;
    useSchedule: boolean;
    scheduleTime: string[];
    shinyRate: number;
    shinyPetId: number;
}
/**
 * 野怪掉落物品配置
 */
export interface IOgreDropItem {
    itemId: number;
    dropRate: number;
    minCount: number;
    maxCount: number;
}
/**
 * 地图怪物槽位配置
 */
export interface IMapOgreSlot {
    slot: number;
    petId: number;
    shiny: number;
    weight: number;
    isBoss?: boolean;
    level?: number;
    minLevel?: number;
    maxLevel?: number;
    expReward?: number;
    expMultiplier?: number;
    catchable?: boolean;
    catchRate?: number;
    dropItems?: IOgreDropItem[];
    refreshConfig: IOgreRefreshConfig;
}
/**
 * 地图怪物配置接口
 */
export interface IMapOgreConfig {
    description: string;
    globalSettings: {
        defaultShinyRate: number;
        defaultRefreshInterval: number;
        comment: string;
    };
    maps: {
        [mapId: string]: {
            name: string;
            spawnCount: number;
            randomCount: boolean;
            minCount: number;
            maxCount: number;
            ogres: IMapOgreSlot[];
        };
    };
    comment: string;
}
//# sourceMappingURL=IMapOgreConfig.d.ts.map