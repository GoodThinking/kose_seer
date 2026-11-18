import { BaseManager } from '../Base/BaseManager';
/**
 * 系统管理器
 * 处理系统相关的复杂业务逻辑
 */
export declare class SystemManager extends BaseManager {
    private static readonly OFFICIAL_MAPS;
    /**
     * 处理获取地图热度
     * 复杂逻辑：需要查询所有地图的在线人数
     */
    HandleMapHot(): Promise<void>;
}
//# sourceMappingURL=SystemManager.d.ts.map