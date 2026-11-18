/**
 * 玩家管理服务
 */
export declare class PlayerService {
    /**
     * 获取玩家列表
     */
    getPlayers(page: number, limit: number, search?: string, onlineOnly?: boolean): Promise<any>;
    /**
     * 获取玩家详情（包含精灵、任务等详细信息）
     */
    getPlayerDetail(uid: number): Promise<any>;
    /**
     * 修改玩家数据
     */
    updatePlayer(uid: number, field: string, value: any): Promise<void>;
    /**
     * 修改账号信息（邮箱、密码）
     */
    updateAccount(uid: number, email?: string, password?: string): Promise<void>;
    /**
     * 封禁/解封玩家
     * @param uid 玩家ID
     * @param banType 封禁类型 (0=解封, 1=24小时, 2=7天, 3=14天, 4=永久)
     * @param reason 封禁原因
     */
    banPlayer(uid: number, banType: number, reason?: string): Promise<void>;
    /**
     * 踢出玩家
     */
    kickPlayer(uid: number, reason?: string): Promise<void>;
}
//# sourceMappingURL=PlayerService.d.ts.map