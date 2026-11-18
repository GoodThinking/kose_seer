import { TaskData } from '../../../DataBase/models/TaskData';
import { PlayerInstance } from '../Player/PlayerInstance';
import { BaseManager } from '../Base/BaseManager';
import { GameEventBus } from '../Event/GameEventBus';
/**
 * 任务管理器
 * 负责任务相关的业务逻辑
 *
 * 架构：Manager 持有 TaskData，提供业务逻辑方法
 */
export declare class TaskManager extends BaseManager {
    /** 任务数据 */
    TaskData: TaskData;
    constructor(player: PlayerInstance);
    /**
     * 注册事件监听
     * - 战斗结束: 检查击杀类任务进度
     * - 物品获得: 检查收集类任务进度
     * - 精灵获得: 检查精灵收集类任务进度
     */
    RegisterEvents(eventBus: GameEventBus): void;
    private OnBattleEnd;
    private OnItemGained;
    private OnPetObtained;
    /**
     * 初始化任务管理器
     */
    Initialize(): Promise<void>;
    /**
     * 获取任务状态数组（用于登录响应等）
     */
    GetTaskStatusArray(): number[];
    /**
     * 获取任务总数
     */
    GetTaskCount(): number;
    /**
     * 检查任务是否已接受
     */
    IsTaskAccepted(taskId: number): boolean;
    /**
     * 接受任务（业务逻辑）
     */
    AcceptTask(taskId: number): Promise<void>;
    /**
     * 完成任务（业务逻辑）
     */
    CompleteTask(taskId: number, param: number): Promise<void>;
    /**
     * 设置任务缓存值（业务逻辑）
     */
    SetTaskBufferValue(taskId: number, index: number, value: number): Promise<void>;
    /**
     * 获取任务缓存（只读，不需要标记保存）
     */
    GetTaskBuffer(taskId: number): number[];
}
//# sourceMappingURL=TaskManager.d.ts.map