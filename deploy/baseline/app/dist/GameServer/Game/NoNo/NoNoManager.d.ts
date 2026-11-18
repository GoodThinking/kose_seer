import { BaseManager } from '../Base/BaseManager';
/**
 * NoNo 管理器
 * 直接操作 PlayerData 中的 NoNo 字段
 */
export declare class NoNoManager extends BaseManager {
    private _isFollowing;
    constructor(player: any);
    /**
     * 初始化（从数据库加载跟随状态）
     */
    Initialize(): Promise<void>;
    /**
     * 登录后处理（在玩家完全初始化后调用）
     * 注意：不自动召唤NoNo，玩家需要手动召唤（和Lua端一致）
     */
    OnLogin(): Promise<void>;
    /**
     * 处理获取 NoNo 信息（官方格式）
     */
    HandleNoNoInfo(): Promise<void>;
    /**
     * 处理 NoNo 治疗
     */
    HandleNoNoCure(): Promise<void>;
    /**
     * 处理 NoNo 玩�?
     */
    HandleNoNoPlay(): Promise<void>;
    /**
     * 处理 NoNo 跟随或回家
     */
    HandleNoNoFollowOrHoom(action: number): Promise<void>;
    /**
     * 处理开启NoNo（玩家手动领取）
     */
    HandleNoNoOpen(): Promise<void>;
    /**
     * 处理修改NoNo昵称
     */
    HandleNoNoChangeName(newName: string): Promise<void>;
    /**
     * 处理NoNo芯片合成
     */
    HandleNoNoChipMixture(): Promise<void>;
    /**
     * 处理NoNo经验管理
     */
    HandleNoNoExpadm(): Promise<void>;
    /**
     * 处理NoNo使用工具
     */
    HandleNoNoImplementTool(toolId?: number): Promise<void>;
    /**
     * 处理修改NoNo颜色
     */
    HandleNoNoChangeColor(newColor?: number): Promise<void>;
    /**
     * 处理获取NoNo芯片
     */
    HandleNoNoGetChip(chipType: number): Promise<void>;
    /**
     * 处理增加NoNo能量和心�?
     */
    HandleNoNoAddEnergyMate(): Promise<void>;
    /**
     * 处理获取钻石数量
     */
    HandleGetDiamond(): Promise<void>;
    /**
     * 处理增加NoNo经验
     */
    HandleNoNoAddExp(_expAmount?: number): Promise<void>;
    /**
     * 处理查询是否有NoNo
     */
    HandleNoNoIsInfo(): Promise<void>;
    /**
     * 处理开启超级NoNo
     */
    HandleNoNoOpenSuper(): Promise<void>;
    /**
     * 处理NoNo帮助经验
     */
    HandleNoNoHelpExp(): Promise<void>;
    /**
     * 处理NoNo心情变化
     */
    HandleNoNoMateChange(delta?: number): Promise<void>;
    /**
     * 处理NoNo充电
     */
    HandleNoNoCharge(): Promise<void>;
    /**
     * 处理NoNo开始执行任�?
     */
    HandleNoNoStartExe(): Promise<void>;
    /**
     * 处理NoNo结束执行任务
     */
    HandleNoNoEndExe(): Promise<void>;
    /**
     * 处理NoNo开�?关闭
     */
    HandleNoNoCloseOpen(_action: number): Promise<void>;
    /**
     * 处理NoNo执行列表
     */
    HandleNoNoExeList(): Promise<void>;
    /**
     * 处理开启超级NoNo (CMD 80001)
     */
    HandleOpenSuperNono(): Promise<void>;
}
//# sourceMappingURL=NoNoManager.d.ts.map